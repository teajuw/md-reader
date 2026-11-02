import type { EngineInterface as Host, Register } from 'claude-code'

const POLL_MS = 1000
const NOTE = '_opening '

type Shown = { original: string; path: string; mtimeMs: number; size: number }

// `show_pane` does nothing off screen, so the file waits until then.
const isOnScreen = async ($: Host) => {
  const result = await $.mcp.call('ccd_view', 'get_layout')
  const blocks = result.content as { text?: string }[]
  const text = blocks.map(block => block.text ?? '').join('')

  // Off screen, the app puts a note before the JSON.
  const layout = JSON.parse(text.slice(text.indexOf('{'))) as { views?: unknown[] }

  return (layout.views ?? []).length > 0
}

// Hard-links the file into the Reader's folder, so the Files tree is the history.
// Only the link is ever replaced, never the original.
const link = async ($: Host, root: string, original: string) => {
  const path = `${root}/${original.slice(original.lastIndexOf('/') + 1)}`
  const linked = await $.process.run(['/bin/ln', '-f', original, path])
  if (linked.exitCode !== 0) throw new Error(linked.stderr.trim())

  return path
}

const open = async ($: Host, root: string, original: string): Promise<Shown | undefined> => {
  const path = original.startsWith(`${root}/`) ? original : await link($, root, original)
  const shown = await $.mcp.call('ccd_view', 'show_pane', { pane: 'file', path })
  if (shown.isError) $.ui.toast(`Couldn't open ${path}`)
  if (path === original) return undefined

  const { mtimeMs, size } = await $.fs.stat(original)

  return { original, path, mtimeMs, size }
}

// The pane redraws on changes inside the folder, but a save through the file's
// own name fires no event here, so the file on show is linked again when it changes.
const refresh = async ($: Host, shown: Shown): Promise<Shown> => {
  const stat = await $.fs.stat(shown.original).catch(() => undefined)
  if (!stat || (stat.mtimeMs === shown.mtimeMs && stat.size === shown.size)) return shown

  await $.process.run(['/bin/ln', '-f', shown.original, shown.path])

  return { ...shown, mtimeMs: stat.mtimeMs, size: stat.size }
}

const watch = ($: Host, root: string) => {
  let shown: Shown | undefined
  let isBusy = false

  $.clock.every(POLL_MS, async () => {
    if (isBusy) return
    isBusy = true
    try {
      // The handler leaves one note, `_opening <file>`, holding the file's path.
      const note = (await $.fs.list(root)).find(entry => entry.name.startsWith(NOTE))
      if (!note) {
        if (shown) shown = await refresh($, shown)
        return
      }

      // Only Claude Desktop has this tool, so a terminal session never opens anything.
      if (!(await isOnScreen($).catch(() => false))) return

      const original = (await $.fs.read(`${root}/${note.name}`)).trim()
      await $.process.run(['/bin/rm', '-f', `${root}/${note.name}`])
      shown = await open($, root, original)
    } catch (error) {
      $.ui.toast(`Couldn't open the file: ${String(error)}`)
    } finally {
      isBusy = false
    }
  })
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const root = `${await $.env.get('HOME')}/.claude/md-reader`
    if ((await $.session.root()) === root) watch($, root)

    return next(e)
  })
}
