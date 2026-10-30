# Project knowledge

Read stored knowledge when the task needs it. Commands follow `python3 tools/context.py`:

- `read ID [ID ...]` batches targets with foundation and ancestors once per call. Use `read PROJECT` for broad orientation; targeted tasks can search directly. Match foundation IDs to `knowledge/context.json`.
- `search <terms>` locates subjects; `inspect ID` shows ancestry, children, and references without bodies. Discovery is optional when IDs are known.
- `--only` reuses already-loaded, current context; `--children` adds immediate children. Deeper nodes and links stay optional.
- `read --all` emits all knowledge. For large output use `--batch 1` through the final batch with the same selection and snapshot. Restart if it changes. Check receipts and tool truncation; retry smaller batches or read an oversized node's reported source range in portions. Claim completeness only after reading all selected content; report anything unread.

Keep these reading rules here; load the knowledge skill when saving or restructuring information, not merely to read it.
