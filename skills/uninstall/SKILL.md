---
name: uninstall
description: Remove md-reader's app, session and saved state. Use when the user runs /md-reader:uninstall.
disable-model-invocation: true
---

# Uninstall md-reader

Show the user these steps:

1. Unpin and archive the `md-reader` session. You can restore it from Archived.
2. Delete `~/Applications/md-reader.app`.
3. Delete `~/.claude/md-reader/`, which holds only md-reader's saved state and setup page.

Your Markdown files aren't touched.

Then call `mcp__ccd_turn__wrap_up` and end your turn. Do nothing more until the user replies.

- `recap`: `Uninstall will remove the md-reader session, app and saved state.`
- `ask`: `Uninstall md-reader?`
- `actions`: `[{"label": "Uninstall"}, {"label": "Cancel"}]`
- `blocked`: `true`

If that tool isn't available, ask the same question with `AskUserQuestion`, with the same two options.

If the user replies with anything other than `Uninstall`, stop and do nothing.

If they choose `Uninstall`:

1. Run `cat ~/.claude/md-reader/reader` to get the session ID. If there isn't one, skip step 2.
2. Call `set_pinned` for that session with `pinned: false`, then call `archive_session` for it. If `archive_session` is refused, keep going and tell the user to close the `md-reader` pane and archive it from the sidebar.
3. Run `rm -rf "$HOME/Applications/md-reader.app" "$HOME/.claude/md-reader"`.
4. Tell the user to finish with these steps:
   - In Finder, choose Get Info on a `.md` file, pick another app under Open With, and click Change All.
   - Run `/plugin uninstall md-reader@md-reader`.

If step 3 fails, stop and tell the user.
