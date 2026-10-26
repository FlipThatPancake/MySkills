# Grill-me commands

**tree** and **save** pause the grill: do what's asked, then wait for the user without asking the next question.

**rounds of N**, **whole branch**: Switch pace and carry on. Rounds ask N frontier questions per message; whole branch asks all of the current branch's answerable questions at once. **rounds of 1** returns to the default.

**tree**: Show the whole decision tree as an indented outline, marking each node settled, provisional, open, or pruned, with its question number where it has one, and mark the questions answerable now. If the user picks a question, ask it. If they pick a branch, start with its first answerable question. If the tree is large and the platform can show something more readable (an artifact, a diagram), offer that.

**deeper**: Re-examine the current question from scratch. Question its framing, look for options beyond the ones offered, and check whether it's the right question at all. Then ask it again, reworked.

**ask again Qn**: Discard the answer to Qn and reopen every decision that was settled because of it. Ask Qn again with the old answer noted for reference, then continue from there.

**save**: Follow `references/saving.md`.
