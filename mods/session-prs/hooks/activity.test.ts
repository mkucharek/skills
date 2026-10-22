import type { CommandRunInput, RenderPropsOf } from 'claude-code'
import { expect, test } from 'claude-code/testing'

import { activityLabel, bashTargets, targetsOf } from './register'

const REFRESH = {} as CommandRunInput
const PANE_PROPS = {} as RenderPropsOf['Pane']

test('finds the PR each gh pr subcommand works on', () => {
  expect(bashTargets('gh pr edit https://github.com/o/r/pull/7 --add-label x')).toEqual([{ activity: 'changed', url: 'https://github.com/o/r/pull/7' }])
  expect(bashTargets('cd ~/w/app && gh pr review --approve 34 -R o/app')).toEqual([
    { activity: 'reviewed', selector: '34', repo: 'o/app', cwd: '~/w/app' },
  ])
  expect(bashTargets('gh pr comment -b "fixed; see #9" 5')[0]).toMatchObject({ activity: 'reviewed', selector: '5' })
  expect(bashTargets('gh pr merge --squash')).toEqual([{ activity: 'changed', selector: undefined, repo: undefined, cwd: undefined }])
  expect(bashTargets('GH_REPO=o/x gh pr ready 3')[0]).toMatchObject({ selector: '3', repo: 'o/x' })
  expect(bashTargets('gh pr create --title t --body "$(cat <<EOF\nbody\nEOF\n)"')).toEqual([{ activity: 'opened', fromOutput: true }])
})

test('leaves reads to the agent, and skips commands it cannot pin to one PR', () => {
  expect(bashTargets('gh pr view 12 --json title && gh pr diff 12 && gh pr checks 12')).toEqual([])
  expect(bashTargets('gh api repos/o/r/pulls/8/files')).toEqual([])
  expect(bashTargets('gh pr list --author @me')).toEqual([])
  expect(bashTargets('gh pr status')).toEqual([])
  expect(bashTargets('for n in 1 2; do gh pr merge $n; done')).toEqual([])
  expect(bashTargets('echo "gh pr merge 12"')).toEqual([])
  expect(bashTargets('git push --delete origin old')).toEqual([])
})

test('reads gh api pulls paths and git push', () => {
  expect(bashTargets('gh api repos/o/r/pulls/8/reviews -f event=APPROVE')[0]).toMatchObject({ activity: 'reviewed' })
  expect(bashTargets('gh api -X PATCH repos/{owner}/{repo}/pulls/8 -f title=x')).toEqual([{ activity: 'changed', selector: '8', cwd: undefined }])
  expect(bashTargets('git -C /w/app push -u origin HEAD:feat/x')).toEqual([{ activity: 'changed', selector: 'feat/x', cwd: '/w/app' }])
  expect(bashTargets('git add -A && git commit -m "x" && git push')).toEqual([{ activity: 'changed', selector: undefined, cwd: undefined }])
})

test('reads GitHub MCP write tools, not reads', () => {
  const pr = 'https://github.com/o/r/pull/4'
  expect(targetsOf({ tool: 'mcp__github__get_pull_request', owner: 'o', repo: 'r', pull_number: 4 })).toEqual([])
  expect(targetsOf({ tool: 'mcp__github__create_pull_request_review', owner: 'o', repo: 'r', pullNumber: 4 })[0]).toMatchObject({ activity: 'reviewed' })
  expect(targetsOf({ tool: 'mcp__github__merge_pull_request', owner: 'o', repo: 'r', pull_number: 4 })).toEqual([{ activity: 'changed', url: pr }])
  expect(targetsOf({ tool: 'mcp__github__get_issue', owner: 'o', repo: 'r', issue_number: 4 })).toEqual([])
  expect(targetsOf({ tool: 'WebFetch', url: `${pr}/files`, prompt: '' })).toEqual([])
})

test('labels a PR by what the session did, related only when alone', () => {
  const pr = { url: 'u', repo: 'o/r', number: 1 }
  expect(activityLabel(pr)).toBe('opened')
  expect(activityLabel({ ...pr, activities: ['related'] })).toBe('related')
  expect(activityLabel({ ...pr, activities: ['related', 'reviewed', 'changed'] })).toBe('changed, reviewed')
  expect(activityLabel({ ...pr, activities: [] })).toBe('')
})

test('the agent tracks a read PR, review upgrades it, a removed one stays away until the person asks', async ($, on) => {
  on('ui.open', async () => ({ value: { isPlaced: true } }))
  on('tool.call', { tool: 'Bash' }, async () => ({ result: { stdout: '', stderr: '', interrupted: false }, text: 'ok' }))
  on('process.run', async (_$, e) => {
    const stdout = e.argv.includes('url')
      ? JSON.stringify({ url: `https://github.com/o/r/pull/${e.argv[3]}` })
      : JSON.stringify({ title: `PR ${String(e.argv[3]).split('/').pop()}`, state: 'OPEN', isDraft: false, statusCheckRollup: [] })
    return { value: { exitCode: 0, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  const label = async (text: RegExp) => {
    const ui = await $.ui.mount({
      plugin: 'session-prs',
      surface: 'terminal',
      component: 'Pane',
      requestId: 'session-prs',
      props: { ...PANE_PROPS, title: 'Session PRs', isFocused: false, bodyColumns: 60 },
    })
    const found = await ui.find({ type: 'Text', text })
    await ui.unmount()
    return found
  }

  await $.tool.call({ tool: 'Bash', command: 'gh pr view 21' })
  await $.command.run({ ...REFRESH, command: 'session-prs', args: 'refresh' })
  expect(await label(/No PRs worked on/)).toBeDefined()

  const tracked = await $.tool.call({ tool: 'mcp__session-prs__track_pr', pr: '21' })
  expect(tracked.text).toBe('Tracking o/r#21.')
  await $.command.run({ ...REFRESH, command: 'session-prs', args: 'refresh' })
  expect(await label(/related/)).toBeDefined()

  await $.tool.call({ tool: 'Bash', command: 'gh pr review 21 --approve' })
  await $.command.run({ ...REFRESH, command: 'session-prs', args: 'refresh' })
  expect(await label(/reviewed/)).toBeDefined()

  await $.command.run({ ...REFRESH, command: 'session-prs', args: 'remove #21' })
  expect((await $.tool.call({ tool: 'mcp__session-prs__track_pr', pr: 'https://github.com/o/r/pull/21' })).text).toMatch(/removed .* by the person/)
  await $.tool.call({ tool: 'Bash', command: 'gh pr comment 21 -b hi' })
  await $.command.run({ ...REFRESH, command: 'session-prs', args: 'refresh' })
  expect(await label(/No PRs worked on/)).toBeDefined()

  const asked = await $.tool.call({ tool: 'mcp__session-prs__track_pr', pr: '#21', requested: true })
  expect(asked.text).toBe('Tracking o/r#21.')
  await $.command.run({ ...REFRESH, command: 'session-prs', args: 'refresh' })
  expect(await label(/related/)).toBeDefined()
})
