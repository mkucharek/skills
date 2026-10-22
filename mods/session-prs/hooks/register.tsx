import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Activity, Ci, Pr, SectionKey } from '../types'

const PANE = 'session-prs'
const REFRESH_MS = 120_000
const MAX_FAILING_SHOWN = 5
const PR_URL = /https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/pull\/(\d+)/g
const API_PR = /^\/?repos\/([^/]+\/[^/]+)\/pulls\/(\d+)(\/[\w/]*)?/
const ACTIVITY_ORDER: Activity[] = ['opened', 'changed', 'reviewed', 'related']
const TOOL = 'track_pr'
const GH_PR: Record<string, Activity> = {
  create: 'opened',
  review: 'reviewed',
  comment: 'reviewed',
  edit: 'changed',
  merge: 'changed',
  ready: 'changed',
  close: 'changed',
  reopen: 'changed',
  'update-branch': 'changed',
  revert: 'changed',
}
// Runs argv in $0, expanding a leading ~ the way the shell would have.
const IN_DIR = 'd=$0; case $d in "~"|"~/"*) d=$HOME${d#"~"};; esac; cd "$d" && exec "$@"'
const FAILED = ['FAILURE', 'ERROR', 'TIMED_OUT', 'CANCELLED', 'ACTION_REQUIRED', 'STARTUP_FAILURE']
const RUNNING = ['', 'PENDING', 'QUEUED', 'IN_PROGRESS', 'EXPECTED', 'WAITING', 'REQUESTED']
const SECTIONS: { key: SectionKey; title: string }[] = [
  { key: 'ready', title: 'Ready for review' },
  { key: 'drafts', title: 'Drafts' },
  { key: 'merged', title: 'Merged' },
  { key: 'closed', title: 'Closed' },
]

const prs = atom({ plugin: 'session-prs', key: 'prs' } as const, [])
const dismissed = atom({ plugin: 'session-prs', key: 'dismissed' } as const, [])
const openSections = atom({ plugin: 'session-prs', key: 'openSections' } as const, {
  ready: true,
  drafts: true,
  merged: false,
  closed: false,
})

type RollupItem = {
  name?: string
  context?: string
  conclusion?: string
  state?: string
  status?: string
  detailsUrl?: string
  targetUrl?: string
}

export function prUrls(text: string): Pr[] {
  const found = new Map<string, Pr>()
  for (const m of text.matchAll(PR_URL)) {
    const url = `https://github.com/${m[1]}/pull/${m[2]}`
    found.set(url, { url, repo: m[1] ?? '', number: Number(m[2]) })
  }
  return [...found.values()]
}

export function summarizeChecks(rollup: readonly RollupItem[]): Ci {
  const failing: Ci['failing'] = []
  let running = 0
  for (const c of rollup) {
    const s = (c.conclusion || c.state || c.status || '').toUpperCase()
    if (FAILED.includes(s)) failing.push({ name: c.name || c.context || 'unnamed check', url: c.detailsUrl || c.targetUrl || undefined })
    else if (RUNNING.includes(s)) running++
  }
  const state = rollup.length === 0 ? 'none' : failing.length > 0 ? 'fail' : running > 0 ? 'running' : 'pass'
  return { state, total: rollup.length, running, failing }
}

// What the session did to a PR, strongest first; "related" only when it did
// nothing else.
export function activityLabel(p: Pr): string {
  const acts = ACTIVITY_ORDER.filter(a => activitiesOf(p).includes(a))
  return (acts.length > 1 ? acts.filter(a => a !== 'related') : acts).join(', ')
}

export function group(list: readonly Pr[]): Record<SectionKey, Pr[]> {
  const isOpen = (p: Pr) => p.state !== 'MERGED' && p.state !== 'CLOSED'
  return {
    ready: list.filter(p => isOpen(p) && !p.isDraft),
    drafts: list.filter(p => isOpen(p) && p.isDraft),
    merged: list.filter(p => p.state === 'MERGED'),
    closed: list.filter(p => p.state === 'CLOSED'),
  }
}

// A PR the session worked on: a URL, or a selector (number, branch, or none for
// the current branch) that `gh pr view` resolves in `cwd` against `repo`.
export type Target = { activity: Activity; url?: string; selector?: string; repo?: string; cwd?: string; fromOutput?: boolean }

