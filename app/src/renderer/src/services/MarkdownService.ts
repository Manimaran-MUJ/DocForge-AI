class MarkdownService {
  async openMarkdownFile(): Promise<string | null> {
    return await window.electronAPI.openMarkdownFile()
  }

  async readMarkdownFile(filePath: string): Promise<string | null> {
    return await window.electronAPI.readMarkdownFile(filePath)
  }

  async saveDocxFile(): Promise<string | null> {
    return await window.electronAPI.saveDocxFile()
  }
}

export default new MarkdownService()
