import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 5000

app.use(cors())
app.use(express.json({ limit: '5mb' }))

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'festicast-backend' })
})

app.post('/api/upload', (req, res) => {
  const { businessType, rows } = req.body

  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'No sales rows received.' })
  }

  const total = rows.reduce((sum, row) => sum + row.sales, 0)

  res.json({
    businessType,
    count: rows.length,
    totalSales: total,
    averageSales: total / rows.length,
  })
})

app.listen(PORT, () => {
  console.log(`FestiCast backend running on http://localhost:${PORT}`)
})