const isPrUrl = (s: string) => prUrls(s).length > 0
const isDynamic = (s: string) => /[$`]/.test(s)

// Splits a shell command into simple commands' words: quotes removed,
// separators (; & | newline parens) ending a command. Good enough for the
// one-liners an agent runs, not a shell parser.
export function simpleCommands(command: string): string[][] {
  const out: string[][] = [[]]
  let word = ''
  let inWord = false
  let quote: string | undefined
  const end = () => {
    if (inWord) out[out.length - 1]?.push(word)
    word = ''
    inWord = false
  }
  for (let i = 0; i < command.length; i++) {
    const c = command[i] ?? ''
    if (quote) {
      if (c === quote) quote = undefined
      else if (c === '\\' && quote === '"' && i + 1 < command.length) word += command[++i]
      else word += c
    } else if (c === '"' || c === "'") {
      quote = c
      inWord = true
    } else if (c === '\\' && i + 1 < command.length) {
      if (command[i + 1] !== '\n') word += command[i + 1]
      inWord = true
      i++
    } else if (c === ' ' || c === '\t') end()
    else if ('\n;&|()'.includes(c)) {
      end()
      if ((out[out.length - 1]?.length ?? 0) > 0) out.push([])
    } else {
      word += c
      inWord = true
    }
  }
  end()
  return out.filter(w => w.length > 0)
}

function flagValue(args: string[], ...names: string[]): string | undefined {
  for (let i = 0; i < args.length; i++) {
    const a = args[i] ?? ''
    if (names.includes(a)) return args[i + 1]
    const eq = names.find(n => n.startsWith('--') && a.startsWith(`${n}=`))
    if (eq) return a.slice(eq.length + 1)
  }
  return undefined
}

function ghPr(sub: string, args: string[], env: Record<string, string>, cwd?: string): Target | undefined {
  const activity = GH_PR[sub]
  if (!activity) return undefined
  if (activity === 'opened') return { activity, fromOutput: true }
  const repo = flagValue(args, '-R', '--repo') ?? env.GH_REPO
  const first = args[0]
  const selector =
    first !== undefined && !first.startsWith('-') ? first : args.find(a => /^#?\d+$/.test(a) || isPrUrl(a))
  if (selector !== undefined && isDynamic(selector)) return undefined
  if (selector !== undefined && isPrUrl(selector)) return { activity, url: selector }
  return { activity, selector: selector?.replace(/^#/, ''), repo, cwd }
}

function ghApi(args: string[], cwd?: string): Target | undefined {
  const path = args.find(a => API_PR.test(a))
  const m = path?.match(API_PR)
  if (!m) return undefined
  const method = (flagValue(args, '-X', '--method') ?? '').toUpperCase()
  const writes = (method !== '' && method !== 'GET') || args.some(a => /^(-f|-F|--field|--raw-field|--input)$/.test(a))
  if (!writes) return undefined
  const activity: Activity = /reviews|comments/.test(m[3] ?? '') ? 'reviewed' : 'changed'
  const [repo = '', number = ''] = [m[1], m[2]]
  if (repo.includes('{')) return { activity, selector: number, cwd }
  return { activity, url: `https://github.com/${repo}/pull/${number}` }
}

