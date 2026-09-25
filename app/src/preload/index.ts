import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  openMarkdownFile: () => ipcRenderer.invoke('dialog:openMarkdownFile'),
  readMarkdownFile: (filePath: string) => ipcRenderer.invoke('file:readMarkdown', filePath),
  readImage: (imageUrl: string) => ipcRenderer.invoke('file:readImage', imageUrl),
  saveDocxToDownloads: (fileName: string, data: Uint8Array) =>
    ipcRenderer.invoke('file:saveDocxToDownloads', fileName, data)
})
