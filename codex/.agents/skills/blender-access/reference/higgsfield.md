# Higgsfield Bridge

Default for live Blender work, guided builds, and work across creative apps.
It executes Blender Python with full `bpy` access, alongside specialized tools.

- Follow the [Blender bridge setup](https://higgsfield.ai/plugins/blender).
  Enable the add-on's MCP connection, add `https://bridge.higgsfield.ai/mcp`
  to the assistant, and complete Higgsfield sign-in.
- Start with `get_host_status`; if Blender is disconnected, have the user open
  its Higgsfield panel and connect.
- Load `bl_get_skill(name="blender-scene")`, then only its task-matched modules
  before edits: modeling, lookdev, lighting/camera, animation, or audit.
- Inspect `bl_get_scene_summary`. Use the specialized `bl_` tools when available,
  `bl_execute` for other Python operations, and `bl_screenshot` for visual checks.
- The guides describe tools from several connector versions. Discover the actual
  catalog and use their documented fallbacks; never invent a missing tool.
- The bridge requires internet access and a Higgsfield account. Plain-control
  availability without a paid Higgsfield plan is not established; verify access.
- Asset generation uses separate Higgsfield services and credits. The generation
  endpoint `https://mcp.higgsfield.ai/mcp` is distinct from the live bridge.
- Use the bridge's own authenticated add-on connection; do not substitute an
  official Blender Lab socket endpoint.

The [general MCP subscription requirements](https://higgsfield.ai/creator-hub/help-center/integrations/how-do-i-connect-higgsfield-to-ai-agent)
describe the generation integration; do not assume a ChatGPT/Claude subscription
covers Higgsfield services.
