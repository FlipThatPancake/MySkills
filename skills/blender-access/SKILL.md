---
name: blender-access
description: Choose and connect Blender tools for an agent. Use when starting Blender work or troubleshooting access to a live scene, background scripts, or validation tools.
---

# Blender access

Discover available tools and read their schemas. Honor the user's chosen integration.
Read only the reference needed for the current task.

## Session choice

Prefer **MCP for Blender (Ahuja)** for live work. Honor an explicit user choice;
use another suitable integration when it is unavailable or better suited.

## Route

- **Live editing and viewport feedback:** prefer
  [MCP for Blender](reference/ahuja.md).
- **Alternative live control:** use
  [Blender Lab MCP](reference/blender-lab.md).
- **Scripts and batch jobs:** use [Blender CLI](reference/blender-cli.md).
- **Structured inspection or render validation:** optionally use
  [Blender Agent Studio](reference/agent-studio.md).
- **Higgsfield-specific capabilities or cross-app work:** optionally use
  [Higgsfield Bridge](reference/higgsfield.md).

## Live sessions

Identify the controller and report the active `.blend` path or that it is unsaved
before editing. If multiple Blender instances are open, ask which to use.
Use one live editing controller at a time per scene; serialize changes and
checkpoint before destructive edits. Multiple installed integrations need not
conflict; simultaneous live control is unverified.

Verify the connection with a scene summary and screenshot. If it fails, inspect
the add-on, client registration, and endpoint; report unresolved blockers and use
a suitable available fallback. CLI work uses saved files, not unsaved live state.

Keep local bridges local; separate listeners need distinct host/port pairs.
Background validation can inspect a saved copy alongside live work. Compare token
cost and reliability with equivalent tests, not assumptions. In client configuration,
separate the server executable (`command`) from its arguments (`args`).
Use existing subscription access for the assistant; external generation services
have separate account and billing requirements.
