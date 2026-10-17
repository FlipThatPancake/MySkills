# Blender CLI

Use for project scripts, batch renders, rebuilds, exports, and independent checks.
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
