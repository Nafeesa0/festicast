import { useState } from 'react'

const businessTypes = [
  'Textile shop',
  'Bakery',
  'Grocery',
  'Jewellery',
  'Restaurant',
  'Other',
]

function UploadCard() {
  const [businessType, setBusinessType] = useState('Textile shop')
  const [fileName, setFileName] = useState('')
  const [lines, setLines] = useState([])
  const [error, setError] = useState('')

  function handleFileChange(event) {
    const file = event.target.files[0]
    if (!file) return

    setFileName(file.name)
    setError('')
    setLines([])

    const reader = new FileReader()
    reader.onload = () => {
      const allLines = reader.result.trim().split('\n')
      const header = allLines[0]
        .toLowerCase()
        .split(',')
        .map((column) => column.trim())

      if (!header.includes('date') || !header.includes('sales')) {
        setError('CSV must have "date" and "sales" columns.')
        return
      }

      setLines(allLines.slice(0, 6))
    }
    reader.readAsText(file)
  }

  return (
    <div className="card upload-card">
      <h2>Upload sales data</h2>

      <label className="field">
        Business type
        <select
          value={businessType}
          onChange={(event) => setBusinessType(event.target.value)}
        >
          {businessTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>

      <input type="file" accept=".csv" onChange={handleFileChange} />

      {fileName && <p>Selected: {fileName} ({businessType})</p>}
      {error && <p className="error">{error}</p>}
      {lines.length > 0 && <pre className="preview">{lines.join('\n')}</pre>}
    </div>
  )
}

export default UploadCard