# Blender Agent Studio

Optional convenience layer for saved-file inspection, validation, and rendering.
Use the [installed plugin](https://github.com/ifBars/blender-agent-studio) and
its relevant workflow skills when available.

- Start with `blender_version`; supply the installed executable if discovery fails.
- Use `blender_inspect_asset` for asset metrics.
- Use `blender_render_scene` for authored cameras and lighting, or
  `blender_render_evidence` for standardized multiview images.
- Discover specialized topology, motion, reference-comparison, and asset tools
  only when needed. Read each tool's output-directory and runtime requirements.
- SceneIR analysis needs the optional Rust runtime; basic inspection and
  rendering do not. Avoid setting it up for tasks that do not need it.

These tools operate on saved assets in background processes, not the open scene.
Disabling its MCP and uninstalling the plugin are different choices: the plugin
also supplies skills.
