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


def naive(history, horizon):
    return [history[-1]] * horizon


def seasonal_naive(history, horizon):
    last_week = history[-SEASON:]
    return [last_week[i % SEASON] for i in range(horizon)]


def moving_average(history, horizon, window=7):
    average = sum(history[-window:]) / window
    return [average] * horizon


MODELS = {
    "naive": naive,
    "seasonal_naive": seasonal_naive,
    "moving_average": moving_average,
}


def backtest(values, horizon):
    """Pretend to forecast the past, and measure the average miss (MAE)."""
    errors = {name: [] for name in MODELS}
    first_cut = max(SEASON * 2, len(values) // 2)

    for cut in range(first_cut, len(values) - horizon + 1, horizon):
        history = values[:cut]
        actual = values[cut : cut + horizon]
        for name, model in MODELS.items():
            predicted = model(history, horizon)
            errors[name].extend(abs(a - p) for a, p in zip(actual, predicted))

    return {
        name: round(sum(errs) / len(errs), 2)
        for name, errs in errors.items()
        if errs
    }


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

    scores = backtest(values, req.horizon)
    best = min(scores, key=scores.get) if scores else "seasonal_naive"
    predictions = MODELS[best](values, req.horizon)

    forecast_rows = [
        {
            "date": (last_date + timedelta(days=i + 1)).isoformat(),
            "sales": round(p, 1),
        }
        for i, p in enumerate(predictions)
    ]

    return {"method": best, "scores": scores, "forecast": forecast_rows}