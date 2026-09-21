interface MarkdownPreviewProps {
  content: string
}

function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
    <div
      style={{
        marginTop: '30px',
        padding: '20px',
        border: '1px solid #444',
        borderRadius: '8px',
        whiteSpace: 'pre-wrap',
        minHeight: '250px',
        overflow: 'auto'
      }}
    >
      <h3>Markdown Preview</h3>

      <pre>{content}</pre>
    </div>
  )
}

export default MarkdownPreview
