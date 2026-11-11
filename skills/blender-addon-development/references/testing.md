# Testing an add-on

## Headless

```
blender -b --factory-startup --python tests/run.py
```

Raise on a failed check and end with `sys.exit(1)`, so the command fails. For pytest, either launch it from inside Blender with `--python-expr`, or use the `bpy` module from PyPI whose version matches the target Blender (unverified for 5.x).

## Checks that catch most bugs

- Register, unregister, register again. Leaked properties and draw handlers show up here.
- Save the .blend, reload it, and confirm the records are still there.
- Duplicate, rename, and delete a target object; confirm ids stay unique and stale records are handled.
- Undo and redo each operator.
- `blender --command extension validate` passes.

Operators that need mouse input and modal tools are hard to test headless. Test their logic as plain functions, then check the interaction live.

## Live check

Install the built zip in the user's Blender, then verify through an MCP with Python execution: read the stored records, run an operator, and take a viewport capture when the add-on draws anything.

## Versions

Test the lowest version in `blender_version_min` and the version the user runs. If that range crosses 5.0, test both sides: annotations, `bpy.props` access, and drawing all changed there.
