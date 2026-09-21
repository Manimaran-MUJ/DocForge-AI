import { useState } from 'react'
import Header from '../../components/common/Header/Header'
import FilePicker from '../../components/home/FilePicker/FilePicker'
import OptionPanel from '../../components/home/OptionPanel/OptionPanel'
import MarkdownPreview from '../../components/home/MarkdownPreview/MarkdownPreview'
import MarkdownService from '../../services/MarkdownService'

function Home() {
  const [markdownContent, setMarkdownContent] = useState('')
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  const handleMarkdownBrowse = async () => {
    const filePath = await MarkdownService.openMarkdownFile()

    console.log('Selected file:', filePath)

    if (!filePath) {
      return
    }

    const content = await MarkdownService.readMarkdownFile(filePath)

    console.log('Markdown content:', content)

    if (content === null) {
      return
    }

    setSelectedFile(filePath)
    setMarkdownContent(content)
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
        buttonText="Browse"
        onBrowse={() => {}}
      />
      <OptionPanel />

      {markdownContent && <MarkdownPreview content={markdownContent} />}
    </>
  )
}

export default Home
