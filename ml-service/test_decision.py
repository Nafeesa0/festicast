import csv
import json
from pathlib import Path
from urllib.request import Request, urlopen

URL = "http://localhost:8000/forecast"
DATA = Path(__file__).parent.parent / "data"

with open(DATA / "festival_sales.csv", newline="", encoding="utf-8") as f:
    rows = [{"date": r["date"], "sales": float(r["sales"])} for r in csv.DictReader(f)]


def run(label, under, over):
    body = json.dumps(
        {"rows": rows, "horizon": 7, "underage_cost": under, "overage_cost": over}
    ).encode("utf-8")
    request = Request(URL, data=body, headers={"Content-Type": "application/json"})
    with urlopen(request) as response:
        result = json.load(response)

    forecast_total = sum(r["sales"] for r in result["forecast"])
    order_total = sum(r["order"] for r in result["forecast"])
    decision = result["decision"]
    print(f"\n{label}: running out costs Rs {under}, leftover costs Rs {over}")
    print(f"  critical ratio : {decision['critical_ratio']}")
    print(f"  forecast total : {forecast_total:.0f}")
    print(f"  order total    : {order_total}")
    holdout = decision["holdout"]
    if holdout:
        print(f"  daily cost on {holdout['days']} unseen days: "
              f"Rs {holdout['cost_decision']} (ordering the forecast: Rs {holdout['cost_forecast']})")
        print(f"  saving         : {holdout['saving_percent']}%")
    return forecast_total, order_total, holdout


f1, o1, h1 = run("Bakery-style (leftovers hurt)", 40, 60)
f2, o2, h2 = run("Textile-style (running out hurts)", 150, 30)
f3, o3, h3 = run("Equal costs", 50, 50)

print("\nExpectations:")
print("[PASS]" if o1 < f1 else "[CHECK]", "bakery orders LESS than the forecast")
print("[PASS]" if o2 > f2 else "[CHECK]", "textile orders MORE than the forecast")
print("[PASS]" if o2 > o1 else "[CHECK]", "textile order is larger than bakery order")
print("[PASS]" if h2 and h2["saving_percent"] > 0 else "[CHECK]",
      "ordering by the rule saves money on unseen days (textile costs)")