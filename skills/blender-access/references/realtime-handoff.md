# Blender to a real-time engine

Use for an explicitly requested real-time version. Preserve the Blender
master and stage the transfer separately.

- **Test the risky subset first.** Include a scale reference and whichever
  parts can invalidate the approach, such as a material, pivot, transparent
  surface, camera, or animation. Verify import in the target engine for
  units, orientation, hierarchy, textures, and any required playback before
  transferring the full scene.
- **Assign work to the destination deliberately.** Verify which elements
  transfer as authored, which need baking, and which should be rebuilt in
  the engine. Test procedural materials, volumes, particle systems, and
  simulation caches individually when the deliverable depends on them.
- **Compare in the target engine.** Match the reference camera's framing
  and exposure before tuning lighting. Check a moving shot when the result
  depends on motion or temporal effects. For performance targets, measure
  on the intended hardware at recorded settings. Record what transferred,
  what was rebuilt, and which checks ran in the actual engine.
