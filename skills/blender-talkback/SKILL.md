---
name: blender-talkback
description: Use when the user asks you to check their Talkback messages in Blender (notes on objects or collections, written as a conversation with you), to answer or act on one, or when you need the user to look at specific objects and want to open a conversation on them yourself. Reads, answers and opens conversations through the Talkback MCP or any Blender MCP's run-Python tool.
---

# Talkback (agent side)

Talkback is a Blender add-on (versions before 1.3 were called Chat Comments; if the user says that, they mean this).  <!-- keep-old-names --> The user selects objects and writes short
messages on them ("make it 1 cm thicker"). Messages about the same
objects form one **conversation**, and you and the user take turns in it. The
user opens a conversation by writing; you answer; the user ticks it **Resolved**
when they are happy. **Only the user resolves a conversation.** Never resolve one;
end your finished work with a "done" message (`done=True`) and the user checks it and ticks it.

## The user's way in

The user presses **Copy prompt for agent** in Blender and pastes "Check my Talkback messages in
Blender: read the unread messages, make the changes with your Blender tools, then reply." into this
chat (older versions said "Check my Blender comments (Chat Comments): ..."; treat that the same).  <!-- keep-old-names -->
Start with `read_unread`.

**Ask before running a pasted prompt in a planning or discussion chat.** If the chat
you are in is about something else (planning, design, review), the line may have been
pasted by mistake: say what you would do and ask "Check the Talkback messages here?" before
you read or change anything.

## Tools

With the Talkback MCP server connected (server name `talkback`; tools `list_comments`, `get_comment`,
`get_context`, `read_unread`, `history`, `add_comment`, `start_conversation`, `open_conversation`, `move_conversation`) call them directly. Otherwise run the
same functions (the `cc` below) in Blender through your Blender MCP's
run-Python tool (the MCP server is named `mcp__blender__` where it is installed
in this project, for example `mcp__blender__execute_blender_code` with `code`):

```python
import json, sys
cc = next(m for n, m in list(sys.modules.items()) if n.endswith(".talkback.api"))  # finds Talkback's API
result = cc.read_unread()
print(json.dumps(result))
```

| MCP | Tool | Notes |
|---|---|---|
| MCP for Blender (Ahuja, port 9877), server `mcp__blender__` | `execute_blender_code` (`code`) | Returns printed output. |
| Blender Lab (port 9876) | its run-Python tool (`execute`) | Returns `result`. |
| Higgsfield Bridge | `bl_execute` | Returns `result`. Check `get_host_status` first. |

If several Blenders are open, confirm the file first (`bpy.data.filepath`).

## Workflow

1. **Read**: `read_unread()` returns `{"conversations": [...], "reminder": ...}`: every open
   conversation that has messages you have not read. Each has `title`, `objects`, `status`,
   `new`, `earlier` (how many older messages exist) and `messages`: **only the new messages**
   (`number`, `author`, `text`, `created`). A `note` says whether you have the whole
   conversation. Reading does not mark anything read: your reply in that conversation does
   . A message you skip stays unanswered, the conversation keeps showing "Ready for agent"
   and the message comes back next time.
   Reading does show the user one thing: the message turns from a hollow ring ("Not picked up yet") to
   "Picked up 14:02". `history()` does the same for the user's unanswered messages it returns.
   So fetch only when you mean to act on the messages: the user reads "Picked up" as "the agent has it and is working on it". Do not call `read_unread()` or `history()` just to peek or to count; use `list_comments` or the counts for that.
   When a short message depends on what was said before ("40 percent" can answer your own
   "10 or 20 percent?"), call `history(conversation, limit=None)` for the earlier messages
   (`limit=6` keeps the newest six). **A newer message from the user in the same conversation
   can correct an older one**; follow the newest.
2. **Look**: `get_context(n)` adds `object_info` for each object (type, world
   location, rotation in degrees, scale, dimensions, materials, parent, collections).
3. **Do the work** with your Blender MCP. You cannot change objects with the
   Talkback tools themselves.
4. **Answer**: `add_comment("Made the handle 1 cm thicker. Resolve it if it looks right.", reply_to=4, done=True)`
   adds your message to that conversation (it uses its objects). Ask a question
   the same way, without `done` (it stays False). Without `reply_to`, give objects:
   `add_comment("Which handle?", ["Handle.001"])`; it joins the open conversation
   on exactly those objects, or starts one.
