import type { EngineInterface as Host, Register } from 'claude-code'

const POLL_MS = 1000

const layoutOf = async <T>($: Host, server: string, tool: string) => {
  const result = await $.mcp.call(server, tool)
  const blocks = result.content as { text?: string }[]
  const text = blocks.map(block => block.text ?? '').join('')

  // Off screen, the app puts a note before the JSON.
  return JSON.parse(text.slice(text.indexOf('{'))) as T
}

// `show_pane` does nothing off screen, so the file waits until then.
const isOnScreen = async ($: Host) => {
  const layout = await layoutOf<{ views?: unknown[] }>($, 'ccd_view', 'get_layout')

  return (layout.views ?? []).length > 0
}

// Hard-links the file into the Reader's folder, so the Files tree is the history.
// Only the link is ever replaced, never the original. Reopening a file links it
// again, which also catches an editor that saved a new copy under the old name.
const link = async ($: Host, root: string, original: string) => {
  const path = `${root}/${original.slice(original.lastIndexOf('/') + 1)}`
  const linked = await $.process.run(['/bin/ln', '-f', original, path])
  if (linked.exitCode !== 0) throw new Error(linked.stderr.trim())

  return path
}

const watch = ($: Host, root: string, pending: string) => {
  let isBusy = false

  $.clock.every(POLL_MS, async () => {
    if (isBusy) return
    isBusy = true
    try {
      if (!(await $.fs.exists(pending))) return

      // Only Claude Desktop has this tool, so a terminal session never opens anything.
      if (!(await isOnScreen($).catch(() => false))) return

      const original = (await $.fs.read(pending)).trim()
      await $.process.run(['/bin/rm', '-f', pending])
      const path = original.startsWith(`${root}/`) ? original : await link($, root, original)
      const shown = await $.mcp.call('ccd_view', 'show_pane', { pane: 'file', path })
      if (shown.isError) $.ui.toast(`Couldn't open ${path}`)
    } catch (error) {
      $.ui.toast(`Couldn't open the file: ${String(error)}`)
    } finally {
      isBusy = false
    }
  })
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const home = await $.env.get('HOME')
    if ((await $.session.root()) === `${home}/md-reader`) {
      watch($, `${home}/md-reader`, `${home}/.claude/md-reader/pending`)
    }

    return next(e)
  })
}
