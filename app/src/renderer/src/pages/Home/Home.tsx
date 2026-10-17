import { useState } from 'react'
import Header from '../../components/common/Header/Header'
import FilePicker from '../../components/home/FilePicker/FilePicker'
import MarkdownPreview from '../../components/home/MarkdownPreview/MarkdownPreview'
import MarkdownService from '../../services/MarkdownService'
import DocxService from '../../services/DocxService'
import MarkdownParserService from '../../services/MarkdownParserService'
import './Home.css'

type Notification = {
  type: 'success' | 'error'
  message: string
}

function Home() {
  const [markdownContent, setMarkdownContent] = useState('')
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const [notification, setNotification] = useState<Notification | null>(null)

  const handleMarkdownBrowse = async () => {
    try {
      const filePath = await MarkdownService.openMarkdownFile()

      if (!filePath) {
        return
      }

      const content = await MarkdownService.readMarkdownFile(filePath)

      if (content === null) {
        setNotification({
          type: 'error',
          message: 'Unable to read the selected Markdown file.'
        })
        return
      }

      const tree = MarkdownParserService.parse(content)

      console.log(
        'Markdown AST types:',
        tree.children.map((node, index) => ({
          index,
          type: node.type,
          value: node.type === 'code' ? node.value.slice(0, 40) : undefined,
          lang: node.type === 'code' ? node.lang : undefined
        }))
      )

      setSelectedFile(filePath)
      setMarkdownContent(content)
      setNotification(null)
    } catch (error) {
      console.error('Unable to open Markdown file:', error)

      setNotification({
        type: 'error',
        message: 'Unable to open the selected Markdown file.'
      })
    }
  }

  const handleConvert = async () => {
    if (isConverting) {
      return
    }

    if (!selectedFile || !markdownContent.trim()) {
      setNotification({
        type: 'error',
        message: 'Please select a non-empty Markdown file first.'
      })
      return
    }

    setIsConverting(true)
    setNotification(null)

    try {
      const outputPath = await DocxService.saveDocx(selectedFile, markdownContent)

      if (outputPath) {
        setNotification({
          type: 'success',
          message: `DOCX created successfully. Saved to: ${outputPath}`
        })
      } else {
        setNotification({
          type: 'error',
          message: 'Unable to generate the DOCX file. Please try again.'
        })
      }
    } catch (error) {
      console.error('DOCX conversion failed:', error)

      setNotification({
        type: 'error',
        message: 'Conversion failed unexpectedly. Please try again.'
      })
    } finally {
      setIsConverting(false)
    }
  }

  const canConvert = Boolean(selectedFile) && Boolean(markdownContent.trim()) && !isConverting

  return (
    <div className="home-page">
      <Header />

      <main className="home-content">
        <section className="hero-section">
          <span className="hero-eyebrow">DOCUMENT CONVERTER</span>

          <h1>Markdown → DOCX</h1>

          <p>
            Convert your Markdown documents into polished Word documents while preserving your
            content and formatting.
          </p>
        </section>

        <section className="file-section">
          <div className="section-heading">
            <div>
              <h2>Select Markdown File</h2>
              <p>Choose a Markdown document to begin conversion.</p>
            </div>
          </div>

          <div className="file-picker-card">
            <div className="file-picker-header">
              <div className="file-picker-icon">📄</div>

              <div className="file-picker-content">
                <h3>{selectedFile ? 'Markdown file selected' : 'Choose a Markdown file'}</h3>

                <p>
                  {selectedFile
                    ? 'Your Markdown document is ready for conversion.'
                    : 'Select a .md or .markdown file from your computer.'}
                </p>
              </div>
            </div>

            <FilePicker
              label=""
              value={selectedFile ?? ''}
              placeholder="Select a Markdown file"
              buttonText="Browse"
              onBrowse={handleMarkdownBrowse}
            />
          </div>

          {selectedFile && (
            <div className="selected-file">
              <span className="selected-file-status">✓</span>

              <div className="selected-file-details">
                <span className="selected-file-label">Selected file</span>
                <span className="selected-file-name" title={selectedFile}>
                  {selectedFile.split(/[\\/]/).pop() || selectedFile}
                </span>
              </div>
            </div>
          )}
        </section>

        <section className="conversion-section">
          <button
            className="convert-button"
            type="button"
            onClick={handleConvert}
            disabled={!canConvert}
          >
            <span>{isConverting ? 'Converting document...' : 'Convert to DOCX'}</span>

            {!isConverting && (
              <span className="convert-arrow" aria-hidden="true">
                →
              </span>
            )}

            {isConverting && <span className="conversion-spinner" aria-hidden="true" />}
          </button>
        </section>

        {notification && (
          <div
            className={`conversion-notification ${notification.type}`}
            role={notification.type === 'error' ? 'alert' : 'status'}
            aria-live={notification.type === 'error' ? 'assertive' : 'polite'}
          >
            <span className="notification-icon" aria-hidden="true">
              {notification.type === 'success' ? '✓' : '!'}
            </span>

            <p>{notification.message}</p>

            <button
              className="notification-dismiss"
              type="button"
              onClick={() => setNotification(null)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        )}

        {markdownContent && selectedFile && (
          <section className="preview-section">
            <div className="section-heading">
              <div>
                <span className="section-eyebrow">LIVE PREVIEW</span>
                <h2>Markdown Preview</h2>
                <p>Review your document before converting it.</p>
              </div>
            </div>

            <div className="preview-card">
              <MarkdownPreview content={markdownContent} markdownFilePath={selectedFile} />
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default Home
