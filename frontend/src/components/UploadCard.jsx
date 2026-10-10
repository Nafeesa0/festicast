import { useState } from 'react'

const businessTypes = [
  'Textile shop',
  'Bakery',
  'Grocery',
  'Jewellery',
  'Restaurant',
  'Other',
]

function UploadCard({ onDataLoaded, onSummary }) {
  const [businessType, setBusinessType] = useState('Textile shop')
  const [fileName, setFileName] = useState('')
  const [lines, setLines] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function sendToBackend(rows) {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessType, rows }),
      })
      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Server error.')
        return
      }
      onSummary(result)
    } catch {
      setError('Cannot reach the backend. Is it running on port 5000?')
    } finally {
      setLoading(false)
    }
  }

  function handleFileChange(event) {
    const file = event.target.files[0]
    if (!file) return

    setFileName(file.name)
    setError('')
    setLines([])
    onDataLoaded([])
    onSummary(null)

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

      const dateIndex = header.indexOf('date')
      const salesIndex = header.indexOf('sales')

      const rows = allLines
        .slice(1)
        .map((line) => {
          const parts = line.split(',')
          return {
            date: (parts[dateIndex] || '').trim(),
            sales: Number(parts[salesIndex]),
          }
        })
        .filter((row) => row.date !== '' && !Number.isNaN(row.sales))

      onDataLoaded(rows)
      setLines(allLines.slice(0, 6))
      sendToBackend(rows)
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
      {loading && <p>Sending to backend...</p>}
      {error && <p className="error">{error}</p>}
      {lines.length > 0 && <pre className="preview">{lines.join('\n')}</pre>}
    </div>
  )
}

export default UploadCard