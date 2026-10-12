---
name: approval-first-changes
description: Reviews repository differences and obtains approval before project-file changes.
---

# Approval-first changes

Before changing project files:

1. Check the target files for differences with the repository. If any exist, report them and propose how to resolve them.
2. Present each change on one line with an ID (e.g. C1), followed by its exact text or diff; specify source/destination paths for moves.
3. Wait for the user to explicitly approve the relevant IDs.
4. Apply only the approved changes.
5. After applying approved changes, recheck main and reconcile upstream changes without discarding work. Commit/publish only approved changes to main without force-pushing; verify and report the remote commit.
