# Simulation add-ons

Quick Physics was enabled on Blender 5.2.2 LTS on 2026-11-06. FLIP Fluids was
installed and disabled. These are inspection findings without a simulation
bake test.

## Quick Physics

Useful for interactive cloth and rigid-body previews. The installed cloth
workflow starts timeline playback and can wait for a click to apply the
result. Use native cloth or rigid-body setup with explicit cache, frame range,
and bake settings for a repeatable script. For a UI handoff, confirm the
relevant command label in the current version and specify the source mesh,
colliders, and frame to inspect before applying the result.

## FLIP Fluids

Consider for a shot centered on liquid simulation. Check the enabled version
and cache location, then verify a small domain and short bake with the intended
inflow and colliders before committing to the production resolution. Use a
native Ocean modifier for a wave surface and native liquid simulation where its
controls meet the shot requirements.
