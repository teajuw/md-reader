import type { EngineInterface as Host, Register } from 'claude-code'

const POLL_MS = 1000
const TRACK_MS = 5000

type Link = { original: string; name: string }

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

const readLinks = async ($: Host, file: string): Promise<Link[]> => {
  if (!(await $.fs.exists(file))) return []

  return (await $.fs.read(file))
    .split('\n')
    .filter(Boolean)
    .map(line => {
      const [original = '', name = ''] = line.split('\t')

      return { original, name }
    })
}

const writeLinks = ($: Host, file: string, links: Link[]) =>
  $.fs.write(file, links.map(link => `${link.original}\t${link.name}\n`).join(''))

// Hard-links the file into the Reader's folder, so the Files tree is the history.
const link = async ($: Host, root: string, file: string, original: string) => {
  const links = await readLinks($, file)
  const known = links.find(entry => entry.original === original)
  const base = original.slice(original.lastIndexOf('/') + 1)
  const parent = original.split('/').at(-2) ?? ''
  const dot = base.lastIndexOf('.') < 0 ? base.length : base.lastIndexOf('.')
  const isTaken = links.some(entry => entry.name === base)
  const name = known?.name ?? (isTaken ? `${base.slice(0, dot)} (${parent})${base.slice(dot)}` : base)
  const path = `${root}/${name}`

  const linked = await $.process.run(['/bin/ln', '-f', original, path])
  if (linked.exitCode !== 0) {
    // Another disk: a copy is the best history can do.
    await $.process.run(['/bin/cp', original, path])
  } else if (!known) {
    await writeLinks($, file, [...links, { original, name }])
  }

  return path
}

// Editors save by writing a new file and renaming it, which leaves the link on
// the old copy, so an entry is re-linked once its stats drift from the original.
const track = async ($: Host, root: string, file: string) => {
  for (const { original, name } of await readLinks($, file)) {
    const path = `${root}/${name}`
    const stats = await Promise.all([$.fs.stat(original), $.fs.stat(path)]).catch(() => undefined)
    if (!stats) continue

    const [source, copy] = stats
    if (source.mtimeMs === copy.mtimeMs && source.size === copy.size) continue

    await $.process.run(['/bin/ln', '-f', original, path])
  }
}

const watch = ($: Host, root: string, state: string) => {
  const pending = `${state}/pending`
  const links = `${state}/links`
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
      const path = original.startsWith(`${root}/`) ? original : await link($, root, links, original)
      const shown = await $.mcp.call('ccd_view', 'show_pane', { pane: 'file', path })
      if (shown.isError) $.ui.toast(`Couldn't open ${path}`)
    } catch (error) {
      $.ui.toast(`Couldn't open the file: ${String(error)}`)
    } finally {
      isBusy = false
    }
  })

  $.clock.every(TRACK_MS, () => track($, root, links).catch(() => undefined))
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const home = await $.env.get('HOME')
    if ((await $.session.root()) === `${home}/md-reader`) {
      watch($, `${home}/md-reader`, `${home}/.claude/md-reader`)
    }

    return next(e)
  })
}
