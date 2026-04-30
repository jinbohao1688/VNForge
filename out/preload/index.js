"use strict";
const electron = require("electron");
const preload = require("@electron-toolkit/preload");
const api = {
  invoke: (channel, ...args) => {
    return electron.ipcRenderer.invoke(channel, ...args);
  },
  on: (channel, callback) => {
    const listener = (_event, ...args) => callback(...args);
    electron.ipcRenderer.on(channel, listener);
    return () => electron.ipcRenderer.removeListener(channel, listener);
  },
  off: (channel, callback) => {
    electron.ipcRenderer.removeListener(channel, callback);
  }
};
if (process.contextIsolated) {
  try {
    electron.contextBridge.exposeInMainWorld("electron", preload.electronAPI);
    electron.contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = preload.electronAPI;
  window.api = api;
}
