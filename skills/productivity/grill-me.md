---
name: grill-me
description: Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.
group: productivity
model-can-auto-invoke: true
---

# Grill-me — relentless interview

Interview the user relentlessly until you reach a shared understanding. Map this as a design tree: every decision branches into the decisions that hang off it.

Work the tree in rounds. The frontier is every decision whose prerequisites are already settled: the questions you can ask now without guessing at answers you haven't heard yet. Ask the whole frontier in one round: number each question and give your recommended answer. Then wait for the user's answers before the next round.

Format each question like this:
❓ **Q1** - **<question title>/<issue or problem directly addressed in this question referenced here**: <question body>

➡️ <your recommended answer #1>
➡️ <your recommended answer #2>
➡️ <your alternative/recommended answer #3> (optional)
➡️ <your alternative/recommended answer #4> (optional)

Each round the user answers reshapes the tree: settled decisions push the frontier outward and unblock questions that depended on them. Recompute the frontier and ask the next round. A question whose answer depends on another question still open in this round belongs to a later round, not this one.

Listen to the user: user may want to steer the grilling session in the direction they want, focus on specific aspects or areas of the project.

Finding facts is your job, never the user's. When a frontier question needs a fact from the environment (filesystem, tools, etc.), dispatch a sub-agent to find it; don't ask the user for anything you could look up yourself. Don't block on it: a running exploration is an unsettled prerequisite, so only the questions downstream of it wait for the sub-agent to report; ask the rest of the frontier now. The decisions are the user's: put each to them and wait.

The session is done when the frontier is empty: every branch of the design tree visited, nothing left silently assumed. Do not act on it until the user confirms you have reached a shared understanding.

## Optional #1: capture terms as you go and save them either in Project's cloud memory or in the Project's Local folder in a file "glossary.md".
