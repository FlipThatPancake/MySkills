---
name: chat-comments-agent
description: Use when the user asks you to check their Blender comments (Chat Comments: notes on objects, written as a conversation with you), or to answer, act on or leave a message on an object. Reads and answers through the Chat Comments MCP or any Blender MCP's run-Python tool.
---

# Chat Comments (agent side)

Chat Comments is a Blender add-on. The user selects objects and writes short
messages on them ("make it 1 cm thicker"). Messages about the same
objects form one **conversation**, and you and the user take turns in it. The
user opens a conversation by writing; you answer; the user ticks it **Resolved**
when they are happy. **Only the user resolves a conversation.** Never resolve one;
end your finished work with a "done" message (`done=True`) and the user checks it and ticks it.

## The user's way in

The user pastes "Check my Blender comments (Chat Comments): read the unread messages,
make the changes with your Blender tools, then reply." into this chat (or a variant). Start with `read_unread`.

**Ask before running a pasted check line in a planning or discussion chat.** If the chat
you are in is about something else (planning, design, review), the line may have been
pasted by mistake: say what you would do and ask "Check the Blender comments here?" before
you read or change anything.

## Tools

With the Chat Comments MCP server connected (tools `list_comments`, `get_comment`,
`get_context`, `read_unread`, `history`, `add_comment`) call them directly. Otherwise run the
same functions as `chat_comments_api` in Blender through your Blender MCP's
run-Python tool (the MCP server is named `mcp__blender__` where it is installed
in this project, for example `mcp__blender__execute_blender_code` with `code`):

```python
import json, chat_comments_api as cc
result = cc.read_unread()
print(json.dumps(result))
```

| MCP | Tool | Notes |
|---|---|---|
| MCP for Blender (Ahuja), server `mcp__blender__` | `execute_blender_code` (`code`) | Returns printed output. |
| Blender Lab | its run-Python tool (`execute`) | Returns `result`. |
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
   When a short message depends on what was said before ("40 percent" can answer your own
   "10 or 20 percent?"), call `history(conversation, limit=None)` for the earlier messages
   (`limit=6` keeps the newest six). **A newer message from the user in the same conversation
   can correct an older one**; follow the newest.
2. **Look**: `get_context(n)` adds `object_info` for each object (type, world
   location, rotation in degrees, scale, dimensions, materials, parent, collections).
3. **Do the work** with your Blender MCP. You cannot change objects with the
   Chat Comments tools themselves.
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
   words) to `add_comment`. The user sees it in the list and on the viewport marker; they can
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

## Rules the API keeps

- Results are plain JSON. Errors never raise: they come back as
  `{"ok": False, "error": code, "message": ...}`, so check `"error" in r`.
  Codes: `not_found`, `bad_stage`, `bad_input`, `no_objects`, `no_scene`, `internal`.
- Each change is one undo step; the user can press Ctrl+Z.
- `cc.api_version()` returns `{"api_version": 1, "addon_version": ...}`.

## When the import fails

If `import chat_comments_api` raises `ModuleNotFoundError`, the add-on is not
enabled in this Blender. Do not try to install it. Tell the user: "Chat Comments
isn't enabled in this Blender. Enable it in Preferences > Add-ons, or check you're
connected to the right Blender." An `error: "internal"` result means the add-on hit
a bug: ask the user to open the Chat tab (N panel) and press **Copy report**.

## Optional channel (experimental, Terminal only)

If the agent's terminal was started with `--dangerously-load-development-channels server:chat-comments`
and the user turned on Experimental: Terminal channel, their messages are pushed into the
chat as `<channel source="chat-comments">`. Treat it like the check line: call `read_unread`.
