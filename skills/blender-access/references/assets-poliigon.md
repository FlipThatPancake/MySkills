# Poliigon

Use for photoreal architectural PBR surfaces, selected props and environment
HDRIs. The enabled add-on was 1.15.0 on 2026-11-06. In Blender, use the
Poliigon sidebar to search by type and check Free, Owned or Local as needed.
The asset grid or detail viewer supplies previews. Browsing can surface items
outside the user's plan. [Poliigon add-on guide](https://help.poliigon.com/en/articles/6342599-poliigon-blender-addon)

Through MCP Python, the add-on's `toolbox.cTB._asset_index.all_assets` was
readable but empty at test time. The internal connector
`toolbox.cTB._api.search_assets("oak wood", size_page=4)` returned online IDs
in `response.body["data"]`. Calling `get_asset_details(id)` on that connector
returned `Name`, `Type`, `WebsiteUrl` and preview metadata. These internals
are version-specific. Keep network calls off Blender's main thread and return
only the needed asset fields. Cached thumbnails under `~/Poliigon/OnlinePreviews`
show previously browsed entries. Check availability and ownership in the
sidebar.

| Example | Use |
| --- | --- |
| [Oak Wood Board Texture, Amber](https://www.poliigon.com/texture/oak-wood-board-texture-amber/9144) | Warm amber floorboards for a wood-toned interior |
| [Oak Wood Board Texture](https://www.poliigon.com/texture/oak-wood-board-texture/8322) | A second oak floorboard option to compare at room scale |
| Marble slab `Poliigon_MarbleSlab_11778` (preview cache) | Countertops and large stone panels |
| `HdrBeachOceanSunset001` (preview cache) | Warm coastal environment lighting |
