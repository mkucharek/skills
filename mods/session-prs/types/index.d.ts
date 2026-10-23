export type FailingCheck = { name: string; url?: string }

export type Ci = {
  state: 'pass' | 'fail' | 'running' | 'none'
  total: number
  running: number
  failing: FailingCheck[]
}

// How the session worked on a PR: opened it, changed it (pushed, edited,
// merged), reviewed or commented on it, or the agent marked one it read as
// part of the work (track_pr).
export type Activity = 'opened' | 'changed' | 'reviewed' | 'related'

export type Pr = {
  url: string
  repo: string
  number: number
  title?: string
  state?: string
  isDraft?: boolean
  review?: string
  ci?: Ci
  checkedAt?: number
  // A 1-2 sentence summary of what the PR does, and a hash of the title,
  // body and files it was written from, so an edited PR is summarized again.
  summary?: string
  summaryOf?: string
  // Absent on PRs tracked before activities were recorded: those were opened.
  activities?: Activity[]
}

export type SectionKey = 'ready' | 'drafts' | 'merged' | 'closed'

declare module 'claude-code' {
  interface PluginState {
    'session-prs': { prs: Pr[]; openSections: Record<SectionKey, boolean>; dismissed: string[] }
  }
}
