import { useState } from 'react'
import './FilePicker.css'
import MarkdownService from '../../../services/MarkdownService'

interface FilePickerProps {
  label: string
  placeholder: string
  buttonText: string
}

function FilePicker({ label, placeholder, buttonText }: FilePickerProps) {
  const [filePath, setFilePath] = useState('')

  const handleBrowse = async () => {
    if (!window.electronAPI) {
      alert('This feature is available only in the Electron desktop application.')
      return
    }

    const selectedFile = await MarkdownService.openMarkdownFile()

    if (selectedFile) {
      setFilePath(selectedFile)
    }
  }

  return (
    <div className="file-picker">
      <label>{label}</label>

      <div className="file-picker-container">
        <input type="text" value={filePath} placeholder={placeholder} readOnly />

        <button onClick={handleBrowse}>{buttonText}</button>
      </div>
    </div>
  )
}

export default FilePicker
