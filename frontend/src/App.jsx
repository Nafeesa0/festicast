import Header from './components/Header'
import MetricCard from './components/MetricCard'

const sampleMetrics = [
  { title: 'Next 30 days forecast', value: '₹4.2L', note: 'Range ₹3.8L to ₹4.7L' },
  { title: 'Expected demand change', value: '+12%', note: 'Compared with last month' },
  { title: 'Stock risk', value: 'Medium', note: '3 products may run out' },
]

function App() {
  return (
    <div>
      <Header />
      <main className="container">
        <div className="card-grid">
          {sampleMetrics.map((metric) => (
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