import { useState } from 'react'
import Header from '../../components/common/Header/Header'
import FilePicker from '../../components/home/FilePicker/FilePicker'
import OptionPanel from '../../components/home/OptionPanel/OptionPanel'
import MarkdownPreview from '../../components/home/MarkdownPreview/MarkdownPreview'
import MarkdownService from '../../services/MarkdownService'
import DocxService from '../../services/DocxService'

function Home() {
  const [markdownContent, setMarkdownContent] = useState('')
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [outputFile, setOutputFile] = useState<string | null>(null)

  const handleMarkdownBrowse = async () => {
    const filePath = await MarkdownService.openMarkdownFile()

    if (!filePath) {
      return
    }

    const content = await MarkdownService.readMarkdownFile(filePath)

    if (content === null) {
      return
    }

    setSelectedFile(filePath)
    setMarkdownContent(content)
  }

  const handleOutputBrowse = async () => {
    const filePath = await MarkdownService.saveDocxFile()

    if (!filePath) {
      return
    }

    setOutputFile(filePath)
  }

  const handleConvert = async () => {
    if (!markdownContent) {
      alert('Please select a Markdown file first.')
      return
    }

    if (!outputFile) {
      alert('Please select an output file first.')
      return
    }

    const success = await DocxService.saveDocx(outputFile, markdownContent)

    if (success) {
      alert('DOCX file generated successfully.')
    } else {
      alert('Unable to generate DOCX file.')
    }
  }

  return (
    <>
      <Header />

      <FilePicker
        label="Markdown File"
        placeholder={selectedFile ?? 'Select Markdown file...'}
        buttonText="Browse"
        onBrowse={handleMarkdownBrowse}
      />

      <FilePicker
        label="Output File"
        placeholder="Professional.docx"
        value={outputFile ?? ''}
        buttonText="Browse"
        onBrowse={handleOutputBrowse}
      />

      <OptionPanel />

      <button type="button" onClick={handleConvert}>
        Convert to DOCX
      </button>

      {markdownContent && <MarkdownPreview content={markdownContent} />}
    </>
  )
}

export default Home
