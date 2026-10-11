import csv
import json
from pathlib import Path
from urllib.request import Request, urlopen

URL = "http://localhost:8000/forecast"
DATA = Path(__file__).parent.parent / "data"


def load(name):
    with open(DATA / name, newline="", encoding="utf-8") as f:
        return [{"date": r["date"], "sales": float(r["sales"])} for r in csv.DictReader(f)]


def forecast(rows):
    body = json.dumps({"rows": rows, "horizon": 7}).encode("utf-8")
    request = Request(URL, data=body, headers={"Content-Type": "application/json"})
    with urlopen(request) as response:
        return json.load(response)


rows = load("festival_sales.csv")
inside = 0
total = 0

for cut in range(len(rows) - 84, len(rows) - 6, 7):
    result = forecast(rows[:cut])
    for predicted, actual in zip(result["forecast"], rows[cut : cut + 7]):
        if predicted["lower"] is None:
            continue
        total += 1
        if predicted["lower"] <= actual["sales"] <= predicted["upper"]:
            inside += 1

coverage = 100 * inside / total
print(f"Real sales inside the 80% band: {inside} of {total} days ({coverage:.0f}%)")
print("[PASS]" if 65 <= coverage <= 95 else "[CHECK]", "coverage is reasonably close to 80%")