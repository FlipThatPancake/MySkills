# Compositing handoff

Use when a rendered scene will be finished or edited downstream. Decide what
must exist in 3D for contact, occlusion, and lighting, and what can be adjusted
as a finishing layer.

- Keep the uncomposited render available and provide only the passes or
  masks the finish needs. Record the source range, frame rate, and color
  transform. Check that the display transform is applied at the intended stage.
  For sequences, check for missing or corrupt frames before encoding.
- For a localized distortion or chromatic effect, keep an editable mask and
  restrict the effect to its intended area. Check that a zero mask returns
  the original input, including alpha where relevant. If separating color
  channels, keep their offsets close enough that the intended subject reads
  as one object. Check occlusion where the effect crosses foreground details.
- Tie onset, strength, and decay to the shot's visible action. Review a short
  before-and-after clip including a high-contrast edge and an onset or
  release before applying the finish across the cut.
