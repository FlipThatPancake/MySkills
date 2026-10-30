# Optional read audit

For an end-of-session assessment of on-demand reading, retrieval breadth/depth, and token benefit, use [usage-report](usage-report.md). It combines this collector's evidence when available with the task sequence, reasons for reads, outcomes, and relevant knowledge that was missed. It does not require instrumentation.

Use only to investigate reading behavior. The collector is quiet during retrieval and needs no subagent. It requires macOS/Linux; the reader works without it.

From the project root, with the optional collector installed:

```sh
python3 tools/context_audit.py start --intent targeted --targets ID
# Perform the task with normal context.py reads.
python3 tools/context_audit.py report
python3 tools/context_audit.py stop
```

Use `--intent all` for complete reviews. Add `--skill /path/to/skill` at start and load references through `context_audit.py view PATH` to measure their emissions. Set distinct `CONTEXT_AUDIT_READER` labels for agents with separate contexts. `report --details` explains signals; `--run RUN_ID` selects retained runs.

| Signal | Review |
| --- | --- |
| A/K/S | All knowledge or skill references emitted |
| T/C/B | Extra subjects, children, or broad metadata discovery |
| R/I/Q | Repeated content, incomplete full read, or soft character budget exceeded |

Signals are advisory. Logs hold metadata, counts, and fingerprints, not bodies. They measure instrumented emissions, not comprehension; direct file reads are unobserved. Compare answer quality, source fidelity, returned characters, and sequential calls on the same tasks. Characters are not billed tokens; cost needs model/cache usage data.

The collector cannot determine whether an unread node was necessary, why a read occurred, or whether broad retrieval was justified. Pair its events with visible task evidence in the usage report. Check whether declared targets still matched the task after user steering; a read outside an old target is not automatically excessive. Internal reader scans also do not establish that their file contents were emitted to the agent.
