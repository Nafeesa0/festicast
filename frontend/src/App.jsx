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

function App() {
  const [salesData, setSalesData] = useState([])
  const [summary, setSummary] = useState(null)

  const forecast = summary ? summary.forecast : []

  let metrics = sampleMetrics
  if (summary) {
    const forecastTotal = forecast.reduce((sum, row) => sum + row.sales, 0)
    metrics = [
      {
        title: 'Next 7 days forecast',
        value: forecastTotal.toLocaleString('en-IN'),
        note: `Method: ${summary.method.replaceAll('_', ' ')}`,
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
    ]
  }

  return (
    <div>
      <Header />
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
            />
          ))}
        </div>
      </main>
    </div>
  )
}

export default App