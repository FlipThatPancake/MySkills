---
name: chat-comments-agent
description: Use when the user left Chat Comments in Blender (numbered notes like "#4 make it taller" on objects) or asks you to read, work on, mark Sent or resolve them, or to leave a question on an object. Reads and updates them through any Blender MCP's run-Python tool.
---

# Chat Comments (agent side)

Chat Comments is a Blender add-on. The user selects objects and writes short
numbered comments on them ("#4 [Handle] make it 1 cm thicker"). Comments move
through three stages: **Draft** (new, waiting for you), **Sent** (you are on it),
**Resolved** (done). The add-on exposes a Python module inside Blender called
`chat_comments_api`. Reach it through the run-Python tool of whatever Blender MCP
is connected; no MCP has Chat Comments tools of its own.

## Run Python in Blender

Use one snippet shape for every MCP. It prints JSON (Ahuja returns what you print)
and also sets `result` (Blender Lab and Higgsfield return `result`):

```python
import json, chat_comments_api as cc
result = cc.comments()
print(json.dumps(result))
```

| MCP | Tool | Notes |
|---|---|---|
| MCP for Blender (Ahuja) | `execute_blender_code` (`code`) | Returns printed output. |
| Blender Lab | its run-Python tool (`execute`) | Returns `result`. |
| Higgsfield Bridge | `bl_execute` | Returns `result`. Check `get_host_status` first. Its sandbox may limit imports (not yet verified). |

If several Blenders are open, confirm the file first (`bpy.data.filepath`).

## Workflow

1. **Read**: `cc.comments()` lists the Drafts. Each one has `number`, `text`,
   `stage`, `objects` (exact object names), `color`, `created` and `sent`.
   `cc.prompt()["text"]` is the same bundle the user's Send button copies.
2. **Look**: `cc.context(n)` adds `object_info` for each object (type, world
   location, rotation in degrees, scale, dimensions, materials, parent,
   collections) and the scene's units.
3. **Claim**: `cc.mark_sent([4, 5])` before you start, so the user sees you took
   them.
4. **Do the work** with normal Blender tools.
5. **Close**: `cc.resolve([4, 5])` when done. Use `cc.back_to_draft(n)` if the user
   should look again.
6. **Ask**: `cc.add("Which handle: front or back?", ["Handle.001"])` leaves a Draft
   on objects for the user to answer.

Tell the user which numbers you resolved and what changed.

## Rules the API keeps

- Results are plain JSON. Errors never raise: they come back as
  `{"ok": False, "error": code, "message": ...}`, so check `"error" in r`.
  The codes are `not_found` (with `missing` and `known`), `bad_stage`,
  `bad_input`, `no_objects`, `no_scene` and `internal`.
- Each change is one undo step; the user can press Ctrl+Z.
- Stage changes are all-or-nothing: one unknown number means nothing moves.
- `cc.api_version()` returns `{"api_version": 1, "addon_version": ...}`.

## When the import fails

If `import chat_comments_api` raises `ModuleNotFoundError`, the add-on is not
enabled in this Blender. Do not try to install it. Tell the user: "Chat Comments
isn't enabled in this Blender. Enable it in Preferences > Add-ons, or check you're
connected to the right Blender." The `error: "internal"` result means the add-on hit a bug:
ask the user to open the Chat tab (N panel) and press **Copy report**.
