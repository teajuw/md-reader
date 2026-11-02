# md-reader

Double-click a Markdown file. Read it in Claude Desktop. No tokens.

If Claude Desktop is where you work, why open a separate app to read Markdown? md-reader is a preview of what a native Markdown viewer could look like, with as little clunk as I could get it down to.

## Install

```text
/plugin install md-reader --marketplace teajuw/md-reader
```

Then run this in a Code session:

```text
/md-reader:start
```

Choose **Manual** or **Auto**, and follow the page it opens.

## Use it

Double-click any Markdown file.

The file opens in the `md-reader` session. If that session is in split view, it opens beside your work and nothing gets interrupted; otherwise it takes over the main pane. To get the split, right-click the session in the sidebar and choose Open in → Split view.

Opening files never uses tokens. It's plain code, with no model involved. Setup uses one short Haiku turn.

## History

Every file you open is hard-linked into `~/md-reader`, the session's folder, so the Files tree lists everything you've read, and clicking an entry opens it again. A hard link is the same file under a second name, so edits show up in both. Some editors save by writing a new file, which leaves the entry on the old one; opening the file again fixes that. Two files with the same name share one entry, the last one opened. Only entries are ever replaced, never your files. A file on another disk can't be linked, so it won't open.

## Good to know

- It renders with Claude Desktop's own Files pane, by design. There's no viewer here to maintain, so app improvements come for free.
- Setup compiles a small AppleScript app, `md-reader.app`, into `~/Applications`. You set it as your `.md` default, and all it does is hand the file's path to Claude Desktop. The source is in `handler/`.
- It uses its own session in `~/md-reader`. Close it whenever you like, and opening a file brings it back.
- If opening a file does nothing, run `/md-reader:start` to repair it.
- If Claude Desktop is closed, the first file can take a while to appear, because the app and session have to start.
- macOS only.
- It relies on app behavior that isn't a public API, so an update could break it.

To remove it, run `/md-reader:uninstall`.
