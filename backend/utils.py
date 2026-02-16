import json
import random
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta

def history_to_dataframe(history_json):
    if not history_json:
        return None
    try:
        data = history_json if isinstance(history_json, list) else json.loads(history_json)
        df = pd.DataFrame(data)
        if 'Date' in df.columns:
            df.set_index('Date', inplace=True)
            df.index = pd.to_datetime(df.index, errors="coerce")
        df.sort_index(inplace=True)
        return df
    except Exception as e:
        print(f"[history_to_dataframe] Error: {e}")
        return None

def get_mock_data(ticker):
    """Fallback generator for test data"""
    print(f"⚠️ Generating MOCK DATA for {ticker} (Yahoo API failed)")
    base_price = random.uniform(100, 300)
    mock_history = []
    current_date = datetime.now()
    for i in range(30):
        date = (current_date - timedelta(days=30-i)).strftime('%Y-%m-%d')
        close_price = base_price * (1 + random.uniform(-0.05, 0.05))
        mock_history.append({"Date": date, "Close": round(close_price, 2)})

    return {
        "ticker": ticker.upper(),
        "company": f"{ticker} Corp (Mock)",
        "price": round(base_price, 2),
        "change_pct": round(random.uniform(-2.5, 2.5), 2),
        "pe_ratio": round(random.uniform(15, 50), 2),
        "beta": round(random.uniform(0.8, 1.5), 2),
        "sector": "Technology (Mock)",
        "history_json": mock_history
    }

def get_stock_data(ticker):
    try:
        # 1. Try fetching real data
        stock = yf.Ticker(ticker)
        
        # Fetch history (silence errors)
        try:
            hist_df = stock.history(period="30d", interval="1d")
        except Exception:
            hist_df = pd.DataFrame()

        if hist_df.empty:
            raise Exception("No price history found")

        price_val = hist_df["Close"].iloc[-1]
        change_pct = 0.0
        
        if len(hist_df) > 1:
            prev_close = hist_df["Close"].iloc[-2]
            if prev_close and prev_close != 0:
                change_pct = ((price_val - prev_close) / prev_close) * 100

        info = stock.info
        def safe_get(key, default="N/A"):
            val = info.get(key)
            if isinstance(val, (int, float)):
                return round(val, 2)
            return val or default

        return {
            "ticker": ticker.upper(),
            "company": info.get("longName", info.get("shortName", ticker.upper())),
            "price": round(price_val, 2),
            "change_pct": round(change_pct, 2),
            "pe_ratio": safe_get("trailingPE"),
            "beta": safe_get("beta"),
            "sector": info.get("sector", "N/A"),
            "history_json": hist_df.reset_index().to_dict(orient="records")
        }

    except Exception as e:
        print(f"❌ [get_stock_data] Failed for {ticker}: {e}")
        return get_mock_data(ticker)