import { useState } from 'react'
import Header from './components/Header'
import MetricCard from './components/MetricCard'
import UploadCard from './components/UploadCard'
import SalesChart from './components/SalesChart'

const sampleMetrics = [
  { title: 'Next 30 days forecast', value: '₹4.2L', note: 'Range ₹3.8L to ₹4.7L' },
  { title: 'Expected demand change', value: '+12%', note: 'Compared with last month' },
  { title: 'Stock risk', value: 'Medium', note: '3 products may run out' },
]

function App() {
  const [salesData, setSalesData] = useState([])
  const [summary, setSummary] = useState(null)

  const metrics = summary
    ? [
        {
          title: 'Total sales (from backend)',
          value: summary.totalSales.toLocaleString('en-IN'),
          note: `${summary.count} days uploaded`,
        },
        {
          title: 'Average daily sales',
          value: summary.averageSales.toFixed(1),
          note: `Business type: ${summary.businessType}`,
        },
      ]
    : sampleMetrics

  return (
    <div>
      <Header />
      <main className="container">
        <UploadCard onDataLoaded={setSalesData} onSummary={setSummary} />
        <SalesChart data={salesData} />
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