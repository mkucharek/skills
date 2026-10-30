# Skill mechanics

The skill-specific branch of [`writing-for-agents`](SKILL.md): frontmatter, invocation, and router skills. The writing principles live in `SKILL.md`.

## Portable packaging

Keep one `SKILL.md` per skill, with a lowercase, hyphenated `name` and a `description` stating what it does and when to use it. Keep scripts and references inside the skill directory, and resolve their paths from that directory. A plugin namespace belongs to the host's invocation syntax, not to the shared skill name.

Host-specific configuration belongs in its supported metadata file. A field understood by one host does not control another. Check the target host's documentation when changing invocation policy.

## Invocation

Two choices trade context load against cognitive load:

- **Automatic discovery** gives the agent a description it can use to select the skill. Users can also invoke it explicitly. Keep descriptions concise and specific: this pointer spends context before the body is loaded.
- **Explicit-only invocation** leaves selection to the user. It reduces discovery context but makes the user responsible for remembering the skill. Preserve an existing policy; for new skills, use automatic discovery unless the user requests explicit-only behavior.

As of 2026-10-30:

| Host | Automatic discovery (default) | Explicit-only setting | Explicit invocation |
| --- | --- | --- | --- |
| Claude Code | Omit `disable-model-invocation` or set it to `false` in `SKILL.md` frontmatter. | Set `disable-model-invocation: true` in frontmatter. | `/skill-name`, or `/plugin-name:skill-name` for plugin installs. |
| Codex | Omit `policy.allow_implicit_invocation` or set it to `true` in `agents/openai.yaml`. | Set `policy.allow_implicit_invocation: false` in `agents/openai.yaml`. | `$skill-name`; select the installed name if a plugin adds a namespace. |
| Other Agent Skills hosts | Keep `name` and `description`; check how the host discovers skills. | Use the host's documented setting, if supported. | Use the host's skill selector or invocation syntax. |

Keep `description` in both modes. The host controls whether it exposes that description to the model. These settings affect discovery and invocation, not filesystem access or permission to act.

Sources: [Claude Code skills](https://code.claude.com/docs/en/skills), [Codex skills](https://learn.chatgpt.com/docs/build-skills), and the [Agent Skills specification](https://agentskills.io/specification).

## Splitting by invocation

Split a skill when a distinct task needs independent discovery or a different invocation policy. Each new description adds context load, so independent reach must earn that cost.

When several skills need the same reference, give it one authoritative home and link to it explicitly. If skills can be installed separately, keep required resources inside each package boundary or declare the dependency. A sibling skill may be absent.

## Router skills

A router skill names related skills and explains when each applies. Resolve names through the host's available skill list. A router cannot override another skill's explicit-only policy; ask the user to invoke that skill when the host requires it.
