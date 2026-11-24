# Environment add-ons

All four were enabled in live Blender 5.2.2 LTS on 2026-11-06. The tests below
ran in a separate offline Blender process. They checked scene setup and did
not include renders or save-and-reopen checks.

## A.N.T. Landscape

Use for natural terrain and seeded variations. Use native mesh construction
when exact grades, boundaries, or surveyed elevations drive the scene.

Background test passed in Object Mode. The following generated a mesh with
1,024 vertices and 961 faces. `refresh=True` is required on the direct
execution path.

```python
bpy.ops.mesh.landscape_add(
    refresh=True, subdivision_x=32, subdivision_y=32, random_seed=7
)
```

Set dimensions, noise parameters, and placement for the job. Verify mesh
dimensions and silhouette before placing scene assets. For manual setup, use
Object Mode and search for **Another Noise Tool - Landscape**. Set the grid
resolution, terrain size, and seed in the operator settings.

## Physical Starlight and Atmosphere

Use for outdoor shots that benefit from a coupled sun and procedural sky.
In a scratch scene with a World, `bpy.ops.psa.add_atmosphere()` created a
`Starlight Sun` and populated the World with atmosphere, cloud, and star
node groups. Treat this as a world-lighting change. Verify the World and sun
settings and check exposure from the intended camera. For manual setup, use
the add-on's **Add Atmosphere** command and adjust the sun and sky controls.
For simpler daylight, use a native Sky Texture and a Sun as needed.

## Physical Open Waters

Use as a candidate when a shot needs a coupled ocean, material, and underwater
setup. The background test of `bpy.ops.pow.add_ocean()` partially created an
ocean, then failed while wiring Geometry Nodes inputs. It reported a missing
`Input_21` driver property and an unsupported modifier property assignment
for the camera. Retest this setup in a scratch scene after an add-on or Blender
update. For routine water, use a native Ocean modifier and a scripted material.

## SurfaceFlow

Use as a candidate for effects that follow a mesh surface. The background
test selected a source mesh and an active target mesh. `bpy.ops.sf.modifier_add()`
loaded the node group and then failed when assigning its Target input to the
modifier. The bundled group is still a candidate for direct append once its
target assignment and evaluated result are verified on the current version.
See [the bundle location](assets-specialist-addons.md).
