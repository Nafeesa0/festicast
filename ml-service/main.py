from datetime import date, timedelta

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="FestiCast ML Service")

SEASON = 7  # weekly pattern


class Row(BaseModel):
    date: str
    sales: float


class ForecastRequest(BaseModel):
    rows: list[Row]
    horizon: int = 7


@app.get("/health")
def health():
    return {"status": "ok", "service": "festicast-ml"}


@app.post("/forecast")
def forecast(req: ForecastRequest):
    values = [row.sales for row in req.rows]

    if len(values) < SEASON:
        raise HTTPException(
            status_code=400,
            detail=f"Need at least {SEASON} days of data.",
        )

    try:
        last_date = date.fromisoformat(req.rows[-1].date)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Dates must look like 2026-09-01.",
        )

    last_week = values[-SEASON:]
    forecast_rows = []
    for i in range(req.horizon):
        forecast_rows.append(
            {
                "date": (last_date + timedelta(days=i + 1)).isoformat(),
                "sales": last_week[i % SEASON],
            }
        )

    return {"method": "seasonal_naive", "forecast": forecast_rows}