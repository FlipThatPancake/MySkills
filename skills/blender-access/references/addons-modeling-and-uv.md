# Modeling and UV add-ons

Hard Ops and MESHmachine were enabled on Blender 5.2.2 LTS on 2026-11-06.
UVPackmaster 3 was installed and disabled. Operators below were inspected in
the installed source and still need task-specific execution checks.

## Hard Ops and MESHmachine

For new dimensioned parts, build the mesh and use native Boolean and Bevel
modifiers so dimensions can be regenerated. Consider Hard Ops when a
specific operation adds value to an existing hard-surface edit. Its modal
bevel adjustments are suited to interactive tuning.

Consider MESHmachine's `machin3.fuse` for rebuilding an existing bevel
transition. Test on a copy with the intended faces selected. Check the
transition profile and topology afterward. For a UI handoff, enter Edit Mode,
select the chamfer faces for the transition, and choose **Fuse** from the
MESHmachine menu. Check the preview before accepting.

## UVPackmaster 3

Consider for a demanding UV packing job with many islands or specialized
packing constraints. Check availability and run one representative packing
test before depending on it. Use Blender's native Pack Islands for routine
jobs. Verify margins, overlaps, and texel density against the target export.
