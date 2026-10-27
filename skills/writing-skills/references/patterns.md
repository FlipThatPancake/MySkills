# Choosing the form of guidance

Choose the form that supplies missing task expertise with the least unnecessary constraint.

| Need | Useful form |
| --- | --- |
| A required part of the result is often omitted | Output template with a required slot |
| A domain decision depends on observable input | Conditional rule with a clear branch |
| Several methods can produce a good result | Outcome criteria and a recommended default, if useful |
| Order is necessary for correctness or the user's goal | Short procedure explaining the dependency |
| A repeated or fragile operation benefits from deterministic execution | Existing tool or a bundled helper |
| Activation overlaps with a neighboring skill | Clearer description and relevant near-miss examples |

## Examples

**Useful preference:** “Give one algebra step at a time and explain any shortcut.” This changes the teaching experience; generic encouragement to be helpful does not.

**Outcome instead of itinerary:** “Identify recurring pains and cite the supporting reviews” leaves the analysis method open. Require a fixed sequence only if a real dependency makes it necessary.

**Domain boundary:** “For an expense total, ask for a missing required amount rather than treating it as zero” explains a task-specific decision. Generic rules to ask clarifying questions add little when the host already supplies them.

**Preserve needed structure:** A required approval or laboratory sequence may be part of the job. Remove incidental tooling, not the requirement that gives the sequence its purpose.

## Helpers

Reuse the host's available tools and script conventions. Bundle a helper when it prevents repeated reconstruction or makes a fragile operation more reliable. Document the inputs, outputs, prerequisites, side effects, and recovery behavior that the agent cannot infer from its interface.

## Revising a rule

Separate discovery failures, missing domain knowledge, unclear requirements, unavailable capabilities, and faulty code. Repair the cause. Revisit old restrictions when host capabilities change; retain them when they still protect a user preference or an evidenced requirement.
