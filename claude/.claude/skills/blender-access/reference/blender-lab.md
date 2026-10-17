# Blender Lab MCP

Use for direct local live control, when selected for the session, or when
Higgsfield is unavailable. Requires a supported Blender version (currently 5.1+).

- Use the [official setup](https://www.blender.org/lab/mcp-server/) and
  [official source](https://projects.blender.org/lab/blender_mcp).
- Enable its Blender add-on and register its companion server in the assistant
  client. Use an official bundle or reviewed source revision; name the entry
  distinctly, such as `blender_lab`.
- Bare `uvx blender-mcp` selects Ahuja's community package, not Blender Lab.
- Discover the installed tool catalog. Confirm Blender's version, active file,
  scene summary, and screenshot; use documentation lookup and Python as needed.
- Match the official server to its own add-on endpoint. Higgsfield's listener
  has different authentication; do not assume the components are interchangeable.

The MCP supplies Blender tools, not model inference. Ordinary local control
requires no separately funded model API when the client already has model access.
