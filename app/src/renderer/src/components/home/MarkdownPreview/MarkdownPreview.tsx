import { useEffect, useState } from 'react'
import mermaid from 'mermaid'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './MarkdownPreview.css'

type MarkdownPreviewProps = {
  content: string
  markdownFilePath: string
}

interface MarkdownImageProps {
  src?: string
  alt?: string
  title?: string
  markdownFilePath: string
}

interface MermaidBlockProps {
  code: string
}

mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'strict',
  theme: 'default'
})

function MarkdownImage({ src, alt, title, markdownFilePath }: MarkdownImageProps) {
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

      const image = markdownFilePath
        ? await window.electronAPI.readImage(src, markdownFilePath)
        : null

      if (cancelled) {
        return
      }

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
  }, [src, markdownFilePath])

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

function MermaidBlock({ code }: MermaidBlockProps) {
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    const renderDiagram = async () => {
      try {
        setError(false)
        setSvg(null)

        const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2)}`

        const result = await mermaid.render(id, code)

        if (!cancelled) {
          setSvg(result.svg)
        }
      } catch (renderError) {
        console.error('Unable to render Mermaid diagram:', renderError)

        if (!cancelled) {
          setError(true)
        }
      }
    }

    void renderDiagram()

    return () => {
      cancelled = true
    }
  }, [code])

  if (error) {
    return (
      <pre>
        <code>{code}</code>
      </pre>
    )
  }

  if (!svg) {
    return <div>Rendering Mermaid diagram...</div>
  }

  return (
    <div
      className="mermaid-preview"
      dangerouslySetInnerHTML={{
        __html: svg
      }}
    />
  )
}

function MarkdownPreview({ content, markdownFilePath }: MarkdownPreviewProps) {
  return (
    <section className="markdown-preview">
      <h2>Markdown Preview</h2>

      <div className="markdown-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            img: ({ src, alt, title }) => (
              <MarkdownImage
                src={src}
                alt={alt}
                title={title}
                markdownFilePath={markdownFilePath}
              />
            ),

            code: ({ className, children }) => {
              const match = /language-(\w+)/.exec(className ?? '')

              if (match?.[1] === 'mermaid') {
                return <MermaidBlock code={String(children).replace(/\n$/, '')} />
              }

              return <code className={className}>{children}</code>
            }
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </section>
  )
}

export default MarkdownPreview