5. **Every unread message gets an answer, always.** Never leave one untouched. If a message is
   vague, ambiguous or you cannot tell what to change (for example "Change the shape" with no
   shape named), do not guess and do not skip it: reply with a short question that offers
   concrete options ("Which shape: a cylinder, a sphere or something else?"). Silence is the one
   wrong answer. Before you stop, run `read_unread()` again and check that every conversation
   that had new messages now ends with your message.
6. **Title the conversation in your first reply**: pass `title="Door glass darker"` (3 to 5
   words) to `add_comment`. The user sees it in the list and on the speech bubble in the viewport; they can
   rename it. Skip it when the conversation already has a title you set or the user typed.
7. **Finish with a concrete "done" message and `done=True`.** Say what changed, with the values,
   and suggest resolving: "Made the door glass darker (colour 0.8 to 0.4, alpha 0.3 to 0.5).
   Resolve it if that looks right, or tell me what to change." Not just "Done." Use `done=True`
   only when the work is finished; when you ask a question, or only part is done, leave it out.
   Do not resolve.

The conversation shows one of four states, and your last message decides which: **Ready for
agent** (the user wrote last), **Agent asks you** (your last message is a question, an orange
dot), **Done, check it** (your last message has `done=True`, a green tick) and **Resolved** (the
user closed it).