function gitPush(args: string[], cwd?: string): Target | undefined {
  if (args.some(a => /^(-d|--delete|--tags|--all|--mirror)$/.test(a))) return undefined
  const refspecs = args.filter(a => !a.startsWith('-')).slice(1)
  if (refspecs.length > 1) return undefined
  const ref = (refspecs[0] ?? 'HEAD').split(':').pop()?.replace(/^\+?refs\/heads\//, '').replace(/^\+/, '') ?? 'HEAD'
  if (isDynamic(ref)) return undefined
  return { activity: 'changed', selector: ref === 'HEAD' ? undefined : ref, cwd }
}

// The PRs a Bash command works on: `gh pr <sub>`, `gh api repos/../pulls/N`
// and `git push` (the PR whose head is the pushed branch).
export function bashTargets(command: string): Target[] {
  const targets: Target[] = []
  let cwd: string | undefined
  for (const words of simpleCommands(command)) {
    const env: Record<string, string> = {}
    let i = 0
    for (; i < words.length && /^\w+=/.test(words[i] ?? ''); i++) {
      const [k = '', ...v] = (words[i] ?? '').split('=')
      env[k] = v.join('=')
    }
    const [cmd, ...args] = words.slice(i)
    if (cmd === 'cd') cwd = args[0] && !isDynamic(args[0]) ? args[0] : undefined
    let target: Target | undefined
    if (cmd === 'gh' && args[0] === 'pr' && args[1]) target = ghPr(args[1], args.slice(2), env, cwd)
    else if (cmd === 'gh' && args[0] === 'api') target = ghApi(args.slice(1), cwd)
    else if (cmd === 'git') {
      const dir = args[0] === '-C' ? args[1] : undefined
      const rest = dir !== undefined ? args.slice(2) : args
      if (rest[0] === 'push') target = gitPush(rest.slice(1), dir ?? cwd)
    }
    if (target) targets.push(target)
  }
  return targets
}

// The PRs a tool call changes or reviews, from Bash or a GitHub MCP tool.
// Reads are left out: the agent tracks a PR it only looked at through track_pr
// when that PR is part of the work.
export function targetsOf(e: { tool: string; [k: string]: unknown }): Target[] {
  if (e.tool === 'Bash' && typeof e.command === 'string') return bashTargets(e.command)
  if (!e.tool.startsWith('mcp__') || !/pull/i.test(e.tool)) return []
  if (/create_pull_request$/.test(e.tool)) return [{ activity: 'opened', fromOutput: true }]
  const number = e.pull_number ?? e.pullNumber ?? e.number
  if (typeof e.owner !== 'string' || typeof e.repo !== 'string' || !/^\d+$/.test(String(number))) return []
  const name = e.tool.split('__').pop() ?? ''
  const activity = /review|comment/.test(name) ? 'reviewed' : /merge|update|edit|ready|close/.test(name) ? 'changed' : undefined
  if (!activity) return []
  return [{ activity, url: `https://github.com/${e.owner}/${e.repo}/pull/${number}` }]
}

async function resolve($: EngineInterface, t: Target, output: string): Promise<Pr[]> {
  if (t.fromOutput) return prUrls(output)
  if (t.url) return prUrls(t.url)
  const argv = ['gh', 'pr', 'view', ...(t.selector ? [t.selector] : []), ...(t.repo ? ['-R', t.repo] : []), '--json', 'url']
  const { exitCode, stdout } = await $.process.run(t.cwd ? ['sh', '-c', IN_DIR, t.cwd, ...argv] : argv, { timeoutMs: 20_000 })
  if (exitCode !== 0) return []
  return prUrls(String(JSON.parse(stdout).url ?? ''))
}

export function activitiesOf(p: Pr): Activity[] {
  return p.activities ?? ['opened']
}

// Tracks PRs; `activity` undefined is an explicit `/session-prs add`. A PR the
// person removed comes back only when the session opens it or the person asks
// for it again (`requested`). Resolves to the PRs left out as removed.
async function add($: EngineInterface, found: Pr[], activity?: Activity, requested = false): Promise<Pr[]> {
  if (found.length === 0) return []
  const explicit = requested || activity === undefined || activity === 'opened'
  const skip = explicit ? new Set<string>() : new Set(await read($, dismissed))
  if (explicit) await update($, dismissed, d => d.filter(u => !found.some(p => p.url === u)))
  let added = false
  let changed = false
  await update($, prs, list => {
    const next = [...list]
    for (const pr of found) {
      if (skip.has(pr.url)) continue
      const i = next.findIndex(p => p.url === pr.url)
      const known = next[i]
      if (!known) {
        next.push({ ...pr, activities: activity ? [activity] : [] })
        added = true
      } else if (activity && !activitiesOf(known).includes(activity)) {
        next[i] = { ...known, activities: [...activitiesOf(known), activity] }
        changed = true
      }
    }
    return next
  })
  if (added) void $.ui.open({ id: PANE, title: 'Session PRs' })
  if (added || changed) void refresh($).catch(() => undefined)
  return found.filter(p => skip.has(p.url))
}

async function track($: EngineInterface, targets: Target[], output: string) {
  for (const t of targets) await add($, await resolve($, t, output).catch(() => []), t.activity)
}

async function refresh($: EngineInterface) {
  const list = await read($, prs)
  const open = list.filter(p => p.state !== 'MERGED' && p.state !== 'CLOSED')
  const results = await Promise.all(
    open.map(async p => {
      try {
        const { exitCode, stdout } = await $.process.run(
          ['gh', 'pr', 'view', p.url, '--json', 'title,state,isDraft,reviewDecision,statusCheckRollup'],
          { timeoutMs: 20_000 },
        )
        if (exitCode !== 0) return undefined
        const j = JSON.parse(stdout)
        const next: Pr = {
          ...p,
          title: j.title,
          state: j.state,
          isDraft: j.isDraft,
          review: j.reviewDecision || undefined,
          ci: summarizeChecks(j.statusCheckRollup ?? []),
          checkedAt: Date.now(),
        }
        return next
      } catch {
        return undefined
      }
    }),
  )
  const byUrl = new Map(results.filter((r): r is Pr => !!r).map(r => [r.url, r]))
  if (byUrl.size > 0) await update($, prs, l => l.map(p => byUrl.get(p.url) ?? p))
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'session-prs',
      description: 'PRs this session opened, changed, reviewed or tracked: no args opens the pane; add <url>, remove <url|#n>, refresh, clear',
    })
    await $.tool.register({
      name: TOOL,
      description:
        "Add a pull request to the person's Session PRs pane, which lists the PRs this session works on. PRs you open, push to, edit, merge, review or comment on are added by themselves; call this for a PR you only read (gh pr view/diff, the API, a web page) when it is part of the current task: the PR you were asked to look at, fix, test or review, or one the work depends on. Do not call it for PRs you read only for background or examples. Also call it when the person asks you to add a PR to Session PRs, with requested: true.",
      inputSchema: {
        type: 'object',
        properties: {
          pr: { type: 'string', description: 'The PR URL, or its number' },
          repo: { type: 'string', description: 'owner/repo, when pr is a number from a repository other than the current one' },
          requested: { type: 'boolean', description: 'true when the person asked for this PR to be added; brings back one they removed earlier' },
        },
        required: ['pr'],
      },
      isDeferred: false,
    })
    $.clock.every(REFRESH_MS, () => void refresh($).catch(() => undefined))
    if ((await read($, prs)).length > 0) void $.ui.open({ id: PANE, title: 'Session PRs' })
    return next(e)
  })

  on('command.run', { command: 'session-prs' }, async ($, e) => {
    const [verb = '', ...rest] = e.args.trim().split(/\s+/)
    const arg = rest.join(' ')
    if (verb === 'add') {
      const found = prUrls(arg)
      if (found.length === 0) return { text: 'No GitHub PR URL found.' }
      await add($, found)
      return { text: `Tracking ${found.map(p => `${p.repo}#${p.number}`).join(', ')}.` }
    }
    if (verb === 'remove') {
      const n = arg.replace(/^#/, '')
      const gone = (await read($, prs)).filter(p => p.url === arg || String(p.number) === n).map(p => p.url)
      await update($, dismissed, d => [...new Set([...d, ...gone])])
      await update($, prs, l => l.filter(p => !gone.includes(p.url)))
      return { text: 'Removed.' }
    }
    if (verb === 'clear') {
      const gone = (await read($, prs)).map(p => p.url)
      await update($, dismissed, d => [...new Set([...d, ...gone])])
      await update($, prs, () => [])
      return { text: 'Cleared.' }
    }
    if (verb === 'refresh') {
      await refresh($)
      return { text: 'Refreshed.' }
    }
    await $.ui.open({ id: PANE, title: 'Session PRs' })
    return { text: 'Session PRs pane opened.' }
  })

  on('tool.call', { tool: `mcp__session-prs__${TOOL}` }, async ($, e) => {
    const pr = String(e.pr ?? '').trim()
    const repo = typeof e.repo === 'string' && e.repo ? e.repo : undefined
    const target: Target = isPrUrl(pr) ? { activity: 'related', url: pr } : { activity: 'related', selector: pr.replace(/^#/, ''), repo }
    const fail = (text: string) => ({ isError: true as const, result: text, text })
    if (!/^\d+$/.test(target.selector ?? '0')) return fail('pr must be a GitHub PR URL or a number.')
    const found = await resolve($, target, '').catch(() => [])
    if (found.length === 0) return fail(`No PR found for ${pr}${repo ? ` in ${repo}` : ''}.`)
    const removed = await add($, found, 'related', e.requested === true)
    const name = found.map(p => `${p.repo}#${p.number}`).join(', ')
    const text = removed.length > 0 ? `${name} was removed from the pane by the person; left out.` : `Tracking ${name}.`
    return { result: text, text }
  })

  on('tool.call', async ($, e, next) => {
    const ran = await next(e)
    if (ran.deny || ran.isError) return ran
    let targets = targetsOf(e as { tool: string; [k: string]: unknown })
    // A subagent may run in a worktree of its own, so the session's directory
    // says nothing about which branch "the current one" is.
    if (e.agentId) targets = targets.filter(t => t.url || t.fromOutput || t.selector || t.cwd)
    if (targets.length > 0) void track($, targets, ran.text ?? '').catch(() => undefined)
    return ran
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Link, Button } = $.ui.resolve(e)
    const list = await read($, prs)
    const isOpen = await read($, openSections)
    const groups = group(list)
    const shown = SECTIONS.filter(s => groups[s.key].length > 0)
    const width = Math.min(60, (e.props.bodyColumns || 41) - 1)
    const dot = (p: Pr) =>
      p.state === 'MERGED' ? 'magenta' : p.state === 'CLOSED' ? 'gray' : p.isDraft ? 'yellow' : 'green'

    const checks = (ci: Ci) => {
      if (ci.state === 'none') return <Text dimColor>no checks</Text>
      if (ci.state === 'pass') return <Text color="green">✓ checks pass ({ci.total})</Text>
      if (ci.state === 'running') return <Text color="yellow">◌ checks running ({ci.running} of {ci.total})</Text>
      const shown = ci.failing.slice(0, MAX_FAILING_SHOWN)
      const more = ci.failing.length - shown.length
      return (
        <Box flexDirection="column">
          <Text color="red">
            ✗ {ci.failing.length} of {ci.total} checks failing{ci.running > 0 ? `, ${ci.running} running` : ''}
          </Text>
          {shown.map(f => (
            <Text wrap="truncate-end">
              <Text color="red">  · </Text>
              {f.url ? <Link href={f.url} label={f.name} /> : f.name}
            </Text>
          ))}
          {more > 0 && <Text dimColor>  +{more} more</Text>}
        </Box>
      )
    }

    const row = (p: Pr) => (
      <Box flexDirection="column" marginTop={1}>
        <Text>
          <Text color={dot(p)}>● </Text>
          <Link href={p.url} label={`${p.repo.split('/')[1]}#${p.number}`} />
          {activityLabel(p) && <Text color="cyan"> · {activityLabel(p)}</Text>}
          {p.review && <Text dimColor> · {p.review.toLowerCase().replace(/_/g, ' ')}</Text>}
        </Text>
        {p.title && <Text wrap="truncate-end">{p.title}</Text>}
        {p.state === 'OPEN' && p.ci && checks(p.ci)}
      </Box>
    )

    return (
      <Box flexDirection="column">
        {list.length === 0 && <Text dimColor>No PRs worked on this session yet.</Text>}
        {shown.map((s, i) => {
          const head = `${isOpen[s.key] ? '▼' : '►'} ${s.title.toUpperCase()}`
          const count = ` ${groups[s.key].length} `
          const rule = '─'.repeat(Math.max(2, width - head.length - count.length))
          return (
            <Box flexDirection="column" marginTop={i > 0 ? 1 : 0}>
              <Button
                key={`section-${s.key}`}
                plain
                onPress={() => void update($, openSections, o => ({ ...o, [s.key]: !o[s.key] }))}
              >
                <Text bold color="cyan">{head}</Text>
                <Text dimColor>{count}{rule}</Text>
              </Button>
              {isOpen[s.key] && groups[s.key].map(row)}
            </Box>
          )
        })}
      </Box>
    )
  })
}
