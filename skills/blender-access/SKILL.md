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
installed libraries. For a requested search, go straight to discovery.
Open the [asset source index](references/asset-sources.md) to choose between
Blender's configured Asset Browser libraries, an add-on catalog, and MCP
search. Follow the matching provider or local library guide for discovery
and import. Prefer a short, text-first summary of fit and access. Use
existing provider previews when the user requests a visual comparison.

## Use installed add-ons

Open [installed add-on workflows](references/addon-workflows.md) when an
add-on could build or edit scene data. Follow the task link for environments,
cameras, modeling and UVs, or simulation. Use that guide to choose a command,
an appendable preset, or a UI step. Use native Blender for routine or exact work.

## Tripo generation

Paid 3D generation via MCP `generate_3d`, `provider="tripo"`; add-on holds the key.
Propose, with expected cost, for: organic shapes (characters, creatures, plants, sculpted props); photo or multi-view reference to 3D; quick textured or rig-ready drafts.
Script in Blender instead for exact sizes, hard-surface or architectural parts, clean editable topology, parametric repeats.
Never call `generate_3d` with `tripo` or `auto` without the user's explicit ok; each retry needs a new ok.
Prepare inputs and check results with [Generated props](references/generated-props.md).

## On-demand workflows

- [Complex scene planning and review](references/complex-scenes.md) for proving a representative asset or look before expanding a scene.
- [Generated props](references/generated-props.md) for preparing image-to-3D inputs or qualifying a generated mesh.
- [Shot sequences](references/shot-sequences.md) for multi-shot continuity, shot variants, and motion previews.
- [Compositing handoff](references/compositing-handoff.md) for moving rendered shots into a compositor or applying a localized finishing effect.
- [Real-time handoff](references/realtime-handoff.md) for proving the look and behavior in the browser or target engine before expanding the scene.
- [Impostor cards](references/impostor-cards.md) for billboards and distant asset optimization.
- `blender-to-web` for interactive Blender-backed web or Three.js deliverables.
- For Astra Test setup, use `BLENDER_AGENT_INSTRUCTIONS.md` when present in the project root.
