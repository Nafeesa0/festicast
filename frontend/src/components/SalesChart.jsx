import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'

function SalesChart({ data, forecast }) {
  if (data.length === 0) return null

  const history = data.map((row) => ({ date: row.date, sales: row.sales }))
  const future = (forecast || []).map((row) => ({
    date: row.date,
    forecast: row.sales,
  }))
  const chartData = [...history, ...future]

  return (
    <div className="card chart-card">
      <h2>Sales history and forecast</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="sales"
            name="Actual sales"
            stroke="#0f766e"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="forecast"
            name="Forecast"
            stroke="#d97706"
            strokeWidth={2}
            strokeDasharray="6 4"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default SalesChart