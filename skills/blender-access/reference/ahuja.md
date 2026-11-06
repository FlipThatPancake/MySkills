# Ahuja MCP for Blender

Prefer for live editing and viewport inspection when connected. Its optional
asset services and remote access can also help when needed.

- Follow the [project setup](https://github.com/ahujasid/mcp-for-blender).
  The active package is `mcp-for-blender`; `blender-mcp` is its compatibility name.
- Enable the matching community add-on and register the MCP server with executable
  `uvx` and arguments `["mcp-for-blender"]`. Match the configured host and port.
- Start with `get_addon_status`, then `get_scene_info`. Use
  `execute_blender_code` for Python and `look` for visual inspection.
- Use its asset tools when their provider integration is needed: Poly Haven,
  Sketchfab, Poly Pizza, or supported generation services. Check each provider's
  credentials and costs separately.

Keep this distinct from the official Blender Lab installation. Use one live editing controller per scene at a time; match each server to its
own add-on and port.
