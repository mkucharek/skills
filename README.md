# skills

Writing skills for Claude Code, Codex, and other Agent Skills hosts, plus a Claude Code PR pane.

| Plugin | What it does |
| --- | --- |
| [`session-prs`](mods/session-prs) | Claude Code mod: a side pane listing the pull requests the current session works on, with live review and CI status. |
| [`writing`](plugins/writing) | Skills for writing to three readers: `writing-for-humans`, `writing-for-engineers` and `writing-for-agents`. |

## Install

Choose one installation method per host to avoid duplicate skills.

### Claude Code plugin

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

### Codex plugin

Add this repo as a plugin marketplace and install writing:

```sh
codex plugin marketplace add mkucharek/skills
codex plugin add writing@mkucharek
```

Alternatively, after adding the marketplace, select **Maciej Kucharek's skills** in the desktop plugin directory and install **writing**. Restart the app if the marketplace does not appear. This marketplace contains only the writing plugin; `session-prs` requires Claude Code's mod APIs.

See [OpenAI's plugin packaging and marketplace guide](https://developers.openai.com/plugins/build/plugins) for supported surfaces and setup.

### Codex and other agents through the Skills CLI

Use the [Skills CLI](https://github.com/vercel-labs/skills) to install the same skill folders directly. It requires Node.js 22.20 or later as of 2026-10-30.

```sh
# Install all three writing skills for Codex across projects.
npx skills add mkucharek/skills --skill writing-for-humans writing-for-engineers writing-for-agents -a codex -g

# Or install for both Claude Code and Codex.
npx skills add mkucharek/skills --skill writing-for-humans writing-for-engineers writing-for-agents -a claude-code codex -g

# Or choose skills and agents interactively, including Cursor and OpenCode.
npx skills add mkucharek/skills -g
```

Omit `-g` for a project install. This installs writing skills only; it does not install the PR pane. Use `npx skills check` to check for updates and `npx skills update` to apply them.

### Manual installation

Copy each complete folder under `plugins/writing/skills/` into the host's skill directory. Include references and scripts, not just `SKILL.md`.

| Host | Personal skills | Project skills |
| --- | --- | --- |
| Claude Code | `~/.claude/skills/` | `.claude/skills/` |
| Codex | `~/.agents/skills/` | `.agents/skills/` |

For example, Codex should see `~/.agents/skills/writing-for-humans/SKILL.md`. See the [Claude Code](https://code.claude.com/docs/en/skills) and [Codex](https://learn.chatgpt.com/docs/build-skills) discovery docs. Other hosts use the same folders in their documented skill location.

The engineer skill's checker requires Python 3 and shell access. Without them, the skill uses a manual check and reports that limitation.

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

The agent picks a skill from what you ask for, or you select it explicitly:

| Installation | Example |
| --- | --- |
| Claude Code plugin | `/writing:writing-for-humans` |
| Claude Code direct skill | `/writing-for-humans` |
| Codex direct skill | `$writing-for-humans` |
| Codex plugin | Select the writing skill from the skill picker; plugin names may be prefixed. |

The writing rules share one source under `plugins/writing/skills/`. Claude's manifest and the portable `plugin.json` package that same directory. Each skill's `agents/openai.yaml` supplies its Codex display name and short description.

## Develop

```sh
claude plugin validate .
claude plugin test mods/session-prs
```

Bump the changed plugin's version: installs are cached by version. For writing, keep `plugins/writing/plugin.json` and `plugins/writing/.claude-plugin/plugin.json` at the same version. The PR pane has its own version in `mods/session-prs/.claude-plugin/plugin.json`.

Check writing skill discovery without installing:

```sh
npx skills add ./plugins/writing --list
claude plugin validate plugins/writing
```

Keep host-specific invocation settings in the files described by [SKILL-MECHANICS.md](plugins/writing/skills/writing-for-agents/SKILL-MECHANICS.md). Writing skills use automatic discovery by default.

## License

MIT, see [LICENSE](LICENSE). Parts adapted from other MIT projects keep their own notices in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
