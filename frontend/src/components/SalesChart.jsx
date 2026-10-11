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
  ReferenceArea,
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

  const festivalDays = (forecast || [])
    .filter((row) => row.festival)
    .map((row) => row.date)

  const chartData = [...history, ...future]

  return (
    <div className="card chart-card">
      <h2>Sales history and forecast</h2>
      <ResponsiveContainer width="100%" height={340}>
        <ComposedChart data={chartData}>
          <CartesianGrid stroke="#2b3373" strokeDasharray="3 3" />
          <XAxis dataKey="date" stroke="#a9b0d6" tick={{ fontSize: 11 }} minTickGap={30} />
          <YAxis stroke="#a9b0d6" tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              background: '#171d44',
              border: '1px solid #2b3373',
              borderRadius: 8,
              color: '#f4f1ff',
            }}
          />
          <Legend wrapperStyle={{ color: '#a9b0d6' }} />
          {festivalDays.length > 0 && (
            <ReferenceArea
              x1={festivalDays[0]}
              x2={festivalDays[festivalDays.length - 1]}
              fill="#f2c14e"
              fillOpacity={0.12}
              label={{
                value: 'Festival window',
                position: 'insideTop',
                fill: '#f2c14e',
                fontSize: 11,
              }}
            />
          )}
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
            fill="#f2c14e"
            fillOpacity={0.22}
            name="80% range"
            tooltipType="none"
          />
          <Line
            type="monotone"
            dataKey="sales"
            name="Actual sales"
            stroke="#7dd3c0"
            strokeWidth={2.5}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="forecast"
            name="Forecast"
            stroke="#f2c14e"
            strokeWidth={2.5}
            strokeDasharray="6 4"
          />
          <Line
            type="monotone"
            dataKey="order"
            name="Recommended order"
            stroke="#ff8fa3"
            strokeWidth={2.5}
            strokeDasharray="2 3"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export default SalesChart