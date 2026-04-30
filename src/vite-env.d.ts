/// <reference types="vite/client" />

interface Window {
  electron: {
    ipcRenderer: {
      invoke: (channel: string, ...args: any[]) => Promise<any>
      on: (channel: string, callback: (...args: any[]) => void) => () => void
      removeListener: (channel: string, callback: (...args: any[]) => void) => void
    }
  }
  api: {
    invoke: (channel: string, ...args: any[]) => Promise<any>
    on: (channel: string, callback: (...args: any[]) => void) => () => void
    off: (channel: string, callback: (...args: any[]) => void) => void
  }
}
