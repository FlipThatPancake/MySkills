---
name: 21st-components
description: "Use when the user asks for a React component, block or theme from 21st.dev (21dev), or for a polished React piece such as a pricing card, hero or navbar that 21st.dev could supply."
---

# 21st.dev components

21st.dev = a catalog of React + Tailwind + shadcn components. Its MCP finds them and returns source for you to adapt.

## Connect
- MCP `https://21st.dev/api/mcp`, http transport, header `x-api-key` from env `API_KEY_21ST`. The key stays out of every file in the repo.
- Without MCP tools: POST JSON-RPC (`tools/call`) to the same URL with curl. `Accept` lists `application/json, text/event-stream`.
- Cloud sessions need `21st.dev` in the environment's allowed hosts.

## Pull
1. `get_usage` shows the free tier: 2 code retrievals a day.
2. `search` (free) returns ids, descriptions and `previewUrl` images. Show the user 2-3 candidates and pick from previews.
3. `get_component(id)` returns component code, demo, shadcn parts and npm dependencies. Save the result to a file straight away: `get_component` and the `/r/...` install URL both spend the same quota, so a second fetch costs another retrieval.
4. `get_theme(id)` returns theme CSS, free.

## Fit into the page
- Needs Tailwind, shadcn colour tokens, an `@/` alias to `src`, a `cn` helper (clsx + tailwind-merge) and the npm dependencies listed.
- Write each returned file at its path. A component can import a helper from its own folder that the result leaves out; if an `@/` import has no file, write a small stand-in.
- Custom class names such as `rounded-4xl` or `shadow-elevated-lg` come from the author's theme; define them in yours.

## Check
- Typecheck/build passes, a screenshot matches the preview, and the component's main interaction works.
