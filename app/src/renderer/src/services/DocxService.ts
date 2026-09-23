import {
  AlignmentType,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun
} from 'docx'

import type {
  ListItem,
  PhrasingContent,
  Table as MarkdownTable,
  TableCell as MarkdownTableCell,
  TableRow as MarkdownTableRow
} from 'mdast'

import MarkdownParserService from './MarkdownParserService'

type PlainTextNode = {
  type: string
  value?: string
  children?: PlainTextNode[]
}

type RenderedInlineNode = TextRun | ExternalHyperlink | ImageRun

class DocxService {
  async generateDocx(markdownContent: string): Promise<Uint8Array | null> {
    try {
      const tree = MarkdownParserService.parse(markdownContent)

      const children: Array<Paragraph | Table> = []

      for (const node of tree.children) {
        switch (node.type) {
          case 'heading': {
            const headingLevel =
              node.depth === 1
                ? HeadingLevel.HEADING_1
                : node.depth === 2
                  ? HeadingLevel.HEADING_2
                  : HeadingLevel.HEADING_3

            children.push(
              new Paragraph({
                heading: headingLevel,
                children: await this.renderInlineNodes(node.children)
              })
            )

            break
          }

          case 'paragraph': {
            children.push(
              new Paragraph({
                children: await this.renderInlineNodes(node.children)
              })
            )

            break
          }

          case 'list': {
            for (const item of node.children) {
              const listItemChildren = await this.renderListItem(item)

              if (item.checked !== null && item.checked !== undefined) {
                listItemChildren.unshift(
                  new TextRun({
                    text: item.checked ? '☑ ' : '☐ '
                  })
                )
              }

              children.push(
                new Paragraph({
                  children: listItemChildren,
                  ...(node.ordered
                    ? {
                        numbering: {
                          reference: 'default-numbering',
                          level: 0
                        },
                        indent: {
                          left: 720,
                          hanging: 360
                        }
                      }
                    : {
                        bullet: {
                          level: 0
                        }
                      })
                })
              )
            }

            break
          }

          case 'table': {
            children.push(await this.renderTable(node))
            break
          }

          case 'code': {
            children.push(
              new Paragraph({
                children: this.renderCodeBlock(node.value)
              })
            )

            break
          }
        }
      }

      const document = new Document({
        numbering: {
          config: [
            {
              reference: 'default-numbering',
              levels: [
                {
                  level: 0,
                  format: 'decimal',
                  text: '%1.',
                  alignment: 'left'
                }
              ]
            }
          ]
        },
        sections: [
          {
            children
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

      const message = error instanceof Error ? error.message : String(error)

      alert(`DOCX generation failed:\n${message}`)

      return null
    }
  }

  private async renderTable(node: MarkdownTable): Promise<Table> {
    const rows: MarkdownTableRow[] = node.children ?? []

    const columnCount = Math.max(...rows.map((row) => row.children?.length ?? 0), 1)

    // Word page content width with normal margins.
    // 9360 twips ≈ 6.5 inches.
    const totalWidth = 9360

    const columnWidth = Math.floor(totalWidth / columnCount)

    const columnWidths = Array(columnCount).fill(columnWidth)

    const tableRows = await Promise.all(
      rows.map(async (row: MarkdownTableRow, rowIndex: number) => {
        const cells: MarkdownTableCell[] = row.children ?? []

        const tableCells = await Promise.all(
          Array.from({ length: columnCount }, async (_, columnIndex) => {
            const cell = cells[columnIndex]

            const alignment = this.getTableAlignment(node.align?.[columnIndex])

            return new TableCell({
              width: {
                size: columnWidths[columnIndex],
                type: 'dxa'
              },
              children: [
                new Paragraph({
                  alignment,
                  children: cell
                    ? await this.renderTableCellContent(cell.children ?? [], rowIndex === 0)
                    : []
                })
              ]
            })
          })
        )

        return new TableRow({
          children: tableCells
        })
      })
    )

    return new Table({
      rows: tableRows,
      width: {
        size: totalWidth,
        type: 'dxa'
      },
      columnWidths,
      layout: TableLayoutType.FIXED
    })
  }

  private getTableAlignment(alignment: string | null | undefined) {
    switch (alignment) {
      case 'center':
        return AlignmentType.CENTER

      case 'right':
        return AlignmentType.RIGHT

      case 'left':
      default:
        return AlignmentType.LEFT
    }
  }

  private async renderTableCellContent(
    nodes: PhrasingContent[],
    isHeader: boolean
  ): Promise<RenderedInlineNode[]> {
    if (isHeader) {
      return [
        new TextRun({
          text: this.getPlainText({
            type: 'root',
            children: nodes
          }),
          bold: true
        })
      ]
    }

    return await this.renderInlineNodes(nodes)
  }

  private renderCodeBlock(code: string): TextRun[] {
    const lines = code.split(/\r?\n/)

    const runs: TextRun[] = []

    lines.forEach((line, index) => {
      runs.push(
        new TextRun({
          text: line,
          font: 'Consolas'
        })
      )

      if (index < lines.length - 1) {
        runs.push(
          new TextRun({
            break: 1
          })
        )
      }
    })

    return runs
  }

  private async renderInlineNodes(
    nodes: PhrasingContent[],
    formatting: {
      bold?: boolean
      italics?: boolean
      strike?: boolean
    } = {}
  ): Promise<RenderedInlineNode[]> {
    const children: RenderedInlineNode[] = []

    for (const node of nodes) {
      switch (node.type) {
        case 'text':
          children.push(
            new TextRun({
              text: node.value,
              bold: formatting.bold,
              italics: formatting.italics,
              strike: formatting.strike
            })
          )
          break

        case 'strong':
          children.push(
            ...(await this.renderInlineNodes(node.children, {
              ...formatting,
              bold: true
            }))
          )
          break

        case 'emphasis':
          children.push(
            ...(await this.renderInlineNodes(node.children, {
              ...formatting,
              italics: true
            }))
          )
          break

        case 'delete':
          children.push(
            ...(await this.renderInlineNodes(node.children, {
              ...formatting,
              strike: true
            }))
          )
          break

        case 'inlineCode':
          children.push(
            new TextRun({
              text: node.value,
              font: 'Consolas',
              bold: formatting.bold,
              italics: formatting.italics,
              strike: formatting.strike
            })
          )
          break

        case 'link': {
          const linkChildren = (
            await this.renderInlineNodes(node.children, {
              ...formatting
            })
          ).filter((child): child is TextRun => child instanceof TextRun)

          children.push(
            new ExternalHyperlink({
              link: node.url,
              children: linkChildren
            })
          )

          break
        }

        case 'image': {
          const image = await window.electronAPI.readImage(node.url)

          if (!image) {
            children.push(
              new TextRun({
                text: node.alt ? `[Image: ${node.alt}]` : '[Image]',
                italics: true
              })
            )

            break
          }

          const maxWidth = 600
          const scale = Math.min(1, maxWidth / image.width)

          const width = Math.round(image.width * scale)
          const height = Math.round(image.height * scale)

          const imageType =
            image.contentType === 'image/png'
              ? 'png'
              : image.contentType === 'image/jpeg'
                ? 'jpg'
                : image.contentType === 'image/gif'
                  ? 'gif'
                  : image.contentType === 'image/bmp'
                    ? 'bmp'
                    : null

          if (!imageType) {
            children.push(
              new TextRun({
                text: node.alt ? `[Unsupported image: ${node.alt}]` : '[Unsupported image]',
                italics: true
              })
            )

            break
          }

          children.push(
            new ImageRun({
              type: imageType,
              data: image.data,
              transformation: {
                width,
                height
              }
            })
          )
          break
        }

        case 'break':
          children.push(
            new TextRun({
              break: 1
            })
          )
          break
      }
    }

    return children
  }

  private async renderListItem(item: ListItem): Promise<RenderedInlineNode[]> {
    const children: RenderedInlineNode[] = []

    for (const child of item.children) {
      if (child.type === 'paragraph') {
        children.push(...(await this.renderInlineNodes(child.children)))
      }
    }

    return children
  }

  private getPlainText(node: PlainTextNode): string {
    if (node.type === 'text' || node.type === 'inlineCode') {
      return node.value ?? ''
    }

    if (!node.children) {
      return ''
    }

    return node.children.map((child) => this.getPlainText(child)).join('')
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
