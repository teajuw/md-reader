---
name: start
description: Start the md-reader session. Use when the user runs /md-reader:start or asks to set up the Finder Markdown viewer.
disable-model-invocation: true
---

# Start md-reader

First run `[ -d ~/Applications/md-reader.app ] && cat ~/.claude/md-reader/_session 2>/dev/null`. If it prints nothing, run `rm -f ~/.claude/md-reader/_session` and continue. If it prints an ID, call `get_session` for it. If that session exists and isn't archived, run `open "claude://code/continue?session=<id>"`, say `md-reader is already set up.`, and stop.

Next, call `mcp__ccd_turn__wrap_up` and end your turn. Do nothing more until the user replies.

- `recap`: `md-reader needs its own session in ~/.claude/md-reader.`
- `ask`: `Set up md-reader?`
- `actions`: `[{"label": "Manual"}, {"label": "Auto"}]`
- `blocked`: `true`

Your closing message is one line: `Manual asks before each step. Auto runs them automatically.`

If that tool isn't available, ask the same question with `AskUserQuestion`, with the same two options.

When the user replies `Manual` or `Auto`, continue. If they reply with anything else, stop and do nothing.

1. Run `mkdir -p ~/.claude/md-reader`, then call `start_session` with:
   - `initiation`: `user_asked`
   - `title` and `name`: `md-reader`
   - `cwd`: `~/.claude/md-reader`
   - `use_worktree`: `false`
   - `model`: `claude-haiku-5-5`
   - `effort`: `low`
   - `permission_mode`: `default` for Manual, `auto` for Auto
   - `prompt`, exactly:

     ```markdown
     Set up md-reader with the md-reader:install skill:

     1. Build the `md-reader` app ([build.sh](https://github.com/teajuw/md-reader/blob/main/handler/build.sh))
     2. Pin this session
     3. Say what's left
     ```

   - `background`: `This session is the md-reader viewer. It finishes setup, then stays idle and shows Markdown files in the Files pane.`

   If `auto` is refused, call it again with `default` and tell the user that setup will ask before each step.
2. Call `detach_session` for the new session, so it isn't archived with this one.
3. Run `open "claude://code/continue?session=<id>"` to switch to it.
4. Say exactly `md-reader is finishing setup.` and nothing else.

If another step is refused, stop and tell the user which one. The README has the manual steps.
