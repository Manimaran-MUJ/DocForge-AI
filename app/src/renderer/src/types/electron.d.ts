export {}

declare global {
  interface Window {
    electronAPI: {
      openMarkdownFile(): Promise<string | null>
      readMarkdownFile(filePath: string): Promise<string | null>
      saveDocxToDownloads(fileName: string, data: Uint8Array): Promise<string | null>
      readImage(
        imageUrl: string,
        markdownFilePath: string
      ): Promise<{ data: Uint8Array; contentType: string; width: number; height: number } | null>
    }
  }
}
