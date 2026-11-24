---
name: blend-along
description: Use when the user asks to work in Blender to plan, build, revise, inspect, or troubleshoot a scene, object, or script.
---

# Blend Along

Honor the user's choice of integration. Use [Ahuja](references/ahuja.md) for editing and viewing the open scene. If you cannot reach it, tell the user and pause the build.
For revisions, continue from the open scene, including the user's edits. Keep a rebuildable script when requested.
The open scene is the source of truth. Use [a separate Blender instance](references/blender-cli.md) when a job needs one, for example to retrieve or model an asset independently, run an isolated test, or render in parallel. Assemble and check separately built assets in the open scene. Treat a test or render as evidence about the input it used.

When references serve different purposes, identify which governs layout, shape, or look and resolve conflicts that affect the build.
When a build decision needs the user’s judgment, recommend a method and the smallest preview that will settle the choice.
Before an expensive or repeated change, test one representative part to the level of finish the decision requires.
For a substantial revision, establish what may change, what to preserve, and how to judge the result.
Keep the last accepted version recoverable during long or risky edits.

## Tripo generation

Paid 3D generation via MCP `generate_3d`, `provider="tripo"`; add-on holds the key.
Propose, with expected cost, for: organic shapes (characters, creatures, plants, sculpted props); photo or multi-view reference to 3D; quick textured or rig-ready drafts.
Script in Blender instead for exact sizes, hard-surface or architectural parts, clean editable topology, parametric repeats.
Never call `generate_3d` with `tripo` or `auto` without the user's explicit ok; each retry needs a new ok.
Prepare inputs and check results with [Generated props](references/generated-props.md).

## Choose a guide when its decision arises

| When | Open |
| --- | --- |
| Shape or proportions appear wrong against a reference image | [Match shape to a reference](references/match-shape-to-reference.md). |
| A repeated or moving part needs to fit its surroundings | [Fit parts in an assembly](references/assembly-fit.md). |
| Revising an existing lighting setup or comparing lighting variants | [Revise lighting](references/lighting-revisions.md). |
| Planning a multi-stage deliverable or choosing how to perform a production technique | [EL4CTEO recipe catalog](references/el4cteo.md). Look for a matching playbook during planning, or open the specialist guide when choosing the technique. |
| A library model, material, light, or preset could fit | [Asset sources](references/asset-sources.md). Offer a search when useful. Search directly when asked. |
| An installed tool could build or edit the required scene data | [Add-on workflows](references/addon-workflows.md). Check availability in the target Blender installation. |
| Considering image-to-3D, or checking a generated prop | [Generated props](references/generated-props.md). |
| Writing or debugging Blender Python | [Blender Python](references/blender-python.md). |
| Discovering an API, checking exact usage, reading the manual, diagnosing file dependencies, or showing the user a location in Blender's interface | [Blender Lab](references/blender-lab.md). |
| Matching a silhouette to a reference, fitting a camera from known points, or measuring gaps between attached parts across poses | [Blender Agent Studio](references/agent-studio.md). |
| Shots share staging or timing, or an assembly needs animation | [Shot sequences](references/shot-sequences.md). |
| Rendered shots need passes, masks, or downstream effects | [Compositing handoff](references/compositing-handoff.md). |
| The requested result must work in a browser or another real-time viewer | [Real-time handoff](references/realtime-handoff.md). Use blender-to-web for a Blender-backed web deliverable when available. |
| Distant geometry may work as image planes | [Impostor cards](references/impostor-cards.md). |

Verify the requested result. Use a measurement for an exact edit, the intended view for appearance, and a short clip or relevant frames for motion. Reuse evidence that answers the question. Say what remains unverified.
For Astra Test setup, consult BLENDER_AGENT_INSTRUCTIONS.md when present.
