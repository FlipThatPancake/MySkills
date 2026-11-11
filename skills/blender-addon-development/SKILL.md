---
name: blender-addon-development
description: Use when writing, packaging, debugging, or testing a Blender add-on or extension (operators, panels, properties, draw handlers, blender_manifest.toml), including add-ons whose data or tools agents read through an MCP. For using add-ons that are already installed, use blender-access instead.
---

# Blender add-on development

Write for the Blender version the user runs. Read `bpy.app.version_string` in the live session, or use the executable named in the project instructions. This skill dates from 2026-11-11 and Blender 5.2.2 LTS (Python 3.13). Its facts come from Blender's docs or a live check in 5.2.2; lines marked (unverified) come from neither.

If a detail matters and is not confirmed for the target version, probe it before relying on it: print `hasattr(...)` and the names in `SomeType.bl_rna.properties` in the live session. Never guess an attribute name from memory or from another tool's summary.

## Look up the API

Look up a type or operator in the Python API docs for the target version (`docs.blender.org/api/<version>/`), through an API-search tool when the connected MCP offers one, or by searching `fake-bpy-module` stubs. Never read Blender's C source to learn the Python API; it is far too large and says little about Python use.

Before writing code for a version range, read the Python API release notes (`developer.blender.org/docs/release_notes/<version>/python_api/`) for each release from `blender_version_min` to the target. Known breaks in 5.0: annotations were renamed (`Scene.grease_pencil` became `Scene.annotation`), dict-style reads of `bpy.props` values such as `scene["cycles"]` stopped working, the legacy Action API and `bgl` were removed. Draw overlays with `gpu` and `blf`.

## Package as an extension

Build an extension (`blender_manifest.toml` plus `__init__.py`) by default. Build a legacy `bl_info` add-on only when the user needs Blender older than 4.2. Open [packaging.md](references/packaging.md) for the manifest keys, permissions, and build and validate commands.

## Avoid registration traps

- Use relative imports (`from . import ops`). Blender installs an extension as `bl_ext.<repo>.<id>`, so read the module name from `__package__` for preferences and never hardcode it.
- Declare properties as class annotations (`text: StringProperty()`), not assignments.
- Unregister in reverse order. Remove everything you attached: `del bpy.types.Object.<prop>`, draw handlers, timers, and `bpy.app.handlers` entries.
- Call `bpy` only from the main thread. Put work that arrives on a socket or worker thread into a queue that a `bpy.app.timers` function drains.
- Change data through `bpy.data` and properties. Call `bpy.ops` only for what has no data API, because operators depend on the current context and fail outside it.
- Read enum identifiers from `bl_rna` (for example `Type.bl_rna.properties["x"].enum_items`) rather than copying them from examples; they change between versions.
- Keep logic in plain functions that take data and return data, and keep operators thin, so the logic runs in a headless test.

Check: enable, disable, and enable the add-on again in one session with no errors, no duplicate panels, and no doubled overlays.

## Store data that agents read

When the add-on keeps information for agents, such as notes, tags, or links:

- Store each record on the data-block it describes, for example the object, so it saves with the .blend and follows renames.
- Give each record a stable id (a UUID). Object names change. Duplicating an object copies its custom properties, so detect repeated ids and give the copy a new one.
- Also write a plain JSON custom property, so any MCP that can run Python reads the data without the add-on enabled. Document the key and schema in the add-on's README.

Open [agent-readable-data.md](references/agent-readable-data.md) for storage options, anchor points, the annotation API, and MCP server patterns.

## Test

Run logic headless first, then check the real UI in a live Blender through an MCP or by hand. Open [testing.md](references/testing.md) for commands and the checks that catch most add-on bugs.
