# BlenderKit

Use for broad model searches, especially specific, sci-fi or stylized props,
and for materials, HDRIs, scenes, brushes and node groups. Confirm the asset's
access tier and license individually. Free access and license are separate
fields. [BlenderKit](https://www.blenderkit.com/our-mission/)

## Live search verified on 2026-11-06

BlenderKit 3.21.3 was enabled. The dedicated MCP `search_assets` tool has no
BlenderKit source. Use the add-on panel or, via `execute_blender_code`, resolve
the enabled module ID ending in `.blenderkit` and import its `.search` module.
This version's internal API was tested as follows:

- Check `search.global_vars.CLIENT_ACCESSIBLE` and whether
  `search.get_active_history_step().get("is_searching")` is true. Leave an
  ongoing user search alone. With the model tab active,
  `search.search(query={"asset_type":"model","query":"sci-fi container","free_first":True})`
  started an async search in the active history tab. Match the tab to the
  asset type. For other versions or changed APIs, use the visible add-on panel.
- In a later MCP call, after searching finishes, read
  `search.get_search_results()`. Return only relevant fields such as
  `displayName`, `assetBaseId`, `assetType`, `isFree`, `license` and
  `thumbnailSmallUrl`. Match the query and IDs. Titles can be identical.
  Cached result thumbnails may be in `search.paths.get_temp_dir("model_search")`
  under the result's `thumbnail_small` filename. Check the file exists.
- The registered **BlenderKit** library contains downloaded files. It is a
  local starting point. A cache hit does not by itself verify a license.

| Example | Use |
| --- | --- |
| Sci-Fi Container, base ID `e699f9d4-acb7-4875-88e5-67cca053a129` (live result, free, royalty-free) | Cargo or industrial sci-fi set dressing |
| Sci-Fi Cyberpunk Barrels (download cache) | Background storage and industrial clutter |
| Concrete Wall Texture (download cache) | Large concrete wall surfaces, subject to scale and tiling review |
