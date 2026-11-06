# Poly Haven

Use for CC0 realistic props, scanned PBR surfaces and HDRI lighting. The
Poly Haven Assets add-on is enabled. The separate MCP provider was on and
returned all three asset types in live tests on 2026-11-06.

- Native search uses `search_assets(source="polyhaven", asset_type="models"|"textures"|"hdris", query=..., limit=...)`.
  It can invoke a picker. For discovery without the picker, search the local
  library or use Agent Studio's `blender_search_polyhaven_assets` for textures
  and HDRIs. Agent Studio's search was verified with `oak` and covers those two
  types. For uncached models without the picker, use the provider catalog.
- Local Asset Browser library **Poly Haven** had about 2,096 blend files.
  Read its root from preferences. An asset folder can have `info.json`,
  `thumbnail.webp`, a blend file and resolution-specific maps. Use the local
  thumbnail for an in-chat preview when available.
- For a requested live import, pass the exact ID and type to `import_asset`.
  An HDRI changes world lighting. Applying a texture to named objects replaces
  their assigned materials. Check a model's dimensions and ground placement.

| Example returned in search | Use |
| --- | --- |
| [Green Chair 01](https://polyhaven.com/a/GreenChair_01) | Carved upholstered armchair for vintage interiors |
| [Oak Veneer 01](https://polyhaven.com/a/oak_veneer_01) | Warm fine-grain material for furniture or cabinetry |
| [Oak Wood Planks](https://polyhaven.com/a/oak_wood_planks) | Varnished floorboards with visible seams |
| [TV Studio](https://polyhaven.com/a/tv_studio) | High-contrast indoor HDRI for broadcast-style lighting and glossy reflections |
