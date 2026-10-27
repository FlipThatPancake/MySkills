# Format, platform differences, and project loaders

## Shared format

The portable source is a folder containing `SKILL.md` with YAML `name` and `description`. Use a lowercase name with digits and single hyphens, 1–64 characters, matching the source folder; managed installers may assign another storage directory. The description is nonempty and at most 1,024 characters.

The open specification also defines `license`, `compatibility`, `metadata`, and experimental `allowed-tools`. Include optional fields only when needed and supported by the targets. Keep the common workflow shared; use host configuration or an exported variant for extensions.

## Host differences

Reference points checked on 2026-10-27; consult the active host's guidance when acting on changing platform details.

| Host | Relevant difference |
| --- | --- |
| Claude Code | Local skills use `.claude/skills/` or `~/.claude/skills/`; `/skill-name` invokes one. Invocation controls, hooks, substitutions, and dynamic shell injection are host features. |
| Claude chat/API | Uses its own upload and enablement mechanisms. Claude Code-only frontmatter can cause upload errors; Code-only body features do not execute here. |
| Local Codex | Local discovery uses `.agents/skills/` and `~/.agents/skills/`; explicit selection uses `$` or `/skills`. Optional `agents/openai.yaml` carries OpenAI-specific configuration. |
| ChatGPT | Availability depends on the surface and installation or plugin mechanism; supported skill selection uses `@`. Hosted installation follows the active creator/installer's rules. |

`paths` is not a universal skill trigger. A project can supply custom routing, but the shared format does not guarantee that behavior. Tool names, permissions, runtimes, and network availability also vary; describe required capabilities rather than assuming one environment's interface exists everywhere.

Format acceptance, discovery, available capabilities, and successful behavior are separate compatibility questions. Claim only the compatibility supported by the available evidence.

## Project loaders

Keep one canonical workflow. A sibling project instruction can identify its scope and source, route to relevant references, and add project-specific preferences such as review before edits. Avoid repeating the skill's procedure in the loader.

A repository link does not install or load a skill. Retrieve the main file and needed resources from a consistent revision, or use an already-read current copy. If required content is inaccessible, use a suitable verified copy or request the missing material for dependent work.
