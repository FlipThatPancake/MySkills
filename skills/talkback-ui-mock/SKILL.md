---
name: talkback-ui-mock
description: Draw rough PNG mocks of Talkback (Blender add-on) viewport UI, such as speech bubbles, stacks, hover cards and the message field, to compare layout options before building.
---

# Talkback UI mocks

Use when a Talkback viewport change is easier to judge as a picture, or a plan offers options. Needs Pillow.

1. Colours and sizes sit at the top of `scripts/tbmock.py`. If the newest build's `chat_comments/style.py` is reachable and differs, update them there.
2. Write a short script: `sys.path.insert(0, "<this skill>/scripts")`, `from tbmock import Mock`, one column per option with a `heading`, then `m.save(...)`. Run it with `python3 -I`. `python3 -I scripts/tbmock.py demo.png` draws every call; signatures are in the docstrings.
3. Open the PNG. Fix overlapping headings and text that overflows its box.
4. Share it as a rough mock (right colours and proportions, not pixel-exact), with one or two plain sentences per option.

## Rules

- One image with at most three options, each labelled ("A. Stack badge (recommended)").
- Put "Now" (today's look) first, beside the options, when the mock changes something that exists.
- Use the words of the add-on's `glossary.md` (or these, if it is out of reach): Speech bubble, Hover card, Message field, Agent prompt. Write example titles and messages as a user would ("Door glass darker").
- State icons: paper plane = Ready for agent, orange dot = Agent asks you, green tick = Done, no icon = Resolved.
