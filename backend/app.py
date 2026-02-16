import os
import traceback
import json
from datetime import datetime
from io import BytesIO
from flask import Flask, render_template, request, jsonify, send_file, session, flash, redirect, url_for
from dotenv import load_dotenv
from graph_agent import run_financial_graph
import pandas as pd
import markdown

# ReportLab imports for PDF generation
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.units import inch

# Local imports
from extensions import db
from models import Holding, AnalysisHistory
from utils import get_stock_data, history_to_dataframe
from ai_module import dsp_financial_insight

# ---------------------------------------------------------------------
# Environment Configuration
# ---------------------------------------------------------------------
load_dotenv()

OPENAI_KEY = os.getenv("OPENAI_API_KEY")
SECRET_KEY = os.getenv("SECRET_KEY", "CHANGE_THIS_TO_A_RANDOM_VALUE")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///finance.db")
PORT = int(os.getenv("PORT", 5000))
DEBUG_MODE = os.getenv("FLASK_ENV") == "development"

# ---------------------------------------------------------------------
# Flask Application Setup
# ---------------------------------------------------------------------
app = Flask(__name__)
app.config.update(
    SECRET_KEY=SECRET_KEY,
    SQLALCHEMY_DATABASE_URI=DATABASE_URL,
    SQLALCHEMY_TRACK_MODIFICATIONS=False,
)

db.init_app(app)

# Create tables if they don't exist
with app.app_context():
    db.create_all()

# Default tickers to show on the dashboard
# Default tickers to show on the dashboard
DEFAULT_TICKERS = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "AMD", "META", "NFLX"]

# ---------------------------------------------------------------------
# Task 5: Flask Frontend Route Implementation (Dashboard)
# ---------------------------------------------------------------------

@app.route("/")
def index():
    """
    Render the main dashboard.
    Fetches live data for a default list of popular stocks to populate the table.
    """
    default_stocks = []
    try:
        # Fetch data for default tickers to show immediate value on load
        for t in DEFAULT_TICKERS:
            data = get_stock_data(t)
            if data:
                default_stocks.append(data)
    except Exception as e:
        print(f"Error fetching default stocks: {e}")

    return render_template("index.html", default_stocks=default_stocks)


# ---------------------------------------------------------------------
# Task 6: Implement DSPy Stock Analysis and Insight Summary Routes
# ---------------------------------------------------------------------

