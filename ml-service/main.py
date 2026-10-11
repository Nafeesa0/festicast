import json
from datetime import date, timedelta
from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="FestiCast ML Service")

SEASON = 7  # weekly pattern
LEVEL = 0.8  # we build an 80% prediction interval
MIN_RESIDUALS = 10  # need at least this many backtest misses to build a range
FESTIVAL_FILE = Path(__file__).parent / "festivals.json"


class Row(BaseModel):
    date: str
    sales: float


class ForecastRequest(BaseModel):
    rows: list[Row]
    horizon: int = 7
    underage_cost: float = Field(default=50, gt=0)  # cost per unit of running out
    overage_cost: float = Field(default=50, gt=0)  # cost per unit left over


def load_festival_days():
    """Read festivals.json and return every festival day as a set of dates."""
    days = set()
    if not FESTIVAL_FILE.exists():
        return days
    for festival in json.loads(FESTIVAL_FILE.read_text(encoding="utf-8")):
        day = date.fromisoformat(festival["start"])
        end = date.fromisoformat(festival["end"])
        while day <= end:
            days.add(day)
            day += timedelta(days=1)
    return days


def learn_uplift(values, dates, festival_days):
    """How many times higher are festival days than normal days? (1.0 = no effect)"""
    ratios = []
    for i, day in enumerate(dates):
        if day not in festival_days:
            continue
        normal = [
            values[j]
            for j in range(max(0, i - 28), i)
            if dates[j].weekday() == day.weekday() and dates[j] not in festival_days
        ]
        if normal:
            ratios.append(values[i] / (sum(normal) / len(normal)))
    if not ratios:
        return 1.0
    return sum(ratios) / len(ratios)


def quantile(sorted_values, q):
    """The value below which a fraction q of the sorted list falls."""
    position = (len(sorted_values) - 1) * q
    low = int(position)
    high = min(low + 1, len(sorted_values) - 1)
    fraction = position - low
    return sorted_values[low] + (sorted_values[high] - sorted_values[low]) * fraction


def average_cost(residuals, offset, under, over):
    """Average daily cost if we always order (forecast + offset).

    residual = actual - forecast. Demand above our order costs `under` per unit;
    stock above demand costs `over` per unit.
    """
    total = 0.0
    for r in residuals:
        total += under * max(r - offset, 0) + over * max(offset - r, 0)
    return total / len(residuals)


def naive(values, dates, future_dates, festival_days):
    return [values[-1]] * len(future_dates)


def seasonal_naive(values, dates, future_dates, festival_days):
    last_week = values[-SEASON:]
    return [last_week[i % SEASON] for i in range(len(future_dates))]


def moving_average(values, dates, future_dates, festival_days, window=7):
    average = sum(values[-window:]) / window
    return [average] * len(future_dates)


def festival_seasonal_naive(values, dates, future_dates, festival_days):
    uplift = learn_uplift(values, dates, festival_days)
    last_week = values[-SEASON:]
    last_dates = dates[-SEASON:]
    normal_week = [
        v / uplift if d in festival_days else v
        for v, d in zip(last_week, last_dates)
    ]
    predictions = []
    for i, day in enumerate(future_dates):
        value = normal_week[i % SEASON]
        if day in festival_days:
            value *= uplift
        predictions.append(value)
    return predictions


# Order matters: if two models tie, the earlier (simpler) one wins.
MODELS = {
    "naive": naive,
    "seasonal_naive": seasonal_naive,
    "moving_average": moving_average,
    "festival_seasonal_naive": festival_seasonal_naive,
}


def backtest(values, dates, horizon, festival_days):
    """Pretend to forecast the past. Returns each model's MAE and its signed misses."""
    residuals = {name: [] for name in MODELS}
    first_cut = max(SEASON * 2, len(values) // 2)

    for cut in range(first_cut, len(values) - horizon + 1, horizon):
        actual = values[cut : cut + horizon]
        future_dates = dates[cut : cut + horizon]
        for name, model in MODELS.items():
            # each model only sees data BEFORE the cut
            predicted = model(values[:cut], dates[:cut], future_dates, festival_days)
            residuals[name].extend(a - p for a, p in zip(actual, predicted))

    scores = {
        name: round(sum(abs(r) for r in res) / len(res), 2)
        for name, res in residuals.items()
        if res
    }
    return scores, residuals


@app.get("/health")
def health():
    return {"status": "ok", "service": "festicast-ml"}


@app.post("/forecast")
def forecast(req: ForecastRequest):
    if len(req.rows) < SEASON:
        raise HTTPException(
            status_code=400,
            detail=f"Need at least {SEASON} days of data.",
        )

    try:
        dates = [date.fromisoformat(row.date) for row in req.rows]
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Dates must look like 2026-09-01.",
        )

    values = [row.sales for row in req.rows]
    festival_days = load_festival_days()

    scores, residuals = backtest(values, dates, req.horizon, festival_days)
    best = min(scores, key=scores.get) if scores else "seasonal_naive"

    future_dates = [dates[-1] + timedelta(days=i + 1) for i in range(req.horizon)]
    predictions = MODELS[best](values, dates, future_dates, festival_days)

    best_residuals = residuals.get(best, [])  # kept in time order
    sorted_residuals = sorted(best_residuals)
    enough = len(best_residuals) >= MIN_RESIDUALS

    # prediction interval from the winning model's backtest misses
    error_range = None
    if enough:
        tail = (1 - LEVEL) / 2
        error_range = {
            "low": round(quantile(sorted_residuals, tail), 1),
            "high": round(quantile(sorted_residuals, 1 - tail), 1),
            "level": LEVEL,
            "samples": len(best_residuals),
        }

    # decision layer: newsvendor rule
    under, over = req.underage_cost, req.overage_cost
    critical = min(max(under / (under + over), 0.05), 0.95)
    offset = 0.0
    decision = None
    if enough:
        offset = quantile(sorted_residuals, critical)
        decision = {
            "critical_ratio": round(critical, 2),
            "offset": round(offset, 1),
            "holdout": None,
        }

        # fair test: learn the offset on the first half of the misses,
        # then measure cost on the second half it has never seen
        half = len(best_residuals) // 2
        if half >= 5 and len(best_residuals) - half >= 5:
            learned = quantile(sorted(best_residuals[:half]), critical)
            unseen = best_residuals[half:]
            cost_forecast = average_cost(unseen, 0.0, under, over)
            cost_decision = average_cost(unseen, learned, under, over)
            saving = None
            if cost_forecast > 0:
                saving = round(100 * (cost_forecast - cost_decision) / cost_forecast, 1)
            decision["holdout"] = {
                "days": len(unseen),
                "cost_forecast": round(cost_forecast, 1),
                "cost_decision": round(cost_decision, 1),
                "saving_percent": saving,
            }

    forecast_rows = []
    for day, p in zip(future_dates, predictions):
        row = {
            "date": day.isoformat(),
            "sales": round(p, 1),
            "lower": None,
            "upper": None,
            "order": max(0, round(p + offset)),
        }
        if error_range:
            row["lower"] = round(max(0, p + error_range["low"]), 1)
            row["upper"] = round(p + error_range["high"], 1)
        forecast_rows.append(row)

    return {
        "method": best,
        "scores": scores,
        "festival_uplift": round(learn_uplift(values, dates, festival_days), 2),
        "error_range": error_range,
        "decision": decision,
        "forecast": forecast_rows,
    }