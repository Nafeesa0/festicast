import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'

const SHOW_DAYS = 60 // show only the last 60 days so the forecast band is visible

function SalesChart({ data, forecast }) {
  if (data.length === 0) return null

  const history = data
    .slice(-SHOW_DAYS)
    .map((row) => ({ date: row.date, sales: row.sales }))

  const future = (forecast || []).map((row) => ({
    date: row.date,
    forecast: row.sales,
     order: row.order,
    lower: row.lower,
    band: row.lower != null && row.upper != null ? row.upper - row.lower : null,
  }))

  const chartData = [...history, ...future]

  return (
    <div className="card chart-card">
      <h2>Sales history and forecast</h2>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Area
            type="monotone"
            dataKey="lower"
            stackId="range"
            stroke="none"
            fill="transparent"
            legendType="none"
            tooltipType="none"
          />
          <Area
            type="monotone"
            dataKey="band"
            stackId="range"
            stroke="none"
            fill="#fcd9a8"
            name="80% range"
            tooltipType="none"
          />
          <Line
            type="monotone"
            dataKey="sales"
            name="Actual sales"
            stroke="#0f766e"
            strokeWidth={2}
            dot={false}
          />
            <Line
            type="monotone"
            dataKey="forecast"
            name="Forecast"
            stroke="#d97706"
            strokeWidth={2}
            strokeDasharray="6 4"
          />
          <Line
            type="monotone"
            dataKey="order"
            name="Recommended order"
            stroke="#6d28d9"
            strokeWidth={2}
            strokeDasharray="2 3"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export default SalesChart