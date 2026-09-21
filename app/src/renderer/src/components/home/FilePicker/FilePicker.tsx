import './FilePicker.css'

interface FilePickerProps {
  label: string
  placeholder: string
  value?: string
  buttonText: string
  onBrowse: () => void
}

function FilePicker({ label, placeholder, value, buttonText, onBrowse }: FilePickerProps) {
  return (
    <div className="file-picker">
      <label>{label}</label>

      <div className="file-picker-container">
        <input type="text" value={value ?? ''} placeholder={placeholder} readOnly />

        <button type="button" onClick={onBrowse}>
          {buttonText}
        </button>
      </div>
    </div>
  )
}

export default FilePicker
