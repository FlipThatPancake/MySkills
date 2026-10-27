# Source guidance

Checked 2026-10-27. These sources inform the workflow; its file layout, proportional evaluation policy, and project loader are a synthesis for portable authoring, not a vendor-mandated package. Recheck current documentation when relying on changing product behavior.

| Primary source | Use it for |
| --- | --- |
| [Agent Skills specification](https://agentskills.io/specification) | Shared folder format, frontmatter, naming limits, optional fields, and progressive disclosure. |
| [Agent Skills: best practices](https://agentskills.io/skill-creation/best-practices) | Grounding skills in real expertise, coherent scope, useful defaults, and appropriate control. |
| [Agent Skills: evaluating output quality](https://agentskills.io/skill-creation/evaluating-skills) | Realistic task cases, clean comparative runs, artifacts, and iterative improvement. |
| [Agent Skills: optimizing descriptions](https://agentskills.io/skill-creation/optimizing-descriptions) | Positive and negative activation cases, repeated runs, and held-out prompts. |
| [Agent Skills: using scripts](https://agentskills.io/skill-creation/using-scripts) | Runtime prerequisites, noninteractive interfaces, outputs, errors, and reliable helpers. |
| [Anthropic: skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) | Concision, degrees of freedom, conditional references, and testing with intended models. |
| [Claude Code: extend Claude with skills](https://code.claude.com/docs/en/skills) | Discovery, invocation, Code extensions, and restrictions outside Claude Code. |
| [Anthropic's skill-creator](https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md) | Intent gathering, paired execution, artifact review, and generalizing from failures. Its particular tooling is not a universal requirement. |
| [OpenAI: build skills](https://learn.chatgpt.com/docs/build-skills) | ChatGPT/Codex activation, current local discovery locations, optional OpenAI metadata, and instruction-only defaults. |
| [OpenAI: skills in plugins](https://developers.openai.com/plugins/build/skills) | Workflow inputs/outputs, boundaries, supporting files, and tool integrations. |
| [OpenAI: testing skills with evals](https://developers.openai.com/blog/eval-skills) | Observable process and output checks, realistic prompts, traces, and regression cases. Prefer current product docs over older examples for installation paths. |
| [OpenAI: rethinking skills and prompts](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra) | Simplifying overlapping instructions, keeping routers small, and revisiting restrictions that add overhead. Model-specific guidance needs testing on other models. |

The user's [original project skill](https://github.com/FlipThatPancake/m2.0-interactive/tree/62e30517980719b22074faa4f8cfa341f07662be/.claude/skills/writing-skills) contributed the focus on concrete failures, choosing the correct home, grammatical concision, conditional rules, and independent evaluation. Project-specific helper names, custom routing, fixed CLI recipes, approval batches, and cost assumptions were not carried into the shared contract.
