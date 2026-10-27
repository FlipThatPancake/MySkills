# Platform compatibility and project loaders

## Shared contract

Use a folder containing `SKILL.md`, with YAML `name` and `description`, as the portable source. Keep supporting files with it. Follow the Agent Skills naming and length limits; host-managed installation may assign a different storage directory.

The open specification also defines `license`, `compatibility`, `metadata`, and experimental `allowed-tools`. Add these only for a real need and after checking every target. Host extensions belong in a separately generated variant or host configuration; keep the underlying procedure shared.

Check four distinct things before claiming compatibility:

1. **Format:** the host accepts the package and metadata.
2. **Discovery:** the host can find and activate it.
3. **Capabilities:** required tools, files, runtimes, network, and dependencies exist.
4. **Behavior:** representative tasks work in that host.

An instruction-only chat may follow pasted guidance while being unable to run scripts or read repository files. Describe that limit accurately.

## Host details

These are reference points checked on 2026-10-27, not permanent installation rules. Prefer the active host's instructions and current official documentation when performing an installation.

| Host | Local discovery or invocation | Adaptation |
| --- | --- | --- |
| Claude Code | Project `.claude/skills/<name>/`; personal `~/.claude/skills/<name>/`; `/skill-name` | Fields such as `disable-model-invocation`, hooks, argument substitutions, and dynamic shell injection are Claude Code features. Verify support before using them. |
| Claude chat/API | Uses its own upload, enablement, and API mechanisms | Claude Code-only fields can cause packaging/upload errors; Code-only body features do not execute here. |
| Local Codex | Repository `.agents/skills/<name>/`; personal `~/.agents/skills/<name>/`; `$skill-name` or `/skills` | Optional `agents/openai.yaml` configures OpenAI UI, invocation policy, and dependencies. Follow its current schema. |
| ChatGPT | Skill availability depends on the surface and installation or plugin mechanism; supported skill selection uses `@` | Use the active creator/installer workflow for hosted personal skills. Do not treat a cloud-managed checkout path as a public cross-platform location. |

Do not use `paths` frontmatter as a universal skill trigger. A project may implement routing that reads it; that behavior is not guaranteed by the shared format. Do not translate tool names by guesswork: inspect the available tool interface and describe required capabilities when an exact name is not portable.

A tool allowlist or invocation setting is not universal authorization. Keep actual access control in the host or tool. Likewise, a prompt cannot guarantee exactly-once effects, transaction safety, or mandatory ordering; enforce critical guarantees in code when needed.

## One source, several destinations

Keep a canonical skill directory in the user's source repository. Copy or generate complete host packages from it when needed; avoid separate hand-maintained procedures. If the repository already distributes copies, use its synchronization convention and check that shared content stays identical. A repository directory is not automatically an installed skill.

Use optional metadata only when needed. For OpenAI metadata, keep its display text and default prompt consistent with the skill; avoid adding dependencies the workflow does not require.

## Sibling instructions for a ChatGPT project

Use a short loader that identifies the scope, canonical source, conditional references, and access fallback. A URL tells the agent where to retrieve guidance; it does not install the skill or prove the files were read. ChatGPT project settings must be changed through an available supported mechanism or by the user.

Keep the project loader with the repository's instruction templates, outside the installable skill.

When loading any repository skill:

1. Reuse a complete copy already read in the session while it remains current. Refresh if an edit, conflicting version, or requested revision makes it stale.
2. Otherwise read `SKILL.md` through an available repository tool, local checkout, or web retrieval. Resolve relative references against its directory. Retrieve all files needed by the current branch of the workflow, including truncated portions.
3. Use one revision for the main file and its supporting resources. When fetching a changing branch, resolve a commit when practical so a mid-task update cannot mix versions.
4. If retrieval fails, state which guidance is unavailable. Use a verified available copy if suitable; otherwise request the missing content for dependent work and continue useful independent work. Do not claim to have followed unread files.
