import json
import random
from datetime import date, timedelta
from pathlib import Path

random.seed(7)

base = Path(__file__).parent
festivals = json.loads((base / "festivals.json").read_text(encoding="utf-8"))

festival_days = set()
for festival in festivals:
    day = date.fromisoformat(festival["start"])
    end = date.fromisoformat(festival["end"])
    while day <= end:
        festival_days.add(day)
        day += timedelta(days=1)

weekday_factor = [0.9, 0.9, 0.95, 1.0, 1.15, 1.4, 1.3]  # Monday to Sunday
start = date(2025, 8, 1)

rows = ["date,sales"]
for i in range(400):
    day = start + timedelta(days=i)
    sales = (100 + i * 0.15) * weekday_factor[day.weekday()]
    if day in festival_days:
        sales *= 1.6
    sales += random.gauss(0, 6)
    rows.append(f"{day.isoformat()},{round(sales)}")

out = base.parent / "data" / "festival_sales.csv"
out.write_text("\n".join(rows) + "\n", encoding="utf-8")
print("Wrote", len(rows) - 1, "rows to", out)