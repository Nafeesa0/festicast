import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 5000
const ML_URL = 'http://localhost:8000'

app.use(cors())
app.use(express.json({ limit: '5mb' }))

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'festicast-backend' })
})

app.post('/api/upload', async (req, res) => {
  const { businessType, rows } = req.body

  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'No sales rows received.' })
  }

  const total = rows.reduce((sum, row) => sum + row.sales, 0)

  try {
    const mlResponse = await fetch(`${ML_URL}/forecast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows, horizon: 7 }),
    })
    const mlResult = await mlResponse.json()

    if (!mlResponse.ok) {
      const message =
        typeof mlResult.detail === 'string' ? mlResult.detail : 'Forecast failed.'
      return res.status(400).json({ error: message })
    }

    res.json({
      businessType,
      count: rows.length,
      totalSales: total,
      averageSales: total / rows.length,
      method: mlResult.method,
      forecast: mlResult.forecast,
    })
  } catch {
    res.status(502).json({
      error: 'Cannot reach the ML service. Is it running on port 8000?',
    })
  }
})

app.listen(PORT, () => {
  console.log(`FestiCast backend running on http://localhost:${PORT}`)
})