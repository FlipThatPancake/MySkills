# Blender Python

Identify the object, material or collection the edit should affect. Use the data returned when creating an item. For a relative edit, use the target's current value in Blender.

Check the requested effect on that target. Read back a property for an exact change. Inspect the intended view or frames when the user cares about light, shape or motion.

For commands that depend on the editor, inspect the active object, mode and selection. Check whether the command can run in that context and whether it finished. Use direct data access for simple property changes.

Read the edit mesh when checking edits in Edit Mode. For the visible result after modifiers, constraints or animation, inspect the evaluated object at the intended frame.

Use Lab's API search to find an operation and its identifier lookup for exact usage. Use the running version and the corresponding Blender documentation when behavior differs.
