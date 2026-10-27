# Writing Skills: initial verification

Date: 2026-10-27. This is a small initial check, not a reliability benchmark.

## Setup

The reusable prompts, checks, and fixtures are in `cases.json` and `fixtures/`. Each execution used a fresh hosted Codex subagent with no inherited conversation. Two authoring tasks were run once with the candidate and once with the host's existing authoring guidance, without the candidate. The paired arms used the same inherited model and available host tools. No Claude Code execution was performed.

The runners returned draft artifacts in their responses. They were given task prompts and source fixtures, not evaluator checks, expected answers, or diagnoses. A separate static reviewer read the candidate and its four references. Temporary execution artifacts stayed outside the installed skill.

## Observed results

| Check | Candidate | Baseline / comparison |
| --- | --- | --- |
| New review-synthesis workflow | Produced specific metadata, evidence identifiers, grounded counts, contradiction handling, design hypotheses, and proposed cases. Clearly marked target execution and activation as untested. | Also produced a strong draft satisfying the core task. This case does not establish superiority. |
| Generalize legacy release-notes skill | Preserved editorial rules and section order; removed custom routing, helper dependencies, blanket approval, and fixed CLI requirements. Produced a short loader with retrieval, consistent-revision, and unavailable-source handling. | Preserved the useful behavior and removed dependencies too. Its sibling instructions repeated editorial rules, leaving a second copy to maintain, and did not explicitly require reading a consistent revision. |
| Typo-only change | Returned the exact supplied file with only `reciept` changed to `receipt`. No behavioral evaluations or installation were performed. | A regression boundary; no baseline run was needed for this exact textual edit. |
| Independent static review | No actionable ambiguity, contradiction, portability error, unnecessary dependency, or overhead problem reported. | Static review only; no activation or execution conclusion follows from it. |
| Structural validation | The host creator's validator passed. Additional checks passed for shared frontmatter, naming and description limits, linked local files, placeholders, main-file line budget, and UI metadata. | These checks cover structure, not task reliability. |

The tested main file was 91 lines and approximately 1,268 whitespace-separated words. Its four references load conditionally. No custom executable helpers were added.

## Limits

These runs exercised the authoring skill by producing drafts. They did not behavior-test the newly drafted review or release-note skills. Each paired case had one execution per arm, so no pass-rate or consistency estimate is claimed. The host's built-in authoring guidance was available to both arms.

Implicit activation, Claude Code runtime behavior, Claude chat upload, and local Codex discovery remain untested. Cross-platform guidance was checked against current official documentation; that does not establish behavioral parity. Cost and token usage were not measured.

The source files and matching project loader were prepared separately from app project settings. Saving the loader does not change those settings.
