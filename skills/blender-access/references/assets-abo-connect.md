# ABO Connect

Use for specific real-world retail props such as lamps, furniture, shelving,
planters and household products. The add-on's cached model index had 7,953
records on 2026-11-06. The current dataset is CC BY 4.0. Record attribution
for reused assets. [Amazon Berkeley Objects dataset](https://amazon-berkeley-objects.s3.amazonaws.com/index.html)

## Cached search verified through Blender MCP

Resolve the enabled module ending in `.abo_connect`. The enabled copy was
1.1.1 and a second installed copy was disabled. On the enabled module,
`_get_cache_dir()` and `_db_path(cache_dir)` resolve the JSON catalog. Read
`items` and filter by `title_lc`, `product_type` or `category`. Return
`model_id`, title and face count. Use
`_guess_thumb_path(cache_dir, row["main_image_id"])` when the file exists.
These internal helpers are version-specific. Use the ABO Connect panel if
they change or the cache is missing. Cached previews are catalog photos.

| Verified candidate | Model ID | Use |
| --- | --- | --- |
| Barnwood farmhouse coat rack | `B01N2PLWIL` | Entryway wall dressing, 14,380 catalog faces |
| Dark-bronze cage floor lamp | `B07DBHPK4G` | Living room fixture, 22,736 catalog faces. Check lighting separately |
| Footed white stoneware planter | `B0842LM2DN` | Interior planting container, 7,584 catalog faces |
