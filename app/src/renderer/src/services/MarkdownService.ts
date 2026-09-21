class MarkdownService {
  async openMarkdownFile(): Promise<string | null> {
    return await window.electronAPI.openMarkdownFile()
  }

  async readMarkdownFile(filePath: string): Promise<string | null> {
    console.log('Calling readMarkdownFile:', filePath)

    const content = await window.electronAPI.readMarkdownFile(filePath)

    console.log('Received markdown content:', content)

    return content
  }
}

export default new MarkdownService()
