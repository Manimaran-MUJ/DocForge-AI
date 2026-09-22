import { unified } from 'unified'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'

class MarkdownParserService {
  parse(markdownContent: string) {
    return unified().use(remarkParse).use(remarkGfm).parse(markdownContent)
  }
}

export default new MarkdownParserService()
