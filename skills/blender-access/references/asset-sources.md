# Choose a Blender asset source

Choose how to make each important asset or asset family before choosing a
provider. Reuse a library asset when it fits the scene and needs little rework.
Favor direct modeling when exact dimensions, joints, or controlled variation matter.
Consider generation for a distinctive or irregular form when the expected
cleanup fits the brief. Use [Generated props](generated-props.md) for that route.
Combine methods when useful, such as building a dimensioned shell and sourcing
its furnishings.

Verified in the user's live Blender 5.2.2 LTS on 2026-11-06. Use
`get_addon_status` for MCP providers and inspect `bpy.context.preferences.addons`
and `bpy.context.preferences.filepaths.asset_libraries` for add-ons and configured
local libraries. MCP provider flags cover the built-in search tool. Other
enabled add-ons can be reached through Blender Python or their own UI.

| Need | Open on demand | Verified access |
| --- | --- | --- |
| Realistic models, scanned PBR surfaces, lighting HDRIs | [Poly Haven](assets-poly-haven.md) | Native MCP search and local asset library |
| Specific models, stylized props, sci-fi, materials, scenes | [BlenderKit](assets-blenderkit.md) | Live catalog through the add-on via MCP Python |
| Retail furniture, lighting fixtures, planters and household props | [ABO Connect](assets-abo-connect.md) | Search cached catalog and find thumbnails via MCP Python |
| Photoreal archviz surfaces, product props and HDRIs | [Poliigon](assets-poliigon.md) | Online search and asset details via MCP Python. Check ownership in the add-on |
| Procedural surfaces, Geometry Nodes props and shader modules | [Sanctus Library](assets-sanctus.md) | Search bundled files and inspect their contents via MCP Python |
| Quick procedural materials | [Realtime Materials Free](assets-realtime-materials.md) | Bundled category index and material names |
| Backdrops, studio lighting scenes, saved animation and effects | [Local Blender libraries](assets-local-libraries.md) | Read preferences, catalogs and selected blend-file contents via MCP |
| Fog, gobos, lighting presets and hard-surface details | [Specialist asset add-ons](assets-specialist-addons.md) | Bundled files, preset lists or add-on panels |

Sketchfab and Poly Pizza were off in MCP. Recheck only if needed. Prefer
Sketchfab for hard-to-find models with a suitable license and Poly Pizza for
stylized low-poly props when enabled. Generation tools make new assets and
may cost credits. They are separate from catalog search.

## When a search is worthwhile

- Search when an existing asset can meet the brief with less work than
  building it. Typical cases are set dressing, common materials, HDRIs and
  reusable presets. For a distinctive focal asset, weigh how much rework
  a library match would require.
- Start with the most relevant source and expand only if the matches fall
  short. For a shortlist, give the name, intended use, source link or stable
  ID and any access or license constraint. Some native searches launch a
  picker during discovery. Use a catalog or local lookup for text-first
  discovery where possible. An exploratory match stays a candidate.
- Before acquiring an asset, check the license, attribution and any costs.
  For an authorized import, follow the provider workflow as needed for
  placement or dependencies. Check dimensions, origin, materials and
  animation as applicable.

For local search, narrow by the configured library, catalog or filename before
inspecting blend files. Via `execute_blender_code`, use
`with bpy.data.libraries.load(path, assets_only=True) as (src, dst): ...`
and read the relevant lists such as `src.objects`, `src.materials`,
`src.node_groups` or `src.actions`. Leave `dst` untouched for discovery.
Omit `assets_only` for known add-on bundle files whose datablocks may be
unmarked. A name match establishes availability of a datablock. Check its
thumbnail and dependencies for fit. [Blender Asset Libraries](https://docs.blender.org/manual/en/5.2/files/asset_libraries/introduction.html)
