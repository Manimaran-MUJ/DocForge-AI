import { useState } from 'react'
import './OptionPanel.css'

function OptionPanel() {
  const [generateTOC, setGenerateTOC] = useState(true)
  const [preserveLinks, setPreserveLinks] = useState(true)
  const [renderMermaid, setRenderMermaid] = useState(true)
  const [preserveCode, setPreserveCode] = useState(true)
  const [preserveImages, setPreserveImages] = useState(true)

  return (
    <div className="option-panel">
      <h2>Conversion Options</h2>

      <label>
        <input
          type="checkbox"
          checked={generateTOC}
          onChange={() => setGenerateTOC(!generateTOC)}
        />
        Generate TOC
      </label>

      <label>
        <input
          type="checkbox"
          checked={preserveLinks}
          onChange={() => setPreserveLinks(!preserveLinks)}
        />
        Preserve Internal Links
      </label>

      <label>
        <input
          type="checkbox"
          checked={renderMermaid}
          onChange={() => setRenderMermaid(!renderMermaid)}
        />
        Render Mermaid
      </label>

      <label>
        <input
          type="checkbox"
          checked={preserveCode}
          onChange={() => setPreserveCode(!preserveCode)}
        />
        Preserve Code Blocks
      </label>

      <label>
        <input
          type="checkbox"
          checked={preserveImages}
          onChange={() => setPreserveImages(!preserveImages)}
        />
        Preserve Images
      </label>
    </div>
  )
}

export default OptionPanel
