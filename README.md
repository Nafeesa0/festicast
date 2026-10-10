# FestiCast

**Decision-aware and festival-aware demand forecasting for Indian SMEs.**

Small shops lose money from overstocking and stockouts. FestiCast forecasts demand using festival-aware features (Onam, Eid, Ramadan, Diwali and more) and recommends how much stock to order.

## Architecture

React frontend -> Node.js + Express API -> Python FastAPI ML engine

- **frontend:** React (Vite), dashboard and charts
- **backend:** Node.js + Express, uploads, validation and storage
- **ml-service:** Python + FastAPI, forecasting models

## Planned features

- Upload a sales CSV and get a 7/30/90 day forecast
- Prediction intervals showing forecast uncertainty
- Anomaly detection and stock risk alerts
- Explainable forecasts and stock recommendations

## Status

In development. Currently building the React frontend.

## Run the frontend

    cd frontend
    npm install
    npm run dev
