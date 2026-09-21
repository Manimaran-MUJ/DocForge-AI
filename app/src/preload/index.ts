import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  openMarkdownFile: () => ipcRenderer.invoke('dialog:openMarkdownFile'),

  readMarkdownFile: (filePath: string) => ipcRenderer.invoke('file:readMarkdown', filePath)
})
