import random
from datetime import date, timedelta

random.seed(42)

start = date(2026, 7, 1)
weekday_factor = [0.9, 0.9, 0.95, 1.0, 1.15, 1.4, 1.3]  # Monday to Sunday
festival_start = date(2026, 8, 20)
festival_end = date(2026, 8, 26)

rows = ["date,sales"]
for i in range(120):
    d = start + timedelta(days=i)
    sales = (100 + i * 0.3) * weekday_factor[d.weekday()]
    if festival_start <= d <= festival_end:
        sales *= 1.6
    sales += random.gauss(0, 6)
    rows.append(f"{d.isoformat()},{round(sales)}")

with open("../data/long_sales.csv", "w") as f:
    f.write("\n".join(rows) + "\n")

print("Wrote", len(rows) - 1, "rows")