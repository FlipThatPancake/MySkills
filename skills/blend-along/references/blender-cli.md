# Blender CLI

Use the open scene as the working version. If the task concerns unsaved edits, work live or take a separate, identifiable snapshot from the open session. Use a distinct output path for the background job. Check external textures, linked assets or simulation caches only when the job reads or writes them.

For a separately built asset, bring its object or collection and required dependencies into the live scene. Check scale, placement, materials, and fit as the brief requires. For a test or render, use its findings or preview. Associate that evidence with its input snapshot and frame or camera when relevant. If a later edit matters to the conclusion, repeat the affected check against the current state.
No MCP server or add-on is needed.

Discover the installed executable and check `--version`. Example:

```sh
blender --background scene.blend --python-exit-code 1 --python task.py
```

Replace `blender` with the executable path when needed. Load the file before
running its script; Blender processes arguments in order. For a new build, use
`--background --factory-startup --python-exit-code 1 --python build.py`.

CLI starts a separate process. Use a live controller when the task depends on
unsaved scene state. Keep reusable scripts and outputs in the project.

Consult the installed version's [command-line documentation](https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html).
