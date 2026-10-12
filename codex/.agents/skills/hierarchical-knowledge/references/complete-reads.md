# Complete reads and truncation

`python3 tools/context.py read --all` emits every maintained node in `knowledge/` once, without a hard word cap. Read instructions, code, skills, and binary assets separately as needed.

For large selections:

1. Run `read --all --batch 1`, then every remaining numbered batch. Selected-ID reads also support batching.
2. Keep the selection, options, batch size, and snapshot ID unchanged. If the snapshot changes, restart the selection.
3. Check each receipt and the surrounding tool output for truncation. A receipt confirms only what the command emitted, not what reached you or what you understood.
4. If output is truncated or the receipt is missing, retry with a smaller `--batch-words` target. It is an approximate size, not a content limit; whole nodes stay together.
5. For a single oversized node, read its reported source range in contiguous portions. Report any content still unread.

Claim a complete review only after reading every selected node, batch, or portion. A successful command or final receipt alone is insufficient.
