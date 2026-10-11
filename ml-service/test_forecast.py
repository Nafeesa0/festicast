import csv
import json
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

URL = "http://localhost:8000/forecast"
DATA = Path(__file__).parent.parent / "data"


def call_ml_service(csv_name):
    path = DATA / csv_name
    with open(path, newline="", encoding="utf-8") as f:
        rows = [
            {"date": r["date"], "sales": float(r["sales"])}
            for r in csv.DictReader(f)
        ]

    body = json.dumps({"rows": rows, "horizon": 7}).encode("utf-8")
    request = Request(URL, data=body, headers={"Content-Type": "application/json"})

    try:
        with urlopen(request) as response:
            return len(rows), json.load(response)
    except HTTPError as error:
        print(f"  ML service returned an error: {error.read().decode()}")
    except URLError:
        print("  Cannot reach the ML service. Is uvicorn running on port 8000?")
    return len(rows), None


def show(csv_name):
    print(f"\n=== {csv_name} ===")
    days, result = call_ml_service(csv_name)
    if result is None:
        return None

    print(f"  days uploaded   : {days}")
    print(f"  winning method  : {result['method']}")
    print(f"  festival uplift : {result['festival_uplift']}x")
    print("  MAE by model (lower is better):")
    for name, score in sorted(result["scores"].items(), key=lambda item: item[1]):
        print(f"    {name:<26} {score}")
    print("  next 7 days forecast:")
    for row in result["forecast"]:
        print(f"    {row['date']}  {row['sales']}")
    return result


def check(label, condition):
    print(f"  [{'PASS' if condition else 'CHECK'}] {label}")


festival = show("festival_sales.csv")
if festival:
    scores = festival["scores"]
    print("  Expectations:")
    check("uplift is between 1.4x and 1.8x", 1.4 <= festival["festival_uplift"] <= 1.8)
    check("festival model has the lowest MAE", festival["method"] == "festival_seasonal_naive")
    check(
        "festival model beats seasonal naive",
        scores["festival_seasonal_naive"] < scores["seasonal_naive"],
    )

normal = show("long_sales.csv")
if normal:
    print("  Expectations:")
    check("uplift is exactly 1.0x (no festival dates)", normal["festival_uplift"] == 1.0)
    check("seasonal naive wins the tie", normal["method"] == "seasonal_naive")