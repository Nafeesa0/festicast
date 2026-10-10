function MetricCard({ title, value, note }) {
  return (
    <div className="card">
      <p className="card-title">{title}</p>
      <h2 className="card-value">{value}</h2>
      <p className="card-note">{note}</p>
    </div>
  )
}

export default MetricCard