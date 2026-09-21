import { Document, HeadingLevel, Packer, Paragraph } from 'docx'

class DocxService {
  async generateDocx(markdownContent: string): Promise<Uint8Array | null> {
    try {
      const lines = markdownContent.split(/\r?\n/)

      const paragraphs = lines.map((line) => {
        const trimmedLine = line.trim()

        if (trimmedLine.startsWith('# ')) {
          return new Paragraph({
            text: trimmedLine.substring(2),
            heading: HeadingLevel.HEADING_1
          })
        }

        if (trimmedLine.startsWith('## ')) {
          return new Paragraph({
            text: trimmedLine.substring(3),
            heading: HeadingLevel.HEADING_2
          })
        }

        if (trimmedLine.startsWith('### ')) {
          return new Paragraph({
            text: trimmedLine.substring(4),
            heading: HeadingLevel.HEADING_3
          })
        }

        return new Paragraph({
          text: trimmedLine
        })
      })

      const document = new Document({
        sections: [
          {
            children: paragraphs
          }
        ]
      })

      const blob = await Packer.toBlob(document)
      const arrayBuffer = await blob.arrayBuffer()
      const data = new Uint8Array(arrayBuffer)

      console.log('DOCX generated successfully')
      console.log('DOCX size:', data.length)

      return data
    } catch (error) {
      console.error('Unable to generate DOCX:', error)
      return null
    }
  }

  async saveDocx(filePath: string, markdownContent: string): Promise<boolean> {
    const data = await this.generateDocx(markdownContent)

    if (!data) {
      return false
    }

    return await window.electronAPI.writeDocxFile(filePath, data)
  }
}

export default new DocxService()