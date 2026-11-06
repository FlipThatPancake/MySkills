# Blender Lab MCP

Use for live fallback, Blender API and manual search, or diagnosing missing
files and linked libraries. Some file checks run in background Blender.

- Follow the [official setup](https://www.blender.org/lab/mcp-server/) for
  Blender 5.1+. Pair Lab's own add-on and server under a distinct client name
  such as `blender_lab`. Bare `uvx blender-mcp` selects Ahuja.
- For live use, verify the active file and scene. Use the exposed screenshot,
  documentation, or Python tools as needed.
- Lab and Ahuja can be installed side by side. Both default to `localhost:9876`.
  To run both listeners, use distinct local ports and match each client entry
  to its add-on. Lab uses `BLENDER_MCP_PORT` on the server side. Simultaneous
  control of one Blender session is unverified here.
