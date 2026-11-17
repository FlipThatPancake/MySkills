# Geometry core fixtures

`node tests/cozy-interiors/geom/run.mjs`: small exact scenes (a book 3, 0.5, 0, -1, -3, -8 mm from a table top, a turned table, a mug on a rounded box, a leg 4 mm into a turned rug, a book over an edge, a kettle over a basin, a floating vase) built with the skill's kit and run through `scene/geom`. Distances must match within 0.01 mm; things that should fall or tip must be reported by the settle test and things that should stay must not.
