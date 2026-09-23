import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './MarkdownPreview.css'

interface MarkdownPreviewProps {
  content: string
}

interface MarkdownImageProps {
  src?: string
  alt?: string
  title?: string
}

function MarkdownImage({ src, alt, title }: MarkdownImageProps) {
  const [imageSource, setImageSource] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const loadImage = async () => {
      if (!src) {
        setLoading(false)
        return
      }

      setLoading(true)
      setImageSource(null)

      const image = await window.electronAPI.readImage(src)

      if (cancelled) return

      if (!image) {
        setLoading(false)
        return
      }

      const binary = Array.from(image.data)
        .map((byte) => String.fromCharCode(byte))
        .join('')

      const base64 = btoa(binary)

      setImageSource(`data:${image.contentType};base64,${base64}`)
      setLoading(false)
    }

    void loadImage()

    return () => {
      cancelled = true
    }
  }, [src])

  if (loading) {
    return <span>Loading image...</span>
  }

  if (!imageSource) {
    return <span>{alt ? `[Image: ${alt}]` : '[Image]'}</span>
  }

  return (
    <img
      src={imageSource}
      alt={alt ?? ''}
      title={title}
      style={{
        maxWidth: '100%',
        height: 'auto'
      }}
    />
  )
}

function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
    <section className="markdown-preview">
      <h2>Markdown Preview</h2>

      <div className="markdown-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            img: MarkdownImage
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </section>
  )
}

export default MarkdownPreview
