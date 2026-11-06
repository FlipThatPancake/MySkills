# Blender Agent Studio

The [plugin's file tools](https://ifbars.github.io/blender-agent-studio/mcp-tools/)
run in background Blender. They can check a saved copy alongside live work.

- Use `blender_inspect_asset` for evaluated geometry, hierarchy, materials,
  and animation data. Pass the exported GLB, FBX, or other supported file
  directly for a fresh-import check.
- Use `blender_render_evidence` for fixed views and a contact sheet, or
  `blender_render_scene` for the scene's own cameras and lighting. Match views
  and settings for before-and-after comparisons.
- If discovery fails, check the executable with `blender_version`. Load
  specialized checks as needed. SceneIR tools require the optional Rust runtime.

For live observation and navigation, `blender_open_viewport` needs the
[optional Live add-on](https://github.com/ifBars/blender-agent-studio/blob/main/docs/live-viewport.md)
and an open 3D View. Use a live editing integration for scene changes.
