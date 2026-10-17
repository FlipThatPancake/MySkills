---
name: blender-access
description: Choose and connect Blender tools for an agent. Use when starting Blender work or troubleshooting access to a live scene, background scripts, or validation tools.
---

# Blender access

Discover available tools and read their schemas. Honor the user's chosen integration.
Read only the reference needed for the current task.

## Session choice

Default to **Higgsfield Bridge** for live Blender work. Infer the best fit from
the session's prompt and briefly state the recommendation and reason. If another
MCP offers a meaningful advantage or the choice is unclear, ask one concise
question with a recommended option. Otherwise proceed with Higgsfield.
Keep the user's choice for the session; revisit it only when the task changes
or the chosen connection is unavailable.

## Route

- **Guided live builds and work across creative apps:** default to
  [Higgsfield Bridge](reference/higgsfield.md).
- **Direct local live control or an alternative connection:** use
  [Blender Lab MCP](reference/blender-lab.md).
- **Scripts and batch jobs:** use [Blender CLI](reference/blender-cli.md).
- **Structured inspection or render validation:** optionally use
  [Blender Agent Studio](reference/agent-studio.md).
- **Sketchfab and other packaged asset services:** use
  [Ahuja MCP for Blender](reference/ahuja.md) when useful.

## Live sessions

Identify the controller and report the active `.blend` path or that it is unsaved
before editing. If multiple Blender instances are open, ask which to use.
Use one live controller at a time; checkpoint before destructive edits.

Verify the connection with a scene summary and screenshot. If it fails, inspect
the add-on, client registration, and endpoint; report unresolved blockers and use
a suitable available fallback. CLI work uses saved files, not unsaved live state.

Keep local bridges local and avoid port conflicts. In client configuration,
separate the server executable (`command`) from its arguments (`args`).
Use existing subscription access for the assistant; external generation services
have separate account and billing requirements.
