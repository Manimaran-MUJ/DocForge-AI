export {}

declare global {
  interface Window {
    electronAPI: {
      openMarkdownFile(): Promise<string | null>
      readMarkdownFile(filePath: string): Promise<string | null>
      saveDocxFile(): Promise<string | null>
      writeDocxFile(filePath: string, data: Uint8Array): Promise<boolean>
      readImage(
        imageUrl: string
      ): Promise<{ data: Uint8Array; contentType: string; width: number; height: number } | null>
    }
  }
}
