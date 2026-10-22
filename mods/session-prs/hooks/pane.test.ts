import type { CommandRunInput, RenderPropsOf } from 'claude-code'
import { expect, test } from 'claude-code/testing'

// Fields the engine stamps on real calls; the pane and command ignore them.
const REFRESH = {} as CommandRunInput
const PANE_PROPS = {} as RenderPropsOf['Pane']

const VIEWS: Record<string, object> = {
  '1': {
    title: 'Ready one',
    state: 'OPEN',
    isDraft: false,
    reviewDecision: 'REVIEW_REQUIRED',
    statusCheckRollup: [
      { name: 'lint', conclusion: 'FAILURE', detailsUrl: 'https://ci/lint' },
      { name: 'unit', conclusion: 'SUCCESS' },
      { name: 'e2e', conclusion: 'SUCCESS' },
    ],
  },
  '2': { title: 'Draft one', state: 'OPEN', isDraft: true, statusCheckRollup: [{ name: 'unit', conclusion: 'SUCCESS' }] },
  '3': { title: 'Merged one', state: 'MERGED', isDraft: false, statusCheckRollup: [] },
}

test('pane shows only filled sections, opens ready + drafts, toggles on press', async ($, on) => {
  on('ui.open', async () => ({ value: { isPlaced: true } }))
  on('tool.call', { tool: 'Bash' }, async (_$, e) => ({
    result: { stdout: '', stderr: '', interrupted: false },
    text: `https://github.com/o/r/pull/${e.command.match(/#(\d)/)?.[1]}`,
  }))
  on('process.run', async (_$, e) => {
    const n = String(e.argv[3]).split('/').pop() ?? ''
    return { value: { exitCode: 0, stdout: JSON.stringify(VIEWS[n]), stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  for (const n of ['1', '2', '3']) await $.tool.call({ tool: 'Bash', command: `gh pr create --title "#${n}"` })
  await $.command.run({ ...REFRESH, command: 'session-prs', args: 'refresh' })

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({
      plugin: 'session-prs',
      surface,
      component: 'Pane',
      requestId: 'session-prs',
      props: { ...PANE_PROPS, title: 'Session PRs', isFocused: false, bodyColumns: 40 },
    })
    expect(await ui.find({ key: 'section-ready' })).toBeDefined()
    expect(await ui.find({ key: 'section-drafts' })).toBeDefined()
    expect(await ui.find({ key: 'section-merged' })).toBeDefined()
    expect(await ui.find({ key: 'section-closed' })).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: /1 of 3 checks failing/ })).toBeDefined()
    expect(await ui.find({ type: 'Link', text: 'lint' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /checks pass \(1\)/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: 'Merged one' })).toBeUndefined()
    await ui.press({ key: 'section-merged' })
    expect(await ui.find({ type: 'Text', text: 'Merged one' })).toBeDefined()
    await ui.press({ key: 'section-ready' })
    expect(await ui.find({ type: 'Text', text: 'Ready one' })).toBeUndefined()
    await ui.press({ key: 'section-merged' })
    await ui.press({ key: 'section-ready' })
    await ui.unmount()
  }
})
