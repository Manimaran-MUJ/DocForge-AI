export {}

declare global {
  interface Window {
    electronAPI: {
      openMarkdownFile(): Promise<string | null>

      readMarkdownFile(filePath: string): Promise<string | null>
    }
  }
}
