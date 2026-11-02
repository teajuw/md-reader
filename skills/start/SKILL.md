---
name: start
description: Start the md-reader session. Use when the user runs /md-reader:start or asks to set up the Finder Markdown viewer.
disable-model-invocation: true
---

# Start md-reader

Before doing anything else, call `mcp__ccd_turn__wrap_up` and end your turn. Do nothing more until the user replies.

- `recap`: `md-reader needs its own session in your home folder.`
- `ask`: `Open md-reader in split view?`
- `actions`: `[{"label": "Manual"}, {"label": "Auto"}]`
- `blocked`: `true`

Your closing message is one line: `Manual asks before each step. Auto runs them automatically.`

If that tool isn't available, ask the same question with `AskUserQuestion`, with the same two options.

When the user replies `Manual` or `Auto`, continue. If they reply with anything else, stop and do nothing.

1. Call `start_session` with:
   - `initiation`: `user_asked`
   - `context`: `fresh`
   - `title` and `name`: `md-reader`
   - `cwd`: `~`
   - `use_worktree`: `false`
   - `model`: `claude-haiku-5-5`
   - `effort`: `low`
   - `permission_mode`: `default` for Manual, `auto` for Auto
   - `prompt`, exactly:

     ```markdown
     Set up md-reader with the md-reader:install skill:

     1. Build the `md-reader` app ([build.sh](https://github.com/teajuw/md-reader/blob/main/handler/build.sh))
     2. Pin this session
     3. Open the setup page
     ```

   - `background`: `This session is the md-reader viewer. It finishes setup, then stays idle and shows Markdown files in the Files pane.`

   If `auto` is refused, call it again with `default` and tell the user that setup will ask before each step.
2. Call `open_session_in` for the new session with `target: split`.
3. Call `detach_session` for the new session, so it isn't archived with this one.
4. Say exactly `md-reader is finishing setup in the split.` and nothing else.

If another step is refused, stop and tell the user which one. The README has the manual steps.
