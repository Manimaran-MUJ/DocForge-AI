class MarkdownService {
  async openMarkdownFile(): Promise<string | null> {
    return await window.electronAPI.openMarkdownFile()
  }

  async readMarkdownFile(filePath: string): Promise<string | null> {
    return await window.electronAPI.readMarkdownFile(filePath)
  }
}

export default new MarkdownService()
