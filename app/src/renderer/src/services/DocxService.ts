import mermaid from 'mermaid'
import {
  AlignmentType,
  Bookmark,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  ImageRun,
  InternalHyperlink,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun
} from 'docx'

import type {
  Blockquote,
  List,
  ListItem,
  PhrasingContent,
  RootContent,
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

type RenderedInlineNode = TextRun | ExternalHyperlink | InternalHyperlink | ImageRun

mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'strict',
  theme: 'default'
})

class DocxService {
  /*
   * Current Markdown file path.
   *
   * This is used when resolving relative
   * Markdown image paths.
   */
  private currentMarkdownFilePath = ''

  /*
   * Maps Markdown heading fragments to DOCX bookmark names.
   *
   * Example:
   *
   * # Introduction
   *
   * becomes:
   *
   * introduction -> introduction
   *
   * [Go to Introduction](#introduction)
   *
   * becomes an internal DOCX hyperlink to that bookmark.
   */
  private headingBookmarkMap = new Map<string, string>()

  async generateDocx(
    markdownContent: string,
    markdownFilePath: string
  ): Promise<Uint8Array | null> {
    try {
      this.currentMarkdownFilePath = markdownFilePath

      const tree = MarkdownParserService.parse(markdownContent)

      /*
       * Build the heading -> bookmark map before
       * rendering links.
       */
      this.prepareHeadingBookmarks(tree.children)

      const children: Array<Paragraph | Table> = []

      for (const node of tree.children) {
        switch (node.type) {
          case 'heading': {
            const headingLevel =
              node.depth === 1
                ? HeadingLevel.HEADING_1
                : node.depth === 2
                  ? HeadingLevel.HEADING_2
                  : node.depth === 3
                    ? HeadingLevel.HEADING_3
                    : node.depth === 4
                      ? HeadingLevel.HEADING_4
                      : node.depth === 5
                        ? HeadingLevel.HEADING_5
                        : HeadingLevel.HEADING_6

            const headingChildren = await this.renderInlineNodes(node.children)

            const bookmarkId = this.headingBookmarkMap.get(this.createHeadingKey(node.children))

            if (bookmarkId) {
              children.push(
                new Paragraph({
                  heading: headingLevel,

                  children: [
                    new Bookmark({
                      id: bookmarkId,
                      children: headingChildren
                    })
                  ]
                })
              )
            } else {
              children.push(
                new Paragraph({
                  heading: headingLevel,
                  children: headingChildren
                })
              )
            }

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

          case 'blockquote': {
            children.push(...(await this.renderBlockquote(node, 0)))

            break
          }

          case 'list': {
            children.push(...(await this.renderList(node, 0)))

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

          case 'thematicBreak': {
            children.push(
              new Paragraph({
                border: {
                  bottom: {
                    color: '808080',
                    size: 6,
                    space: 1,
                    style: 'single'
                  }
                }
              })
            )

            break
          }
        }
      }

      /*
       * Ordered lists intentionally do not use the DOCX
       * numbering engine.
       *
       * The numbers/letters are generated as TextRuns.
       * This prevents numbering from continuing between
       * independent Markdown lists.
       */
      const document = new Document({
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

  /*
   * Build a lookup table for all Markdown headings.
   *
   * Example:
   *
   * Introduction
   *    -> introduction
   *
   * Project Goals
   *    -> project_goals
   *
   * Duplicate headings receive unique bookmark names:
   *
   * Introduction
   * Introduction
   *
   * -> introduction
   * -> introduction_2
   */
  private prepareHeadingBookmarks(nodes: RootContent[]): void {
    this.headingBookmarkMap.clear()

    const usedBookmarkNames = new Set<string>()

    for (const node of nodes) {
      if (node.type !== 'heading' || !node.children) {
        continue
      }

      const key = this.createHeadingKey(node.children)

      const baseBookmark = this.createBookmarkName(key)

      let bookmarkName = baseBookmark

      let counter = 2

      while (usedBookmarkNames.has(bookmarkName)) {
        bookmarkName = `${baseBookmark}_${counter}`

        counter += 1
      }

      usedBookmarkNames.add(bookmarkName)

      /*
       * Store only the first heading for a given
       * Markdown fragment.
       *
       * This matches normal fragment-link behavior.
       */
      if (!this.headingBookmarkMap.has(key)) {
        this.headingBookmarkMap.set(key, bookmarkName)
      }
    }
  }

  /*
   * Convert heading text into the form used for
   * Markdown fragment matching.
   *
   * Example:
   *
   * "Project Goals"
   * -> "project-goals"
   *
   * "My API & Testing"
   * -> "my-api-testing"
   */
  private createHeadingKey(nodes: readonly PhrasingContent[]): string {
    const text = this.getInlineText(nodes)

    return text
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  /*
   * DOCX bookmark names are more restrictive than
   * normal Markdown fragment identifiers.
   *
   * We therefore convert:
   *
   * project-goals
   *
   * into:
   *
   * project_goals
   */
  private createBookmarkName(headingKey: string): string {
    let bookmarkName = headingKey.replace(/[^A-Za-z0-9_]/g, '_').replace(/_+/g, '_')

    if (!bookmarkName) {
      bookmarkName = 'bookmark'
    }

    if (/^[0-9]/.test(bookmarkName)) {
      bookmarkName = `_${bookmarkName}`
    }

    /*
     * Keep the bookmark name reasonably short.
     */
    bookmarkName = bookmarkName.slice(0, 40)

    return bookmarkName
  }

  private getInlineText(nodes: readonly PhrasingContent[]): string {
    let result = ''

    for (const node of nodes) {
      switch (node.type) {
        case 'text':
          result += node.value
          break

        case 'inlineCode':
          result += node.value
          break

        case 'strong':
        case 'emphasis':
        case 'delete':
        case 'link':
          result += this.getInlineText(node.children)
          break

        case 'image':
          result += node.alt ?? ''
          break

        case 'break':
          result += ' '
          break
      }
    }

    return result
  }

  private async renderBlockquote(node: Blockquote, depth: number): Promise<Paragraph[]> {
    const paragraphs: Paragraph[] = []

    const leftIndent = 720 * (depth + 1)

    for (const child of node.children) {
      if (child.type === 'paragraph') {
        paragraphs.push(
          new Paragraph({
            children: await this.renderInlineNodes(child.children),

            indent: {
              left: leftIndent
            },

            border: {
              left: {
                color: '808080',
                size: 12,
                space: 8,
                style: 'single'
              }
            }
          })
        )
      }

      if (child.type === 'blockquote') {
        paragraphs.push(...(await this.renderBlockquote(child, depth + 1)))
      }
    }

    return paragraphs
  }

  private toLowerAlpha(value: number): string {
    let result = ''
    let current = value

    while (current > 0) {
      current -= 1

      result = String.fromCharCode(97 + (current % 26)) + result

      current = Math.floor(current / 26)
    }

    return result
  }

  private toLowerRoman(value: number): string {
    const romanValues: Array<{
      value: number
      symbol: string
    }> = [
      {
        value: 1000,
        symbol: 'm'
      },
      {
        value: 900,
        symbol: 'cm'
      },
      {
        value: 500,
        symbol: 'd'
      },
      {
        value: 400,
        symbol: 'cd'
      },
      {
        value: 100,
        symbol: 'c'
      },
      {
        value: 90,
        symbol: 'xc'
      },
      {
        value: 50,
        symbol: 'l'
      },
      {
        value: 40,
        symbol: 'xl'
      },
      {
        value: 10,
        symbol: 'x'
      },
      {
        value: 9,
        symbol: 'ix'
      },
      {
        value: 5,
        symbol: 'v'
      },
      {
        value: 4,
        symbol: 'iv'
      },
      {
        value: 1,
        symbol: 'i'
      }
    ]

    let result = ''
    let remaining = value

    for (const item of romanValues) {
      while (remaining >= item.value) {
        result += item.symbol

        remaining -= item.value
      }
    }

    return result
  }

  private getOrderedListPrefix(index: number, depth: number): string {
    const level = depth % 4

    switch (level) {
      case 0:
        return `${index}. `

      case 1:
        return `${this.toLowerAlpha(index)}. `

      case 2:
        return `${this.toLowerRoman(index)}. `

      case 3:
      default:
        return `${index}. `
    }
  }

  private async renderList(node: List, depth: number): Promise<Paragraph[]> {
    const paragraphs: Paragraph[] = []

    for (let index = 0; index < node.children.length; index += 1) {
      const item = node.children[index]

      const paragraph = await this.renderListItemParagraph(
        item,
        node.ordered === true,
        depth,
        index + 1
      )

      if (paragraph) {
        paragraphs.push(paragraph)
      }

      for (const child of item.children) {
        if (child.type === 'list') {
          paragraphs.push(...(await this.renderList(child, depth + 1)))
        }
      }
    }

    return paragraphs
  }

  private async renderListItemParagraph(
    item: ListItem,
    ordered: boolean,
    depth: number,
    itemIndex: number
  ): Promise<Paragraph | null> {
    for (const child of item.children) {
      if (child.type !== 'paragraph') {
        continue
      }

      const inlineChildren = await this.renderInlineNodes(child.children)

      const isTaskItem = item.checked !== null && item.checked !== undefined

      if (isTaskItem) {
        inlineChildren.unshift(
          new TextRun({
            text: item.checked ? '☑ ' : '☐ '
          })
        )
      }

      if (ordered) {
        const prefix = this.getOrderedListPrefix(itemIndex, depth)

        inlineChildren.unshift(
          new TextRun({
            text: prefix
          })
        )

        return new Paragraph({
          children: inlineChildren,

          indent: {
            left: 720 * (depth + 1)
          }
        })
      }

      return new Paragraph({
        children: inlineChildren,

        /*
         * Task lists already have their own
         * checkbox character, so don't add
         * another bullet.
         */
        ...(isTaskItem
          ? {}
          : {
              bullet: {
                level: Math.min(depth, 3)
              }
            }),

        indent: {
          left: 720 * (depth + 1),
          hanging: 360
        }
      })
    }

    return null
  }

  private async renderTable(node: MarkdownTable): Promise<Table> {
    const rows: MarkdownTableRow[] = node.children ?? []

    const columnCount = Math.max(...rows.map((row) => row.children?.length ?? 0), 1)

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

          /*
           * Markdown fragment link:
           *
           * [Go to Introduction](#introduction)
           *
           * becomes a real DOCX internal hyperlink.
           */
          if (node.url.startsWith('#')) {
            const target = node.url.slice(1)

            const normalizedTarget = this.normalizeFragment(target)

            const bookmarkId = this.headingBookmarkMap.get(normalizedTarget)

            if (bookmarkId) {
              children.push(
                new InternalHyperlink({
                  anchor: bookmarkId,

                  children: linkChildren
                })
              )
            } else {
              /*
               * If the Markdown points to an anchor
               * that doesn't exist in the document,
               * preserve the visible link text instead
               * of generating a broken DOCX hyperlink.
               */
              children.push(...linkChildren)
            }

            break
          }

          children.push(
            new ExternalHyperlink({
              link: node.url,
              children: linkChildren
            })
          )

          break
        }

        case 'image': {
          /*
           * Resolve the image relative to the
           * currently opened Markdown file.
           */
          const image = this.currentMarkdownFilePath
            ? await window.electronAPI.readImage(node.url, this.currentMarkdownFilePath)
            : null

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

  /*
   * Normalize a Markdown fragment before looking it up.
   *
   * #Introduction
   * #introduction
   * #Introduction!
   *
   * are normalized consistently.
   */
  private normalizeFragment(fragment: string): string {
    let decoded = fragment

    try {
      decoded = decodeURIComponent(fragment)
    } catch {
      decoded = fragment
    }

    return decoded
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
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
    const data = await this.generateDocx(markdownContent, markdownFilePath)

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
