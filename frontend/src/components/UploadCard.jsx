import { useState } from 'react'

function UploadCard() {
  const [fileName, setFileName] = useState('')
  const [lines, setLines] = useState([])

  function handleFileChange(event) {
    const file = event.target.files[0]
    if (!file) return

    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = () => {
      const allLines = reader.result.trim().split('\n')
      setLines(allLines.slice(0, 6))
    }
    reader.readAsText(file)
  }

  return (
    <div className="card upload-card">
      <h2>Upload sales data</h2>
      <input type="file" accept=".csv" onChange={handleFileChange} />
      {fileName && <p>Selected: {fileName}</p>}
      {lines.length > 0 && <pre className="preview">{lines.join('\n')}</pre>}
    </div>
  )
}

export default UploadCard