# Instruction patterns and bundled helpers

Choose the form that addresses the failure; avoid turning every skill into the same long checklist.

| Observed problem | Useful form |
| --- | --- |
| The result omits a required item | Output template with a required slot |
| The right action depends on input | Observable condition and explicit branch |
| A fragile operation is repeatedly reconstructed | Tested script or exact tool recipe |
| The agent knows the facts but sequences steps incorrectly | Short procedure with a check before the consequential step |
| The agent applies the workflow to neighboring tasks | Narrower description and negative activation cases |
| Valid approaches vary by context | Recommended default plus the condition for choosing another approach |

## Concrete wording

**Vague:** “Handle missing data appropriately.”

**Actionable:** “If a required amount is missing, ask for it before calculating the total. Keep processing records whose required fields are complete.”

**Overbroad:** “Always ask the user before making any changes.”

**Scoped:** “Before publishing externally, show the final content and follow the applicable approval requirement. Reuse approval already given for that content.”

**Unportable:** “Run the project's `save-changes` skill, then `tools/context.py`.”

**Reusable:** “Follow the project's change workflow and read its authoritative context. If either is absent, use the user's request and available source files; report consequential missing context.”

**Unnecessary rigidity:** “Run exactly three tests three times for every edit.”

**Proportionate:** “For a behavior change, rerun affected cases and add a case for the new failure. For wording that changes no meaning, inspect the diff.”

Examples should demonstrate a decision, format, or trap that prose leaves ambiguous. Use realistic inputs; omit decorative examples and examples that merely repeat the rule.

## Scripts and tools

Use an existing reliable tool before adding a wrapper. Bundle code when it makes repeated or fragile work more reliable, or when repeated task runs keep rebuilding the same helper. Declare the minimum runtime and dependencies; pin versions where reproducibility requires it.

For each helper, document:

- Whether to execute or read it, and how to resolve its path.
- Inputs, outputs, side effects, and prerequisites.
- A noninteractive invocation with clear flags or stdin.
- Success/failure exit behavior and actionable error messages.
- What to do after partial completion, and whether retrying is safe.

Use dry runs or isolated outputs when they reduce meaningful risk. Keep secrets out of files and logs. Review imported code before execution. A reference file should not instruct the agent to bypass authorization or transmit unrelated data.

Run representative success and failure paths for new or changed code. Avoid claiming a whole skill works merely because its YAML validates or a helper exits successfully.

## Prune before expanding

When a run fails, inspect the trace and artifact. Identify whether the cause was discovery, missing expertise, ambiguous guidance, unavailable capability, or a faulty helper. Fix that layer. Avoid appending another prohibition when a clearer output shape, one branch, or a code fix would solve the problem.

After revision, remove superseded text. Keep research notes, test results, and installation walkthroughs outside the runtime procedure unless the agent needs them to do the job.
