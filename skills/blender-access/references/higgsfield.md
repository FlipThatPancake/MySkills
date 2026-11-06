# Higgsfield Bridge

- Follow the [Blender bridge setup](https://higgsfield.ai/plugins/blender). Add
  `https://bridge.higgsfield.ai/mcp` to the client and sign in when prompted.
- Start with `get_host_status`. If the bridge reports Blender disconnected,
  check the actual add-on panel and connector status. If the panel says
  Connected, report the discrepancy and use a suitable fallback. Refer only to
  controls visible in that version of the panel.
- Use the exposed `bl_` tools. Read `bl_get_scene_summary` and inspect
  `bl_screenshot` for visual work. Before edits, load `bl_get_skill(name="blender-scene")`
  and the applicable modules. Use `bl_execute` for Blender Python when needed.
- Verify access and generation costs separately. The generation endpoint
  `https://mcp.higgsfield.ai/mcp` serves a different integration.
