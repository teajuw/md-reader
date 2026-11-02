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
    const home = await homeFolder($)
    if ((await $.session.root()) === home) watch($, `${home}/.claude/md-reader`)

    return next(e)
  })
}
