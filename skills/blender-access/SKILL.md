---
name: blender-access
description: Choose or troubleshoot Blender access for live edits, saved files, scripts, renders, and validation. Find installed add-ons for generation and specialist edits, or search asset libraries for reusable assets. Also use for image cards, billboards, impostors, and distant asset optimization.
---

# Blender access

Honor the user's integration choice. Check which tools are available and open
only the reference needed for the current step.

- [MCP for Blender (ahujasid)](references/ahuja.md) is the live default when connected.
- [Blender Lab MCP](references/blender-lab.md) for live fallback, Blender docs, and file diagnostics.
- [Blender Agent Studio](references/agent-studio.md) for independent asset checks and repeatable renders.
- [Blender CLI](references/blender-cli.md) for saved-file scripts and batch jobs.
- [Higgsfield Bridge](references/higgsfield.md) for Higgsfield-specific or cross-app work.

Confirm the target before live edits and use one editing controller per scene at
a time. For visual work, inspect a viewport capture or render at useful
checkpoints. Report any gap in visual verification.

## Reuse assets

When a ready-made asset could fit the brief, offer to search the user's
installed libraries. For a requested search, go straight to discovery. Use the
[asset source index](references/asset-sources.md) to pick a provider by asset
type and load only its reference. Prefer a short, text-first summary of the
fit and access requirements. Use existing provider previews when the user
requests a visual comparison.

## On-demand workflows

- [Installed add-on workflows](references/addon-workflows.md) for generators and specialist edits. Prefer native Blender Python for straightforward or exact work. Use a verified add-on command when it saves substantial setup.
- [Complex scene planning and review](references/complex-scenes.md) for full scenes or substantial revisions that benefit from staged work.
- [Generated props](references/generated-props.md) for preparing image-to-3D inputs or qualifying a generated mesh.
- [Shot sequences](references/shot-sequences.md) for multi-shot continuity, shot variants, and motion previews.
- [Compositing handoff](references/compositing-handoff.md) for moving rendered shots into a compositor or applying a localized finishing effect.
- [Real-time handoff](references/realtime-handoff.md) for translating a Blender scene to Unreal or another real-time engine.
- [Impostor cards](references/impostor-cards.md) for billboards and distant asset optimization.
- `blender-to-web` for interactive Blender-backed web or Three.js deliverables.
- For Astra Test setup, use `BLENDER_AGENT_INSTRUCTIONS.md` when present in the project root.
