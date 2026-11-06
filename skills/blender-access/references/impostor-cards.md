# Blender Impostor Cards

Use an image on a UV-mapped plane to replace dense geometry at a distance. Choose the simplest card that holds up in the shot. Use a color-and-alpha card for a fixed look, add normals when lighting needs to move, and add a foliage mask when backlighting or tint needs to spare the trunk. Use multiple captured views, crossed cards, or keep the mesh where camera motion, parallax, shadows, or close-up silhouettes reveal the substitution.

## Capture and assemble

1. Frame the source with an orthographic camera. Keep camera, framing, pose, resolution, and crop identical across maps. For tree variants, keep the root at a consistent point in the image. Pick texture resolution from the largest expected screen size. Check thin foliage at both the export size and the intended viewing size.
2. Export color and silhouette alpha together, typically as an RGBA PNG. For a relightable card, start with albedo or softly lit color. Strong lighting and occlusion baked into the color image can compound the card's own shading and leave shadows dark from every direction. Check the source asset's opacity textures, especially if foliage is built from cutout meshes.
3. Capture normals for the chosen card view if needed. A conventional bake should encode directions in the card's tangent basis. The tutorial method uses a normal MatCap viewport capture as an approximation. Inspect the saved map against the color silhouette and test lighting from opposite sides to catch orientation, color-transform, and cutout mismatches. A solid viewport capture may depict the underlying foliage polygons where a material render shows individual needles.
4. Export a mask for independently controlled regions. For foliage, assign distinct material IDs to needles/leaves and bark, or make an explicit grayscale pass. Remap the IDs to the intended values before export, such as white foliage and black bark. Inspect the exported file over the silhouette. Saving raw indices such as 1 and 2 into a format with a 0–1 range can collapse the distinction through clipping. Account for every relevant material slot.
5. Make a plane with the image aspect ratio and use its UVs for every map. Put the origin at the base for grounded assets. Check face orientation from the intended camera side. For upright billboards, rotate around the vertical axis toward the camera and preserve the base position. Verify the tracking axis against the actual plane orientation before propagating it to instances.

## Material wiring

- **Color and cutout.** Use the intended color space for the visible image, usually sRGB for an ordinary PNG. Use its Alpha output to cut the silhouette. For a single Principled BSDF, connect it to Principled Alpha. When mixing surface and translucency, use a final Mix Shader with Transparent BSDF first and the combined surface second, driven by image alpha. Use one alpha cutout rather than applying it twice. Verify transparency and shadows in the intended render engine.
- **Front lighting.** Set normal textures and data masks to Non-Color on the image datablocks. Connect the aligned normal texture to a Normal Map node and its Normal output to Principled Normal. The normal stores surface directions and changes how the card catches light. It leaves the geometry, silhouette, and parallax flat.
- **Broad shape.** The tree tutorial adds a reusable normal image captured from a smooth-shaded cube, aligned so that normals tilt up near the top and outward near the sides. It supplies broad volume while the per-tree map carries detail. Its recipe is Mix Color in Overlay mode with tree detail in A and broad shape in B, then Normal Map → Principled Normal. Treat Overlay as an artistic approximation. Verify the single map first and compare it with Overlay under the same light before using both.
- **Backlighting.** Mix Principled in the first shader socket and Translucent BSDF in the second. Factor 0 selects Principled and 1 selects Translucent. Start with a foliage mask scaled to a modest contribution and use a separately tunable foliage tint for the transmitted light. If following the tutorial, a luminance ramp and subtracted spherical gradient shape the effect toward the canopy edges. Preview the mask directly, and keep the contribution near zero on bark. Start with the Translucent BSDF Normal input unconnected. Add a separate mapped normal only if it improves the backlit result. Use normal data for channel adjustments and test against the neutral baseline.
- **Optional variation.** Add per-object tint after validating the untinted asset. Restrict it to foliage and keep it subtle. Confirm the random value varies at the actual instance level used by the scatter.

## Diagnose by isolating one branch

Keep camera, sun angle, exposure, and visibility fixed for each comparison. Inspect actual connections to the active Material Output and identify shader inputs by socket position. Confirm the viewport and render use the same lights and visible cards when comparing them.

| Symptom | Isolate and check |
| --- | --- |
| Dark flecks increase under grazing light | Compare front Normal Map Strength 0 against the current value, then test the tree normal without Overlay. Check Non-Color, matching UVs, and map orientation. Compare an unlit color-plus-alpha preview to identify shadows already in the source. Check for coplanar duplicate cards if the marks appear only in renders. |
| Orange or bright flecks persist as front normal strength changes | Compare raw color-plus-alpha with the final color branch. Bypass inherited color variation first. If the marks persist, isolate specular and translucency one at a time. If the fringe follows partially transparent edges, inspect the RGB and alpha channels for export or filtering contamination. |
| Barely any backlight | Confirm the light is on the far side of the plane. Preview the translucency mix factor in grayscale. A ramp inherited from a brighter tree can leave a dark pine near zero almost everywhere. Move the white point toward the darker foliage range, or drive the factor directly from a calibrated foliage mask. Compare with the translucent normal neutral and tune tint independently of the dark base color. |
| Rectangular haze or filled gaps | Check that alpha gates the final mixed surface and that Transparent is first in that final mix. Test against both dark and light backgrounds. |

In the oak-to-pine example, the replacement pine normal and mask were initially set to sRGB on their own image datablocks. After correcting those, bypassing the oak's red/blue variation removed the orange fringe. Moving the pine's translucency ramp white point from 1.0 to 0.22 and setting its separate translucency normal strength to 0 improved backlighting in that scene. Treat those values as a case study. The mask range and light determine useful values for each asset.

## Verify the shot and the performance

Check one card close up, at intended distance, and with front, grazing, and rear lighting. Inspect the silhouette, trunk opacity, cast shadows, and any camera motion. Then test a representative group of instances. Keep the source geometry available for comparison and nearby shots. If making a performance claim, compare equivalent shots with the same engine, sampling, resolution, and population. Track render time and memory where available. Dense overlapping alpha cards still cost shading and transparency work, and textures consume memory even when triangle counts drop.

## Sources

- [CG Boost forest card tutorial](https://www.youtube.com/watch?v=6oNCCWslveM)
- [Blender Manual: Normal Map](https://docs.blender.org/manual/en/latest/render/shader_nodes/vector/normal_map.html)
- [Blender Manual: Translucent BSDF](https://docs.blender.org/manual/en/latest/render/shader_nodes/shader/translucent.html)
