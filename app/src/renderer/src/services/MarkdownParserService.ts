import { unified } from 'unified'
import remarkParse from 'remark-parse'

class MarkdownParserService {
  parse(markdownContent: string) {
    const tree = unified().use(remarkParse).parse(markdownContent)

    const imageNodes: unknown[] = []

    const visitNodes = (nodes: typeof tree.children) => {
      for (const node of nodes) {
        if (node.type === 'image') {
          imageNodes.push(node)
        }

        if ('children' in node && node.children) {
          visitNodes(node.children)
        }
      }
    }

    visitNodes(tree.children)

    console.log('Image AST nodes:', imageNodes)

    return tree
  }
}

export default new MarkdownParserService()