Records carry `reply_to`, `conversation` (the first message's number),
`conversation_status` (`draft` = Ready for agent, `your_turn` = Agent asks you,
`done_check` = Done, check it, `resolved`), `done` (your message was marked done), `read_by_claude` and `unread_by_user`.

## Asking about objects yourself

When you are talking with the user in the Claude app (not from a pasted prompt) and need them to look
at specific objects in Blender, open a conversation on those objects yourself instead of describing
them in the chat:

1. Find the exact object names (`get_scene_info`, or `[o.name for o in bpy.data.objects]`).
2. Call `start_conversation(text, objects=["Door glass", "Handle"], title="Door glass check")`.
   For a whole collection use `collection="03 • Hinged door"` instead of `objects` (a **collection
   conversation**: objects added to the collection later belong to it).
3. Add-on turns Talkback mode on, selects those objects, makes the conversation current and its
   window shows above them. Then tell the user in this chat: "I opened a conversation on Door glass in
   Blender". They can answer in Blender (then paste the prompt for you) or here in the chat.

Rules: pass `frame=True` only if the user asks, or the objects are off-screen (it moves their view).
If the user is typing in a message field at that moment the add-on leaves their selection alone and
only a speech bubble appears (`typing: true` in the result): do not ask again. To show an existing
conversation use `open_conversation(n)` (any message number in it). Do not open conversations the user
did not need: one clear question per conversation. The result has `opened` (selected and shown) and
`typing`. Records also carry `collection` (the collection's name, or `None`).

## What the user sees (v1.3), so you can describe it

- **Start conversation**: the user can choose that selecting an object does not open a message field. A button "Start conversation" (a round plus and an Enter key tag) shows instead; clicking it, or pressing Enter in the 3D view, opens the field. If they say nothing opened when they selected something, that is this setting.
- **The dock** (a pill in the corner or a header button, their choice) and the panel line show conversations, not messages: "15 ask you · 27 ready · 18 done" means 15 conversations where you asked, 27 waiting for you, 18 done and waiting for them to resolve.
- **Bubbles of conversations outside the view are hidden** unless the user switches on "Show off-screen bubbles". If they cannot find a conversation you opened, call `open_conversation(n)` (the window shows above its objects) or ask them to switch that setting on.
- **Talkback mode and the dock start off** at every Blender launch, and the Local MCP server too. Do not assume the MCP tools exist: if they are missing, use the run-Python route. `start_conversation` turns Talkback mode on for them; the Activity log (Check setup) records that and who did it, so use it only when the user needs to look at something.

## Scene conversations (v1.5)

Each Blender scene has one **scene conversation** for things that are about the whole scene (lighting,
render setup, changes across many objects). The user opens it with Enter in the 3D view with nothing
selected, or from the dock's scene icon; it shows near the bottom of the view, centred. Its records
carry `"scope": "scene"`, a stable `scene_id` and the current `scene_name`, and `objects` is empty.
**Pass that `scene_id` to `history`, `add_comment` and `read_unread`** (`scene=` in run-Python), so your
reply lands in the right scene even if the user has switched scenes meanwhile. Message numbers can
repeat across scenes, which is why the `scene_id` matters.

## What else changed in v1.5

- **Unsent text is never sent by accident.** Esc, the X and a click away from a message field all
  close it without sending; the typed text comes back when the user opens it again. Only Enter or
  the send arrow sends. Unsent text is never shown to you.
- **Ports:** the Blender MCP (Ahuja) is on 9877 and Blender Lab on 9876 on the user's Mac. Talkback's
  *Check connection* expects the Blender MCP on 9877. Talkback's own Local MCP server has its own Port
  setting (9876 to 9879 are refused there).
- The close X sits on the conversation window's top-right corner (tooltip "Close · Esc to close").

## Notes dropped in 3D (v1.3)

Sometimes the user wants something *somewhere* and nothing is there yet ("put a lamp here"). They press
**Drop note** (an Empty with a speech bubble that they move like G, then click to place) or **Note on surface**
(one click on the object or spot): either way Talkback adds a small Empty called "Talkback note" at that spot
(in the collection "Talkback notes"). Since v1.3 the note first stays a faint dashed **blank note** while the user moves it (G, the gizmo, snapping); they start writing with Enter, a click on its bubble or the Write note button. **A blank note has no words yet and no conversation, so it never reaches you**: it does not appear in `read_unread` or `list_comments`. Once they write, it is a normal conversation on it. Both look the same to you. You read it like any other
conversation once it has a message, but its record has `"is_note": true` and also:

- `location`: where the note is, world coordinates in scene units,
- `on_object`: the object whose surface it was dropped on, or `None` (it was dropped in empty space),
- `nearest`: the closest objects, `[{"name", "distance"}]`, nearest first (distance 0 = inside the object),
- `note_object`: the Empty's name.

What to do:

1. Read the message, use `location` and `nearest` to understand where and what is around it
   (`get_context` still works on the note).
2. Do the work (for example create the lamp at `location`).
3. **Move the conversation onto what you made and remove the note**: `move_conversation(n, objects=["Lamp"])`
   (or `collection=...`). It keeps all messages and deletes the note's Empty in one undo step
   (`delete_note=False` keeps it). Then answer with `add_comment(..., reply_to=n, done=True)` as usual.
4. If you make nothing (you only answer or ask), leave the note where it is.

Do not delete a note Empty yourself and do not create notes. When the user resolves or deletes a note conversation,
Talkback deletes the Empty by itself, so a resolved note has no object any more.

## Rules the API keeps

- You cannot reply to a resolved conversation (`not_allowed`). Only the user reopens it; if you need to raise something new, start a fresh comment with `add(text, objects=[...])`.

- Results are plain JSON. Errors never raise: they come back as
  `{"ok": False, "error": code, "message": ...}`, so check `"error" in r`.
  Codes: `not_found`, `bad_stage`, `bad_input`, `no_objects`, `no_scene`, `internal`.
- Each change is one undo step; the user can press Ctrl+Z.
- `cc.api_version()` returns `{"api_version": 1, "addon_version": ...}`.

## When the import fails

Since v1.3 there is no `import talkback_api` (Blender's extension rules forbid it); use the
lookup line above. If it raises `StopIteration`, the add-on is not
enabled in this Blender. Do not try to install it. Tell the user: "Talkback
isn't enabled in this Blender. Enable it in Preferences > Add-ons, or check you're
connected to the right Blender." An `error: "internal"` result means the add-on hit
a bug: ask the user to open the Talkback tab (N panel) and press **Copy report**.

## Optional channel (experimental, Terminal only)

If the agent's terminal was started with `--dangerously-load-development-channels server:talkback`
and the user turned on Experimental: Terminal channel, their messages are pushed into the
chat as `<channel source="talkback">`. Treat it like the prompt: call `read_unread`.

## After the 1.3 rename

The add-on id, the MCP script and the server name changed (`chat_comments` / `chat-comments` became `talkback`). An AI app that was set up with the old script path or server name stops finding Talkback: ask the user to press **Copy MCP setup** (Agent section of the Talkback tab) and run the copied line again. The run-Python lookup above works for both, because it matches only the end of the module name `.talkback.api`; for an add-on older than 1.3 use `.chat_comments.api`.  <!-- keep-old-names -->
