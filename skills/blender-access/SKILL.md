---
name: blender-access
description: Choose or troubleshoot Blender access for live edits, saved files, scripts, renders, and validation. Search installed Blender add-ons and asset libraries for reusable assets. Also use for image cards, billboards, impostors, and distant asset optimization.
---

# Blender access

Honor the user's integration choice. Check which tools are available and open
only the reference needed for the current step.

- [MCP for Blender (ahujasid)](reference/ahuja.md) is the live default when connected.
- [Blender Lab MCP](reference/blender-lab.md) for live fallback, Blender docs, and file diagnostics.
- [Blender Agent Studio](reference/agent-studio.md) for independent asset checks and repeatable renders.
- [Blender CLI](reference/blender-cli.md) for saved-file scripts and batch jobs.
- [Higgsfield Bridge](reference/higgsfield.md) for Higgsfield-specific or cross-app work.

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

## Optional

- [Complex scene planning and review](references/complex-scenes.md) for full scenes, shot sequences, or substantial revisions that benefit from staged work.
- [Impostor cards](references/impostor-cards.md) for billboards and distant asset optimization.
- `blender-to-web` for interactive Blender-backed web or Three.js deliverables.
- [Astra Test project notes](../BLENDER_AGENT_INSTRUCTIONS.md) for local setup.
