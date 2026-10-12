# Grill-me commands

**print tree**, **list questions**, **digest**, and **wrap up** pause the grill: do what's asked, then wait for the user without asking the next question.

**one at a time**, **rounds of N**, **whole branch**: Switch pace and carry on. Rounds ask N frontier questions per message; whole branch asks all of the current branch's answerable questions at once.

**print tree**: Show the whole decision tree as an indented outline, marking each node settled, provisional, open, or pruned, with its question number where it has one. If the tree is large and the platform can show something more readable (an artifact, a diagram), offer that.

**list questions**: Show the frontier questions of every branch, grouped by branch, as one-line titles. If the user picks a question, ask it. If they pick a branch, start with its first answerable question, not a deeper one still waiting on earlier answers.

**deeper**: Re-examine the current question from scratch. Question its framing, look for options beyond the ones offered, and check whether it's the right question at all. Then ask it again, reworked.

**ask again Qn**: Discard the answer to Qn and reopen every decision that was settled because of it. Ask Qn again with the old answer noted for reference, then continue from there.

**digest**: Take in what the user sent (a partial answer, new context, new issues), update the tree, and acknowledge in one line, noting anything it reopened. Resume asking on their next ordinary message.

**wrap up**: Summarize what's settled, provisional, and still open, including every open question and finding that isn't recorded anywhere else, because the tree disappears when the session ends. Then offer to save it.
