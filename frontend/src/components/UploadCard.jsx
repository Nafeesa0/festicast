import { useState } from 'react'

// Example per-unit costs in rupees. Replace with your own shop's real numbers.
const costDefaults = {
  'Textile shop': { under: 150, over: 30 },
  Bakery: { under: 40, over: 60 },
  Grocery: { under: 20, over: 25 },
  Jewellery: { under: 500, over: 100 },
  Restaurant: { under: 60, over: 40 },
  Other: { under: 50, over: 50 },
}

const businessTypes = Object.keys(costDefaults)

function UploadCard({ onDataLoaded, onSummary }) {
  const [businessType, setBusinessType] = useState('Textile shop')
  const [underCost, setUnderCost] = useState(costDefaults['Textile shop'].under)
  const [overCost, setOverCost] = useState(costDefaults['Textile shop'].over)
  const [savedRows, setSavedRows] = useState([])
  const [fileName, setFileName] = useState('')
  const [lines, setLines] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function sendToBackend(rowsToSend) {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessType,
          rows: rowsToSend,
          underageCost: Number(underCost),
          overageCost: Number(overCost),
        }),
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

  function handleBusinessChange(event) {
    const type = event.target.value
    setBusinessType(type)
    setUnderCost(costDefaults[type].under)
    setOverCost(costDefaults[type].over)
  }

  function handleFileChange(event) {
    const file = event.target.files[0]
    if (!file) return

    setFileName(file.name)
    setError('')
    setLines([])
    setSavedRows([])
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

      setSavedRows(rows)
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
        <select value={businessType} onChange={handleBusinessChange}>
          {businessTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>

      <div className="cost-row">
        <label className="field">
          Cost of running out (₹ per unit)
          <input
            type="number"
            min="1"
            value={underCost}
            onChange={(event) => setUnderCost(event.target.value)}
          />
        </label>
        <label className="field">
          Cost of leftover stock (₹ per unit)
          <input
            type="number"
            min="1"
            value={overCost}
            onChange={(event) => setOverCost(event.target.value)}
          />
        </label>
      </div>

      <input type="file" accept=".csv" onChange={handleFileChange} />

      <button
        type="button"
        className="recalc"
        disabled={savedRows.length === 0 || loading}
        onClick={() => sendToBackend(savedRows)}
      >
        Recalculate with these costs
      </button>

      {fileName && <p>Selected: {fileName} ({businessType})</p>}
      {loading && <p>Sending to backend...</p>}
      {error && <p className="error">{error}</p>}
      {lines.length > 0 && <pre className="preview">{lines.join('\n')}</pre>}
    </div>
  )
}

export default UploadCard