function Header({ businessType }) {
  return (
    <>
      <div className="stripe" />
      <header className="header">
        <div>
          <h1>
            <span>Festi</span>Cast
          </h1>
          <p>Forecast demand the way your business decides.</p>
        </div>
        {businessType && <span className="badge">{businessType}</span>}
      </header>
    </>
  )
}

export default Header