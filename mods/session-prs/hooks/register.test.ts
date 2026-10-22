import { expect, test } from 'claude-code/testing'

import { group, prUrls, summarizeChecks } from './register'

test('extracts PR URLs once each', () => {
  const found = prUrls('Created https://github.com/acme/web-app/pull/6600\nsee https://github.com/acme/web-app/pull/6600 and https://github.com/acme/api/pull/12')
  expect(found.map(p => `${p.repo}#${p.number}`)).toEqual(['acme/web-app#6600', 'acme/api#12'])
})

test('summarizes checks with failing names', () => {
  expect(summarizeChecks([]).state).toBe('none')
  expect(summarizeChecks([{ conclusion: 'SUCCESS' }, { conclusion: 'SKIPPED' }])).toEqual({ state: 'pass', total: 2, running: 0, failing: [] })
  expect(summarizeChecks([{ conclusion: 'SUCCESS' }, { status: 'IN_PROGRESS' }]).state).toBe('running')
  expect(
    summarizeChecks([
      { name: 'lint', conclusion: 'FAILURE', detailsUrl: 'https://ci/lint' },
      { context: 'codecov', state: 'ERROR' },
      { name: 'e2e', status: 'QUEUED' },
    ]),
  ).toEqual({
    state: 'fail',
    total: 3,
    running: 1,
    failing: [{ name: 'lint', url: 'https://ci/lint' }, { name: 'codecov', url: undefined }],
  })
})

test('groups ready, drafts, merged and closed in order', () => {
  const pr = (number: number, state: string, isDraft = false) => ({ url: `u${number}`, repo: 'o/r', number, state, isDraft })
  const g = group([pr(1, 'OPEN', true), pr(2, 'MERGED'), pr(3, 'OPEN'), pr(4, 'CLOSED'), pr(5, 'OPEN'), pr(6, 'MERGED')])
  expect(g.ready.map(p => p.number)).toEqual([3, 5])
  expect(g.drafts.map(p => p.number)).toEqual([1])
  expect(g.merged.map(p => p.number)).toEqual([2, 6])
  expect(g.closed.map(p => p.number)).toEqual([4])
})
