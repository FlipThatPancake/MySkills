# Saving a grill

If the user describes how they want it saved, do it their way.

## Decisions file

With local file access, write `grill-decisions-<YYYY-MM-DD>-<topic>.md`, using the user's topic name or a short one you choose. Put it where the project keeps documents like this, or ask. Include:
- **Settled:** each decision with its question number, the choice, and the reason in a sentence.
- **Provisional:** each default, and what would confirm or change it.
- **Open questions:** questions in the decision tree that were identified but not yet answered when the session stopped, grouped by branch, each with enough background to be asked cold in a new session.
- **Findings:** problems surfaced during the grill that haven't become questions yet.
- **Tree:** an indented outline with each node's status.

Without file access, give the same content in the chat for the user to keep.

## Resuming

When the user points you to a saved file, rebuild the tree from it and start as a normal session: orientation, then its open questions. Continue the question numbering from where it stopped.
