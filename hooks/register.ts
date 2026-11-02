import type { EngineInterface as Host, Register } from 'claude-code'

const POLL_MS = 1000

const layoutOf = async <T>($: Host, server: string, tool: string) => {
  const result = await $.mcp.call(server, tool)
  const blocks = result.content as { text?: string }[]

  return JSON.parse(blocks.map(block => block.text ?? '').join('')) as T
}

const sessionId = async ($: Host) => {
  const layout = await layoutOf<{ this_session?: { session_id?: string } }>(
    $,
    'ccd_window',
    'get_window_layout',
  )

  return layout.this_session?.session_id
}

// `show_pane` does nothing off screen, so the file waits until then.
const isOnScreen = async ($: Host) => {
  const layout = await layoutOf<{ views?: unknown[] }>($, 'ccd_view', 'get_layout')

  return (layout.views ?? []).length > 0
}

const watch = ($: Host, folder: string) => {
  const reader = `${folder}/reader`
  const pending = `${folder}/pending`
  let id: string | undefined
  let isBusy = false

  const timer = $.clock.every(POLL_MS, async () => {
    if (isBusy) return
    isBusy = true
    try {
      // Only Claude Desktop has this tool, so a terminal session stops here.
      id ??= await sessionId($).catch(() => {
        timer.cancel()
        return undefined
      })
      if (!id) return

      if (!(await $.fs.exists(reader)) || (await $.fs.read(reader)).trim() !== id) return
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
    const home = await $.env.get('HOME')
    if ((await $.session.root()) === home) watch($, `${home}/.claude/md-reader`)

    return next(e)
  })
}
