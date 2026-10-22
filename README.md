# skills

Claude Code plugins I use day to day.

| Plugin | What it does |
| --- | --- |
| [`session-prs`](mods/session-prs) | Mod: a side pane listing the pull requests the current session works on, with live review and CI status. |

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install session-prs --marketplace mkucharek/skills
```

Answer `y` to add the marketplace, then pick a scope. From a shell:

```sh
claude plugin install session-prs --marketplace mkucharek/skills
```

In the desktop app, where `/plugin` does not run: click + next to the prompt box, then Plugins, Add marketplace with `mkucharek/skills`, then Add plugin.

The mod calls the GitHub CLI, so `gh` must be installed and signed in (`gh auth login`).

## session-prs

The pane opens when the session first works on a PR, and lists each PR with what the session did to it:

- **opened**: `gh pr create`, or a GitHub MCP `create_pull_request`.
- **changed**: `gh pr edit`, `merge`, `ready`, `close` or `reopen`; `gh api` writes to `repos/…/pulls/N`; a `git push` of a branch that has a PR.
- **reviewed**: `gh pr review` or `gh pr comment`; GitHub MCP review and comment tools.
- **related**: a PR the agent only read but judged part of the task, added through the mod's `track_pr` tool. Ask the agent to add a PR and it uses the same tool.

PRs the session only reads (`gh pr view`, `diff`, `checks`) stay out unless the agent tracks them. Commands may name a PR by number, branch or URL; with none, the PR of the current branch is used. `cd`, `-R` and `GH_REPO` are honoured. Subagents skip the current-branch case, since they may run in a worktree of their own.

Sections: Ready for review and Drafts (open), Merged and Closed (collapsed), each shown only when it holds a PR. Each row shows the link, title, review decision and checks (pass, running, or failing with links to the failing runs), refreshed through `gh pr view` every 2 minutes.

`/session-prs` opens the pane. It also takes `add <url>`, `remove <url|#n>`, `refresh` and `clear`. A PR you remove stays out until the session opens it or you add it again.

## Develop

```sh
claude plugin validate .
claude plugin test mods/session-prs
```

Bump `version` in `mods/session-prs/.claude-plugin/plugin.json` with each change: installs are cached by version.

## License

MIT, see [LICENSE](LICENSE).
