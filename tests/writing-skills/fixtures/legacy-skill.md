---
name: release-notes
paths:
  - src/**
description: Use for everything related to releases.
---
# Release notes
Run the project's save-changes skill before writing, then node tools/atlas-release.mjs.
Read knowledge/glossary.md and use the Atlas repo's product names.
Always ask for approval before editing any file, including a draft.
Write release notes from the supplied commit messages or diffs. Do not invent changes.
The output has Added, Changed, Fixed, and Known issues sections. Omit empty sections.
Exclude internal refactors that don't affect users. When user impact is uncertain, flag the entry for review.
Run claude plugin eval . --runs 3 --max-cost-usd 15 for every change.
