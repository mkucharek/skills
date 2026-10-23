# skills

Claude Code plugins I use day to day.

| Plugin | What it does |
| --- | --- |
| [`session-prs`](mods/session-prs) | Mod: a side pane listing the pull requests the current session works on, with live review and CI status. |
| [`writing`](plugins/writing) | Skills for writing to three readers: `writing-for-humans`, `writing-for-engineers` and `writing-for-agents`. |

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install session-prs --marketplace mkucharek/skills
/plugin install writing --marketplace mkucharek/skills
```

Answer `y` to add the marketplace, then pick a scope. From a shell:

```sh
claude plugin install session-prs --marketplace mkucharek/skills
claude plugin install writing --marketplace mkucharek/skills
```

In the desktop app, where `/plugin` does not run: click + next to the prompt box, then Plugins, Add marketplace with `mkucharek/skills`, then Add plugin.

`session-prs` calls the GitHub CLI, so `gh` must be installed and signed in (`gh auth login`).

## session-prs

The pane opens when the session first works on a PR, and lists each PR with what the session did to it:

- **opened**: `gh pr create`, or a GitHub MCP `create_pull_request`.
- **changed**: `gh pr edit`, `merge`, `ready`, `close` or `reopen`; `gh api` writes to `repos/…/pulls/N`; a `git push` of a branch that has a PR.
- **reviewed**: `gh pr review` or `gh pr comment`; GitHub MCP review and comment tools.
- **related**: a PR the agent only read but judged part of the task, added through the mod's `track_pr` tool. Ask the agent to add a PR and it uses the same tool.

PRs the session only reads (`gh pr view`, `diff`, `checks`) stay out unless the agent tracks them. Commands may name a PR by number, branch or URL; with none, the PR of the current branch is used. `cd`, `-R` and `GH_REPO` are honoured. Subagents skip the current-branch case, since they may run in a worktree of their own.

Sections: Ready for review and Drafts (open), Merged and Closed (collapsed), each shown only when it holds a PR. Each row shows the link, title, review decision and checks (pass, running, or failing with links to the failing runs), refreshed through `gh pr view` every 2 minutes.

Under each title is a 1-2 sentence summary of what the PR does. Haiku writes it from the title, description and changed files, and writes it again when any of those change; a push that only adds lines to files already listed does not trigger a rewrite. To turn summaries off, set **PR summaries** to off in `/config`.

Linear ticket keys such as `ENG-123` in titles and summaries link to Linear once you set **Linear workspace** in `/config` to your workspace's URL slug (the `acme` in `linear.app/acme`).

`/session-prs` opens the pane. It also takes `add <url>`, `remove <url|#n>`, `refresh` and `clear`. A PR you remove stays out until the session opens it or you add it again.

## writing

Three skills, one per reader. Each points to the others when the reader is not its own.

| Skill | Use it for |
| --- | --- |
| [`writing-for-humans`](plugins/writing/skills/writing-for-humans/SKILL.md) | Email, Slack, announcements, status updates, posts and other text for a non-engineering reader. Scrubs the signs of AI writing, using a tell catalog based on Wikipedia's *Signs of AI writing* and Tim Harris's skills. |
| [`writing-for-engineers`](plugins/writing/skills/writing-for-engineers/SKILL.md) | Architecture docs, runbooks, decision records and write-ups, in STE-lite: about 80% of ASD-STE100. `scripts/prose_check.py <file>` checks sentence and paragraph lengths. |
| [`writing-for-agents`](plugins/writing/skills/writing-for-agents/SKILL.md) | `SKILL.md`, `CLAUDE.md`, `AGENTS.md` and rules files: writing them so agents follow them, and pruning them. Matt Pocock's skill with additions from Tim Harris. |

The agent picks a skill from what you ask for, or you name it: `/writing:writing-for-humans`.

## Develop

```sh
claude plugin validate .
claude plugin test mods/session-prs
```

Bump `version` in `mods/session-prs/.claude-plugin/plugin.json` with each change: installs are cached by version.

## License

MIT, see [LICENSE](LICENSE). Parts adapted from other MIT projects keep their own notices in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
