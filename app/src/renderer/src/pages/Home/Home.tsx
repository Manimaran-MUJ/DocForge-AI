import { useState } from 'react'
import Header from '../../components/common/Header/Header'
import FilePicker from '../../components/home/FilePicker/FilePicker'
import MarkdownPreview from '../../components/home/MarkdownPreview/MarkdownPreview'
import MarkdownService from '../../services/MarkdownService'
import DocxService from '../../services/DocxService'
import MarkdownParserService from '../../services/MarkdownParserService'

function Home() {
  const [markdownContent, setMarkdownContent] = useState('')
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  const handleMarkdownBrowse = async () => {
    const filePath = await MarkdownService.openMarkdownFile()

    if (!filePath) {
      return
    }

    const content = await MarkdownService.readMarkdownFile(filePath)

    if (content === null) {
      return
    }

    const tree = MarkdownParserService.parse(content)

    console.log(
      'Markdown AST types:',
      tree.children.map((node) => ({
        type: node.type,
        ordered: node.type === 'list' ? node.ordered : undefined,
        checked: node.type === 'listItem' ? node.checked : undefined
      }))
    )

    setSelectedFile(filePath)
    setMarkdownContent(content)
  }

  const handleConvert = async () => {
    if (!selectedFile || !markdownContent) {
      alert('Please select a Markdown file first.')
      return
    }

    const outputPath = await DocxService.saveDocx(selectedFile, markdownContent)

    if (outputPath) {
      alert(`DOCX file downloaded successfully:\n\n${outputPath}`)
    } else {
      alert('Unable to generate DOCX file.')
    }
  }

  return (
    <>
      <Header />

      <FilePicker
        label="Markdown File"
        value={selectedFile ?? ''}
        placeholder="Select a Markdown file"
        buttonText="Browse"
        onBrowse={handleMarkdownBrowse}
      />

      <button type="button" onClick={handleConvert}>
        Convert to DOCX
      </button>

      {markdownContent && <MarkdownPreview content={markdownContent} />}
    </>
  )
}

export default Home
