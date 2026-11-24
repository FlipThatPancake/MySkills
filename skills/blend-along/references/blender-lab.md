# Blender Lab MCP

Use search_api_docs for API discovery, get_python_api_docs for a known name, and search_manual_docs for feature or UI behavior. Use missing-file and linked-library reports for dependencies. Choose live inspection for unsaved state or the background file report for a saved copy. Use layout and navigation tools when asked to show something in the interface. When Lab is unavailable, use version-matched documentation or a suitable live query.

- Follow the [official setup](https://www.blender.org/lab/mcp-server/) for
  Blender 5.1+. Pair Lab's own add-on and server under a distinct client name
  such as `blender_lab`. Bare `uvx blender-mcp` selects Ahuja.
- For live use, verify the active file and scene. Use the exposed screenshot,
  documentation, or Python tools as needed.
- Planned local Lab port: 9876. See the Ahuja connection guide for the paired client settings. Verify the connected instance before use.
