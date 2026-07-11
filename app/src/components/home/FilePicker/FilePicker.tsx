import "./FilePicker.css";

function FilePicker() {
    return (
        <div className="file-picker">
            <label htmlFor="markdown-file">
                Markdown File
            </label>

            <div className="file-picker-row">
                <input
                    id="markdown-file"
                    type="text"
                    placeholder="Select a Markdown file..."
                    readOnly
                />

                <button>Browse</button>
            </div>
        </div>
    );
}

export default FilePicker;