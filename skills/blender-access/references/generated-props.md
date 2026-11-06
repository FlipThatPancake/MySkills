# Prepare and qualify generated props

Use when image-to-3D suits the intended asset or when evaluating a supplied
generated mesh. Choose a suitable provider when generation is needed, within
the user's authorization for inputs and cost.

- **Prepare the image for reconstruction.** Isolate one complete object.
  Prefer a plain background, even light, and a view that shows its silhouette
  and construction clearly. If the provider accepts extra views, supply only
  views that agree on the object's pose, proportions, and parts. Give a known
  dimension separately when scale matters.
- **Qualify one representative asset before a batch.** Stage the import away
  from approved scene objects and keep the original separately. Check hidden
  faces, openings, fused parts, stray geometry, and normals. Check dimensions,
  orientation, origin, and support in the target scene. When appearance
  matters, inspect actual texture channels and packing and distinguish color
  textures from roughness, metalness, and normal data.
- **Keep what fits the shot.** Inspect in neutral light to diagnose the asset,
  then check it from the nearest intended view in context. Replace a broken
  handle, hinge, or other functional detail with editable geometry when that
  is cheaper than regenerating the whole mesh. If a retry leaves the same
  defect, change the reference or method before spending more.
