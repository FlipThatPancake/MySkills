# Packaging an extension

Sources: Blender extension docs, read 2026-11-11. Lines marked (unverified) come from background knowledge; check them before relying on them.

## Layout

A zip holding `blender_manifest.toml`, `__init__.py`, any other modules, and optional `wheels/`. In an extension, the manifest is the source of truth and `bl_info` is ignored (unverified), so do not ship both with different data.

## Manifest

Required keys, none left empty:

```toml
schema_version = "1.0.0"
id = "object_notes"
version = "0.1.0"                 # semver
name = "Object Notes"
tagline = "Pin notes to objects for people and agents"   # 64 chars max, no final punctuation
maintainer = "Name <email>"
type = "add-on"
blender_version_min = "4.2.0"     # 4.2 is the earliest that supports extensions
license = ["SPDX:GPL-3.0-or-later"]
```

Optional keys: `blender_version_max`, `website`, `tags`, `platforms`, `wheels`, `[permissions]`, and `[build] paths_exclude_pattern`.

Declare each permission the add-on uses, with a reason: `files`, `network`, `clipboard`, `camera`, `microphone`. An add-on that opens a local socket for an MCP declares `network`.

## Dependencies

Blender bundles its own Python (3.13 in 5.2.2), so system pip packages are not visible. Ship pure-Python dependencies as wheels listed under `wheels`.

## Commands

```
blender --command extension validate   # inside the source folder
blender --command extension build      # writes the zip
```

Install the zip with Preferences > Get Extensions > Install from Disk. Publishing on extensions.blender.org needs a Blender ID and passes moderator review.
