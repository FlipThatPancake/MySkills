# Choose an installed add-on workflow

Use this index for tools that build or edit scene data. For ready-made models,
materials, or presets, open the [asset source index](asset-sources.md).

| Task | Open on demand |
| --- | --- |
| Terrain, sky, oceans, or surface-following effects | [Environment add-ons](addons-environments.md) |
| Dolly rigs or converting an animated camera into a path | [Camera add-ons](addons-cameras.md) |
| Specialist hard-surface edits or dense UV packing | [Modeling and UV add-ons](addons-modeling-and-uv.md) |
| Cloth, rigid bodies, or liquid simulations | [Simulation add-ons](addons-simulation.md) |

Check the relevant add-on in the target Blender session. Use
`bpy.app.version_string` and `bpy.context.preferences.addons` for the version
and enabled modules. Use local extension manifests for installed but disabled
tools. MCP provider flags cover the MCP's own integrations.

- **Script a verified command** when it builds a useful mesh, rig, or node
  setup. Set the object, mode, selection, and operator properties explicitly.
  Check `poll()` and inspect the generated data after execution. Test a new
  operator or changed add-on version in a scratch scene first.
- **Append a node group or preset** when the bundle supplies the useful part
  and you can configure its inputs directly. Check dependencies and evaluate
  the result before relying on it.
- **Use native Blender Python** for exact geometry, routine modifiers,
  transforms, and repeatable batch jobs where an add-on adds little.
- **Hand off an interactive step** when mouse placement, viewport feedback,
  or playback is integral to the task. Give the verified menu or search
  label, editor and mode, selection, the settings to change, and the expected
  result. If a UI button calls a failed operator, verify the UI route before
  recommending it.

Treat dated test results as evidence for that installation. For deliverables
that rely on add-on callbacks, drivers, or external files, verify the saved
result in the intended Blender environment. Use a viewport or render check
when appearance matters.
