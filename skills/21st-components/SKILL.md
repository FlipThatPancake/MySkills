---
name: 21st-components
description: "Use when the user asks for a React component, block or theme from 21st.dev (21dev), or for a polished React piece such as a pricing card, hero or navbar that 21st.dev could supply."
---

# 21st.dev components

MCP `https://21st.dev/api/mcp`, http transport, header `x-api-key` from env `API_KEY_21ST`; the key never goes in a repo file. The sandbox must reach `21st.dev` (cloud environments: allowed hosts).

Free tier = 2 code retrievals a day. `get_component` and the `/r/...` install URL share that quota, so choose from `search` previews first and save the result to a file; a second fetch costs another retrieval.

A returned component can import a helper from its own folder that the result leaves out; if an `@/` import has no file, write a small stand-in.
