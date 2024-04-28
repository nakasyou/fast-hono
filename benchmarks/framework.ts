import type { Server } from 'bun'
declare var self: Worker

type Cleanup = () => Promise<void> | void
type Serve = () => Promise<Cleanup> | Cleanup

export const defineFramework = (listen: () => Promise<Serve>) => {
  let cleanup: Cleanup
  self.onmessage = async (evt) => {
    if (evt.data === 'start') {
      const serve = await listen()
      self.postMessage('inited')
      cleanup = await serve()
      self.postMessage('started')
    } else if (evt.data === 'stop') {
      await cleanup()
      self.postMessage('stopped')
    }
  }
}
