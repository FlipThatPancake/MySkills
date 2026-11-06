# MCP for Blender (ahujasid)

- Use `get_addon_status` for reachability and protocol agreement and
  `get_scene_info` to identify the active file. Use `execute_blender_code` for
  Python and `look` for viewport, camera, angle, or frame views. Use focused
  scene queries and a small `max_size` for quick checks. For a blank capture, try
  another view, shading mode, or render.
- Missing tools call for checking client registration and server startup.
  Connection or protocol errors call for checking the running add-on and its
  endpoint. After updating, verify Blender loaded the new add-on. A direct
  socket probe verifies only the add-on endpoint.
- For [setup](https://www.mcp-for-blender.com/docs/installation), use
  `command = "uvx"` and `args = ["mcp-for-blender"]` with the matching add-on.
  `blender-mcp` remains a compatibility package. Avoid duplicate registrations.
  Keep the listener local and match its port to the server's `--port` or
  `BLENDER_PORT` setting when overriding the default `9876`.
- Check provider access and costs before using optional generation tools.
