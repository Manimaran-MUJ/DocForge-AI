export {}

declare global {
  interface Window {
    electronAPI: {
      openMarkdownFile(): Promise<string | null>
      readMarkdownFile(filePath: string): Promise<string | null>
      saveDocxFile(): Promise<string | null>
      writeDocxFile(filePath: string, data: Uint8Array): Promise<boolean>
    }
  }
}
