import { useState } from 'react'
import Header from './components/Header'
import MetricCard from './components/MetricCard'
import UploadCard from './components/UploadCard'
import SalesChart from './components/SalesChart'

const sampleMetrics = [
  { title: 'Next 7 days forecast', value: '--', note: 'Upload a CSV to see it' },
  { title: 'Total sales', value: '--', note: 'Upload a CSV to see it' },
  { title: 'Average daily sales', value: '--', note: 'Upload a CSV to see it' },
]

function signed(n) {
  return (n > 0 ? '+' : '') + n.toFixed(1)
}

function App() {
  const [salesData, setSalesData] = useState([])
  const [summary, setSummary] = useState(null)

  const forecast = summary ? summary.forecast : []

  let metrics = sampleMetrics
  if (summary) {
    const forecastTotal = forecast.reduce((sum, row) => sum + row.sales, 0)
    const orderTotal = forecast.reduce((sum, row) => sum + row.order, 0)
    const scoreList = summary.scores
      ? Object.entries(summary.scores)
          .map(([name, value]) => `${name.replaceAll('_', ' ')}: ${value}`)
          .join(' | ')
      : ''
    const range = summary.errorRange
    const decision = summary.decision
    const holdout = decision ? decision.holdout : null

    metrics = [
      {
        title: 'Next 7 days forecast',
        value: forecastTotal.toLocaleString('en-IN'),
        note: `Method: ${summary.method.replaceAll('_', ' ')}`,
      },
      {
        title: 'Recommended order (7 days)',
        highlight: true,
        value: orderTotal.toLocaleString('en-IN'),
        note: decision
          ? `Aims to cover demand on about ${Math.round(decision.critical_ratio * 100)} of 100 days (${signed(decision.offset)} per day vs forecast)`
          : 'Not enough history, so this equals the forecast',
      },
      {
        title: 'Cost saving vs ordering the forecast',
        value:
          holdout && holdout.saving_percent !== null
            ? `${holdout.saving_percent}%`
            : '--',
        note: holdout
          ? `Average daily cost ₹${holdout.cost_decision} vs ₹${holdout.cost_forecast}, tested on ${holdout.days} unseen days`
          : 'Needs more history to test',
      },
      {
        title: 'Total sales',
        value: summary.totalSales.toLocaleString('en-IN'),
        note: `${summary.count} days uploaded`,
      },
      {
        title: 'Average daily sales',
        value: summary.averageSales.toFixed(1),
        note: `Business type: ${summary.businessType}`,
      },
      {
        title: 'Best model error (MAE)',
        value: summary.scores ? String(summary.scores[summary.method]) : '--',
        note: scoreList,
      },
      {
        title: 'Learned festival uplift',
        value: summary.festivalUplift ? `${summary.festivalUplift}x` : '--',
        note: '1.0x means no festival effect found',
      },
      {
        title: 'Daily forecast range (80%)',
        value: range ? `${signed(range.low)} to ${signed(range.high)}` : '--',
        note: range
          ? `From ${range.samples} backtest forecasts. Each day should land inside the band about 8 times in 10.`
          : 'Not enough history to estimate a range',
      },
    ]
  }

  return (
    <div>
      <Header businessType={summary ? summary.businessType : ''} />
      <main className="container">
        <UploadCard onDataLoaded={setSalesData} onSummary={setSummary} />
        <SalesChart data={salesData} forecast={forecast} />
        <div className="card-grid">
          {metrics.map((metric) => (
            <MetricCard
              key={metric.title}
              title={metric.title}
              value={metric.value}
              note={metric.note}
              highlight={metric.highlight}
            />
          ))}
        </div>
      </main>
    </div>
  )
}

export default App