# Camera add-ons

Both were enabled in live Blender 5.2.2 LTS on 2026-11-06.

## Add Camera Rigs

Use when the user will animate or adjust a camera with rig controls.
In a separate offline Blender 5.2.2 session,
`bpy.ops.object.build_camera_rig(mode="DOLLY")` created a camera and a Dolly
armature. The command changes the active object and selection. Check the
scene's active camera, framing, and rig controls after creation. Crane and 2D
are available modes and need separate verification if used.

For a UI handoff, use Object Mode and choose **Dolly Camera Rig** from
**Add → Camera**. Check the shot in camera view. For a still or a simple
scripted orbit, create a native camera directly.

## AutoCam

Use when turning an existing camera move into an editable path. The installed
source exposed `bpy.ops.autocam.camera_to_curve()` for an active camera with
motion, and `bpy.ops.autocam.build_camera_rig()` for the generated curve.
Conversion needs at least three sampled frames. These operations were source
inspected and still need an execution test on a copy of the shot. Verify the
path, timing, and orientation against the original at representative frames.

For a UI handoff, select the animated camera, choose **Generate Curve** in
AutoCam's **Path** panel, and select the generated curve for **Generate Rig**.
**Start Recording** is for interactive fly recording. For a new move with an
explicit path, script the camera, constraints, or keyframes directly.
