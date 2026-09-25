import mermaid from 'mermaid'
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

mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'strict',
  theme: 'default'
})

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
            if (node.lang?.toLowerCase() === 'mermaid') {
              const mermaidImage = await this.renderMermaidDiagram(node.value)

              if (mermaidImage) {
                children.push(
                  new Paragraph({
                    children: [mermaidImage]
                  })
                )
              } else {
                children.push(
                  new Paragraph({
                    children: this.renderCodeBlock(node.value)
                  })
                )
              }
            } else {
              children.push(
                new Paragraph({
                  children: this.renderCodeBlock(node.value)
                })
              )
            }

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
      rows.map(async (row: MarkdownTableRow, rowIndex) => {
        const cells: MarkdownTableCell[] = row.children ?? []

        const tableCells = await Promise.all(
          Array.from(
            {
              length: columnCount
            },
            async (_, columnIndex) => {
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
            }
          )
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

  private async renderMermaidDiagram(code: string): Promise<ImageRun | null> {
    try {
      console.log('Rendering Mermaid diagram for DOCX')

      const id = `docforge-mermaid-${Date.now()}-${Math.random().toString(36).slice(2)}`

      const result = await mermaid.render(id, code)

      const svg = result.svg

      const pngData = await this.convertSvgToPng(svg)

      if (!pngData) {
        console.error('Unable to convert Mermaid SVG to PNG')

        return null
      }

      const maxWidth = 600

      const dimensions = this.getSvgDimensions(svg)

      const scale = Math.min(1, maxWidth / dimensions.width)

      const width = Math.round(dimensions.width * scale)

      const height = Math.round(dimensions.height * scale)

      console.log('Mermaid diagram rendered:', width, 'x', height)

      return new ImageRun({
        type: 'png',
        data: pngData,

        transformation: {
          width,
          height
        }
      })
    } catch (error) {
      console.error('Unable to render Mermaid diagram:', error)

      return null
    }
  }

  private getSvgDimensions(svg: string): {
    width: number
    height: number
  } {
    const parser = new DOMParser()

    const document = parser.parseFromString(svg, 'image/svg+xml')

    const svgElement = document.documentElement

    const viewBox = svgElement.getAttribute('viewBox')

    if (viewBox) {
      const values = viewBox
        .trim()
        .split(/[\s,]+/)
        .map(Number)

      if (
        values.length === 4 &&
        Number.isFinite(values[2]) &&
        Number.isFinite(values[3]) &&
        values[2] > 0 &&
        values[3] > 0
      ) {
        return {
          width: values[2],
          height: values[3]
        }
      }
    }

    const width = Number.parseFloat(svgElement.getAttribute('width') ?? '')

    const height = Number.parseFloat(svgElement.getAttribute('height') ?? '')

    if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
      return {
        width,
        height
      }
    }

    return {
      width: 800,
      height: 600
    }
  }

  private async convertSvgToPng(svg: string): Promise<Uint8Array | null> {
    try {
      const encodedSvg = btoa(unescape(encodeURIComponent(svg)))

      const dataUrl = `data:image/svg+xml;base64,${encodedSvg}`

      const image = new Image()

      const imageLoaded = new Promise<void>((resolve, reject) => {
        image.onload = () => resolve()

        image.onerror = () => reject(new Error('Unable to load Mermaid SVG image.'))
      })

      image.src = dataUrl

      await imageLoaded

      const dimensions = this.getSvgDimensions(svg)

      const canvas = document.createElement('canvas')

      canvas.width = Math.ceil(dimensions.width)

      canvas.height = Math.ceil(dimensions.height)

      const context = canvas.getContext('2d')

      if (!context) {
        throw new Error('Unable to create canvas rendering context.')
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height)

      const pngBlob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png')
      })

      if (!pngBlob) {
        throw new Error('Unable to convert Mermaid diagram to PNG.')
      }

      const arrayBuffer = await pngBlob.arrayBuffer()

      return new Uint8Array(arrayBuffer)
    } catch (error) {
      console.error('Unable to convert SVG to PNG:', error)

      return null
    }
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

  async saveDocx(markdownFilePath: string, markdownContent: string): Promise<string | null> {
    const data = await this.generateDocx(markdownContent)

    if (!data) {
      return null
    }

    const fileName = markdownFilePath
      .split(/[\\/]/)
      .pop()
      ?.replace(/\.(md|markdown)$/i, '.docx')

    if (!fileName) {
      return null
    }

    return await window.electronAPI.saveDocxToDownloads(fileName, data)
  }
}

export default new DocxService()