@app.route("/api/analyze", methods=["POST"])
def api_analyze():
    """
    Core Analysis Endpoint:
    1. Receives ticker.
    2. Fetches real-time stock data.
    3. Generates AI insight using DSPy.
    4. Saves the result to the database.
    5. Returns JSON for the frontend to update or redirect.
    """
    data = request.json
    ticker = data.get("ticker", "").upper().strip()

    if not ticker:
        return jsonify({"error": "No ticker provided"}), 400

    try:
        # 1. Fetch Stock Data
        stock_info = get_stock_data(ticker)
        if not stock_info or stock_info.get("price") == "N/A":
             return jsonify({"error": f"Could not fetch data for {ticker}"}), 404

        # 2. Generate AI Insight
        insight_text = run_financial_graph(ticker, stock_info)

        # 3. Save to History Database
        history_entry = AnalysisHistory(
            ticker=ticker,
            analysis=insight_text
        )
        db.session.add(history_entry)
        db.session.commit()

        # 4. Store the ID in session so /insight_summary can find it
        session['latest_analysis_id'] = history_entry.id

        # 5. Prepare Recent History Preview (last 30 days)
        # Convert the history JSON from stock_info back to a list of dicts for the frontend
        history_preview = []
        if stock_info.get("history_json"):
            # Take just the last 30 entries for the preview table
            history_preview = stock_info["history_json"][-30:]
            # Sort descending by date for display
            history_preview.reverse()

        return jsonify({
            "stock": stock_info,
            "insight": insight_text,
            "history_preview": history_preview
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/insight_summary")
def insight_summary():
    analysis_id = session.get('latest_analysis_id')
    if not analysis_id:
        flash("No recent analysis found.")
        return redirect(url_for('index'))

    record = AnalysisHistory.query.get(analysis_id)
    if not record:
        return redirect(url_for('index'))
    
    # Fetch live data again to get the HISTORY for the chart
    stock_data = get_stock_data(record.ticker)

    insight_data = {
        "company": stock_data.get("company", record.ticker),
        "ticker": record.ticker,
        "price": stock_data.get("price"),
        "change_pct": stock_data.get("change_pct"),
        "pe_ratio": stock_data.get("pe_ratio"),
        "beta": stock_data.get("beta"),
        "insight": markdown.markdown(record.analysis),
        "history_json": stock_data.get("history_json", []) # <--- ADD THIS LINE
    }

    return render_template("insight_summary.html", insight=insight_data)

@app.route("/history")
def history_page():
    """
    Shows a list of all past AI analyses.
    """
    # Order by newest first
    items = AnalysisHistory.query.order_by(AnalysisHistory.created_at.desc()).all()
    return render_template("analysis.html", items=items)


# ---------------------------------------------------------------------
# Task 7: Implement Portfolio Management Routes
# ---------------------------------------------------------------------

@app.route("/portfolio")
def portfolio_page():
    """
    Displays the user's portfolio.
    Calculates current market value for every holding.
    """
    holdings = Holding.query.all()
    portfolio_data = []
    total_value = 0.0

    for h in holdings:
        # Fetch current price to calculate real-time value
        # Note: In a real app, you might cache this or batch fetch to avoid rate limits
        stock = get_stock_data(h.ticker)
        current_price = stock.get("price", 0)
        
        # Handle "N/A" or errors gracefully
        if isinstance(current_price, (int, float)):
            val = round(current_price * h.quantity, 2)
        else:
            current_price = 0
            val = 0

        total_value += val
        
        portfolio_data.append({
            "ticker": h.ticker,
            "quantity": h.quantity,
            "price": current_price,
            "value": val
        })

    return render_template(
        "portfolio.html",
        holdings=portfolio_data,
        total_value=round(total_value, 2)
    )


@app.route("/api/portfolio", methods=["POST"])
def add_portfolio_item():
    """
    Adds or updates a stock in the portfolio.
    """
    try:
        data = request.json
        ticker = data.get("ticker", "").upper().strip()
        try:
            quantity = float(data.get("quantity", 0))
        except ValueError:
            return jsonify({"error": "Invalid quantity"}), 400

        if not ticker:
            return jsonify({"error": "Ticker required"}), 400

        # Check if holding exists
        holding = Holding.query.filter_by(ticker=ticker).first()
        
        if holding:
            # Update existing
            holding.quantity = quantity
        else:
            # Create new
            holding = Holding(ticker=ticker, quantity=quantity)
            db.session.add(holding)
        
        db.session.commit()
        return jsonify({"ok": True, "message": f"Updated {ticker}"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/portfolio/delete", methods=["POST"])
def delete_portfolio_item():
    """
    Deletes a stock from the portfolio.
    """
    try:
        data = request.json
        ticker = data.get("ticker", "").upper().strip()
        
        holding = Holding.query.filter_by(ticker=ticker).first()
        if holding:
            db.session.delete(holding)
            db.session.commit()
            return jsonify({"ok": True})
        else:
            return jsonify({"error": "Item not found"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------
# Task 8: Implement Portfolio PDF Report Generation Route
# ---------------------------------------------------------------------

@app.route("/portfolio/report")
def portfolio_report():
    """
    Generates and downloads a PDF summary of the portfolio.
    """
    try:
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter

        # Title
        c.setFont("Helvetica-Bold", 18)
        c.drawString(50, height - 50, "Portfolio Report")
        
        # Timestamp
        c.setFont("Helvetica", 10)
        c.drawString(50, height - 70, f"Generated on: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC")

        # Table Headers
        y = height - 110
        c.setFont("Helvetica-Bold", 12)
        c.drawString(50, y, "Ticker")
        c.drawString(150, y, "Quantity")
        c.drawString(250, y, "Current Price")
        c.drawString(350, y, "Total Value")
        
        c.line(50, y - 5, 450, y - 5)
        y -= 25

        # Table Content
        holdings = Holding.query.all()
        total_portfolio_value = 0.0
        c.setFont("Helvetica", 12)

        for h in holdings:
            stock = get_stock_data(h.ticker)
            price = stock.get("price", 0)
            if not isinstance(price, (int, float)): 
                price = 0.0
            
            value = price * h.quantity
            total_portfolio_value += value

            c.drawString(50, y, h.ticker)
            c.drawString(150, y, str(h.quantity))
            c.drawString(250, y, f"${price:.2f}")
            c.drawString(350, y, f"${value:,.2f}")
            y -= 20
            
            # Simple pagination check
            if y < 50:
                c.showPage()
                y = height - 50

        # Total
        y -= 10
        c.line(50, y + 25, 450, y + 25)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(250, y, "Total Portfolio Value:")
        c.drawString(390, y, f"${total_portfolio_value:,.2f}")

        c.save()
        buffer.seek(0)
        
        return send_file(
            buffer,
            as_attachment=True,
            download_name=f"portfolio_report_{datetime.now().date()}.pdf",
            mimetype='application/pdf'
        )

    except Exception as e:
        traceback.print_exc()
        return f"Error generating report: {e}", 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=DEBUG_MODE)