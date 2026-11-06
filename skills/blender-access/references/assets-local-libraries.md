# Local Blender libraries

Look up current paths by library name in
`bpy.context.preferences.filepaths.asset_libraries`. Blender's Asset Browser
can show marked assets and thumbnails. `blender_assets.cats.txt` lists catalog
paths. For unmarked scene templates, inspect specific blend files through MCP
using the [asset source index](asset-sources.md) method.

| Library | Verified example and use |
| --- | --- |
| User Library | Action `Step-to-the-right` in `Saved/Actions/Step-to-the-right.asset.blend`. Use for a lateral step where the rig and action slots match. |
| Scenes | `Free Product Lighting Setup.blend` has standard, side and back three-point light collections for product shots. `Studio Backdrops by Egret Studios/EG_Backdrops.blend` and Alt Tab Ilumina files are starting points for backgrounds and studio scenes. |
| The Ultimate Gobo Pack | `The Ultimate Gobo Pack.blend` has `Window + Slow Tree` for shifting window shadows and `Caustics` for patterned light. Browse the pack's previews for the intended look. |
| Realistic_Touch | `Realistic_Touch.blend` contains the `realistic_touch` material and wiping-residue node groups. Use for close-up surface wear and smudges. |
| Props | The configured path was missing during the 2026-11-06 inspection. Recheck the root before offering it. |
| Poly Haven, BlenderKit | See [Poly Haven](assets-poly-haven.md) and [BlenderKit](assets-blenderkit.md) for the downloaded libraries and live searches. |

For a template or pack, verify the intended render engine and dependencies,
and check its terms if the deliverable includes editable source assets.
