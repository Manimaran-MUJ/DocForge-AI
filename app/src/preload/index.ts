import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  openMarkdownFile: () => ipcRenderer.invoke('dialog:openMarkdownFile'),
  readMarkdownFile: (filePath: string) => ipcRenderer.invoke('file:readMarkdown', filePath),
  saveDocxFile: () => ipcRenderer.invoke('dialog:saveDocxFile'),
  writeDocxFile: (filePath: string, data: Uint8Array) =>
    ipcRenderer.invoke('file:writeDocx', filePath, data),
  readImage: (imageUrl: string) => ipcRenderer.invoke('file:readImage', imageUrl)
})
