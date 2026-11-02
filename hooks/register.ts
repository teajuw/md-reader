import type { EngineInterface as Host, Register } from 'claude-code'

const POLL_MS = 1000

const toolText = (result: { content: unknown }) =>
  (result.content as { text?: string }[]).map(block => block.text ?? '').join('')

const homeFolder = async ($: Host) => {
  const { stdout } = await $.process.run(['/usr/bin/printenv', 'HOME'])

  return stdout.trim()
}

// Saves this session's app id, so the handler can bring the Reader forward.
const saveReaderId = async ($: Host, folder: string) => {
  const result = await $.mcp.call('ccd_window', 'get_window_layout')
  const layout = JSON.parse(toolText(result)) as { this_session?: { session_id?: string } }
  const id = layout.this_session?.session_id
  if (id) await $.fs.write(`${folder}/reader`, id)

  return id !== undefined
}

// `show_pane` does nothing off screen, so the file waits until then.
const isOnScreen = async ($: Host) => {
  const result = await $.mcp.call('ccd_view', 'get_layout')
  const layout = JSON.parse(toolText(result)) as { views?: unknown[] }

  return (layout.views ?? []).length > 0
}

const resolvePath = (path: string, home: string, cwd: string) => {
  if (path.startsWith('~/')) return `${home}${path.slice(1)}`

  return path.startsWith('/') ? path : `${cwd}/${path}`
}

const watch = ($: Host, folder: string) => {
  const pending = `${folder}/pending`
  let isBusy = false
  let isSaved = false

  $.clock.every(POLL_MS, async () => {
    if (isBusy) return
    isBusy = true
    try {
      isSaved ||= await saveReaderId($, folder)
      if (!(await $.fs.exists(pending)) || !(await isOnScreen($))) return

      const path = (await $.fs.read(pending)).trim()
      await $.process.run(['/bin/rm', '-f', pending])
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
    await $.command.register({
      name: 'read',
      description: 'Open your md-reader session, or a file in it',
    })
    const home = await homeFolder($)
    if ((await $.session.root()) === home) watch($, `${home}/.claude/md-reader`)

    return next(e)
  })

  on('command.run', { command: 'read' }, async ($, e) => {
    const home = await homeFolder($)
    const folder = `${home}/.claude/md-reader`
    if (!(await $.fs.exists(`${folder}/reader`))) {
      return { text: 'No md-reader session found. Run /md-reader:start.' }
    }

    const arg = e.args.trim()
    if (arg !== '') {
      const path = resolvePath(arg, home, await $.session.cwd())
      if (!(await $.fs.exists(path))) return { text: `File not found: ${path}` }
      await $.fs.write(`${folder}/pending`, path)
    }
    const id = (await $.fs.read(`${folder}/reader`)).trim()
    await $.process.run(['/usr/bin/open', `claude://code/continue?session=${id}`])

    return { text: 'Opened md-reader.' }
  })
}
