import { expect, test } from 'claude-code/testing'

import { group, prUrls, summarizeChecks, summarySource, ticketPieces } from './register'

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

test('splits text around Linear ticket keys, not look-alikes', () => {
  expect(ticketPieces('ENG-123: fix UTF-8 parsing (see ab-1, APP2-45)')).toEqual([
    { key: 'ENG-123' },
    ': fix UTF-8 parsing (see ab-1, ',
    { key: 'APP2-45' },
    ')',
  ])
  expect(ticketPieces('no tickets')).toEqual(['no tickets'])
})

test('summary hash follows title, body and paths, not line counts', () => {
  const a = summarySource('t', 'b', [{ path: 'x.ts', additions: 1, deletions: 0 }])
  expect(summarySource('t', 'b', [{ path: 'x.ts', additions: 9, deletions: 4 }]).hash).toBe(a.hash)
  expect(summarySource('t', 'b2', [{ path: 'x.ts' }]).hash).not.toBe(a.hash)
  expect(summarySource('t', 'b', [{ path: 'y.ts' }]).hash).not.toBe(a.hash)
  expect(a.prompt).toContain('x.ts (+1 -0)')
})
