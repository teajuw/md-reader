---
name: install
description: Install the md-reader app from inside the md-reader session. Use when the user runs /md-reader:install or a session's prompt names this skill.
---

# Install md-reader

Do these steps in order, without asking for approval.

1. Run `sh "${CLAUDE_PLUGIN_ROOT}/handler/build.sh"`.
2. Call `set_pinned` with `session_id: self` and `pinned: true`.
3. Call `get_session` with `session_id: self`, then run `printf %s "<sessionId>" > ~/.claude/md-reader/_session`.
4. Reply with exactly this and nothing else:

   ```markdown
   Setup complete. One step left: in Finder, choose Get Info on a `.md` file, set Open With to `md-reader`, and click Change All.

   Then double-click any Markdown file and it opens here. Every file you open is linked into this folder, so the tree is your history.
   ```

If a step fails, stop and name the step.
