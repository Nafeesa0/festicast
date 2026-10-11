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
  const { businessType, rows, underageCost, overageCost } = req.body

  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'No sales rows received.' })
  }

  const under = Number(underageCost) > 0 ? Number(underageCost) : 50
  const over = Number(overageCost) > 0 ? Number(overageCost) : 50
  const total = rows.reduce((sum, row) => sum + row.sales, 0)

  try {
    const mlResponse = await fetch(`${ML_URL}/forecast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rows,
        horizon: 7,
        underage_cost: under,
        overage_cost: over,
      }),
    })
    const mlResult = await mlResponse.json()

    if (!mlResponse.ok) {
      console.error('ML service said:', JSON.stringify(mlResult))
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
      scores: mlResult.scores,
      festivalUplift: mlResult.festival_uplift,
      errorRange: mlResult.error_range,
      decision: mlResult.decision,
      forecast: mlResult.forecast,
    })
  } catch (error) {
    console.error('Calling the ML service failed:', error)
    res.status(502).json({
      error: 'Cannot reach the ML service. Is it running on port 8000?',
    })
  }
})

app.listen(PORT, (error) => {
  if (error) {
    console.error(`Cannot start backend on port ${PORT}: ${error.message}`)
    process.exit(1)
  }
  console.log(`FestiCast backend running on http://localhost:${PORT}`)
})