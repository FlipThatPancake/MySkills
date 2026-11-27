---
name: 21st-components
description: "Use when the user asks for a React component, block or theme from 21st.dev (21dev), or for a polished React piece such as a pricing card, hero or navbar that 21st.dev could supply."
---

# 21st.dev components

21st.dev = a catalog of React + Tailwind + shadcn components. Its MCP finds them and returns source for you to adapt.

## Connect
- MCP `https://21st.dev/api/mcp`, http transport, header `x-api-key` set from env `API_KEY_21ST`, so the key lives in the environment and never in a repo file.
- Without MCP tools: POST JSON-RPC (`tools/call`) to the same URL with curl. `Accept` lists `application/json, text/event-stream`.
- The sandbox must reach `21st.dev` (cloud environments: add it to the allowed hosts).

## Pull
1. `get_usage` shows the tier. Free = 2 code retrievals a day; a paid plan removes the limit.
2. `search` (free) returns ids, descriptions and `previewUrl` images. Choose from the previews before retrieving; show the user 2-3 candidates when taste decides.
3. `get_component(id)` returns component code, demo, shadcn parts and npm dependencies. Save the result to a file straight away: `get_component` and the `/r/...` install URL both spend the same quota, so a second fetch costs another retrieval. In a shadcn project the result's install command (`npx shadcn@latest add "<url>?api_key=$API_KEY_21ST"`) adds the files and dependencies itself.
4. `get_theme(id)` returns theme CSS, free.

## Fit into the page
- Needs Tailwind, shadcn colour tokens, an `@/` alias to `src`, a `cn` helper (clsx + tailwind-merge) and the npm dependencies listed.
- Write each returned file at its path. A component can import a helper from its own folder that the result leaves out; if an `@/` import has no file, write a small stand-in.
- Custom class names such as `rounded-4xl` or `shadow-elevated-lg` come from the author's theme; define them in yours.

## Check
- A screenshot matches the `previewUrl` image and the component's main interaction works (toggle, hover, open/close).
