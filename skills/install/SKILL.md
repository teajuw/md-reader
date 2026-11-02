---
name: install
description: Install the md-reader app from inside the md-reader session. Use when the user runs /md-reader:install or a session's prompt names this skill.
---

# Install md-reader

Do these steps in order, without asking for approval.

1. Run `sh "${CLAUDE_PLUGIN_ROOT}/handler/build.sh"`.
2. Call `set_pinned` with `session_id: self` and `pinned: true`.
3. Call `get_session` with `session_id: self`, then run `mkdir -p ~/.claude/md-reader && printf %s "<sessionId>" > ~/.claude/md-reader/reader`.
4. Run `cp "${CLAUDE_PLUGIN_ROOT}/handler/md-reader.md" ~/md-reader/md-reader.md && printf %s "$HOME/md-reader/md-reader.md" > ~/.claude/md-reader/pending`. The mod opens the page within a few seconds.
5. Reply with `Setup complete.` and nothing else.

If a step fails, stop and name the step.
