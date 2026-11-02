# md-reader

Double-click a Markdown file. Read it in Claude Desktop. No tokens.

## How it works

Finder hands the file to a tiny app. The app notes the file's path and brings up the `md-reader` session, a session that does nothing but show files. That session links the file into its own folder and opens it in the Files pane. No model is involved, so opening a file costs nothing and takes about a second.

Every file you open stays in that folder as a link, so the session's file tree is your reading history. A link is the same file under a second name, not a copy: nothing is ever written to your files. If the file you're reading changes on disk, the page updates within a second.

The session can see only its own folder. The one way a file gets in is you opening it. The session is for reading, so keep in mind that anything you say in it can see the files you've opened.

## Use it

- Double-click a `.md` file in Finder.
- Leave a file open while an agent edits it. The page follows the changes.
- Click any file in the session's tree to read it again.

## Install

```text
/plugin install md-reader --marketplace teajuw/md-reader
```

Then, in any Code session:

```text
/md-reader:start
```

Choose **Auto** (or **Manual** to approve each step). Setup is one short Haiku turn, and it ends by telling you how to make `md-reader` the default for `.md` files.

## Remove

```text
/md-reader:uninstall
```

## Good to know

- Setup compiles a small AppleScript app, `md-reader.app`, into `~/Applications`, signs it ad hoc with `codesign`, and registers it with Launch Services so Finder lists it under Open With. Its only job is handing paths to Claude Desktop; the source is in `handler/`.
- Everything md-reader writes lives in `~/Applications/md-reader.app` and `~/.claude/md-reader`. Nothing is sent anywhere: no network, no telemetry.
- If the `md-reader` session is in split view, files open beside your work. Otherwise they take over the main pane. Right-click the session in the sidebar → Open in → Split view to set up the split once.
- If Claude Desktop is closed, the first file takes a while, because the app has to start.
- If a file doesn't open, run `/md-reader:start`. If nothing happens at all, check that `md-reader` is still the Finder default for `.md` files.
- Problems or questions: [GitHub Issues](https://github.com/teajuw/md-reader/issues).
- macOS only, and it relies on app behavior that isn't a public API, so an update could break it.
