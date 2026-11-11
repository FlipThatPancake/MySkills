# Data that agents read

## Choose where records live

| Option | Use when | Trade-off |
| --- | --- | --- |
| `PropertyGroup` in a `CollectionProperty` on `bpy.types.Object` | The add-on has UI for editing records | Typed and drawn easily, but unreadable as named fields without the add-on enabled; mirror it to JSON |
| JSON string in an ID custom property, such as `obj["notes_json"]` | Any agent or script must read it | Readable anywhere; validate on load because people can edit it by hand |
| Empty parented to the object, record in its custom properties | A note needs its own position, visibility, or selection | Survives object edits, but clutters the Outliner; keep these in one hidden collection |

Default: a PropertyGroup for editing, mirrored to a JSON custom property after each change. Read PropertyGroup values as attributes (`obj.notes[0].text`); from 5.0, dict-style reads of registered properties fail, while plain custom properties (`obj["notes_json"]`) still work.

## Anchor a note to a point

Store the anchor in object-local coordinates so the note follows the object when it moves. A vertex or face index breaks after mesh edits, so store it only as a hint next to the local position.

When an agent reads a note, return what identifies the target without a screenshot: object name and type, the record's stable id, world-space bounding box, anchor in world space, parent, and collections.

## Blender's own Annotate tool

Annotate strokes have no link to any object, so use them only as a visual layer next to your own records. Blender 5.0 renamed the annotation types, so read them through one small helper, for example `getattr(scene, "annotation", None) or getattr(scene, "grease_pencil", None)`. Verified on 5.2.2:

- The scene's annotation data is `scene.annotation` (an `Annotation`), or `None` until someone draws. All annotation data-blocks are in `bpy.data.annotations`.
- Path to points: `annotation.layers[i]` (`AnnotationLayer`, name in `.info`) > `.frames[j]` > `.strokes[k]` > `.points[n].co`. The frames-to-points part is unverified.
- `scene.grease_pencil` and `scene.grease_pencil_layers` do not exist in 5.2.2. On 4.x the same data is `scene.grease_pencil` (unverified). `scene.grease_pencil_layers` appears in some web answers but likely never existed.
- Movie clips, image editors, and node trees each have their own `annotation`.

## Reach the data through an MCP

Free-form Python tools such as `execute_blender_code` run whatever the model writes with no sandbox. So:

- **Convention, for reading.** Any Blender MCP with Python execution can read the JSON property directly, with no server of your own. Fine for a quick start or for reading only; it inherits that tool's risk.
- **Own narrow tools, the default for an add-on that agents use regularly.** The add-on runs a small server on `localhost` that a button starts and stops, and a separate MCP server forwards named calls to it (for example `list_notes`, `get_note`, `add_note`, `resolve_note`). Offer no free-form exec, or only behind an explicit opt-in setting. Queue each request and run it from a `bpy.app.timers` function, because `bpy` is not thread-safe. Declare the `network` permission.

Bridge problems seen in other Blender MCPs (from their issue trackers, read secondhand on 2026-11-11), with the design answer:

- Timers never fire in background mode (`blender -b`), so every request hangs. The bridge needs a Blender with a UI; tests call the logic functions directly instead.
- Port 9876 is shared by several Blender MCPs and clashes. Make the port a preference with a different default, and offer an optional auto-start.
- Partial reads cause "incomplete JSON" timeouts. Frame each message (length prefix or one JSON object per line) and add a `ping` command.
- Claude Desktop can break on slow `uvx` startup or extra output on stdio. Install the MCP server once and point the client at its binary; print nothing but protocol to stdout.
- ChatGPT connects only to remote HTTPS MCP servers, so a local bridge needs a tunnel. Target Claude first.

Existing projects for comparison (read 2026-11-11): ra100/blender-claude-plugin (MIT) is a good layout model for skills with per-topic references, targeting Blender 5.0 and 5.1. DonLoquacious/mcp-blender has tools that create annotation strokes, text labels, and dimension lines, but no object link was found. emeryporter/blender-mcp reportedly annotates screenshots (unverified).
