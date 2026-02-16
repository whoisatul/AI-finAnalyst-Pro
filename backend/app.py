import os
import traceback
import json
from datetime import datetime
from io import BytesIO
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS  # <--- Ensure this is enabled
from dotenv import load_dotenv

# ReportLab imports for PDF generation
# NOTE: Run 'pip install reportlab' if you haven't yet
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

# Local imports
from extensions import db
from models import Holding, AnalysisHistory
from utils import get_stock_data
from graph_agent import run_financial_graph

# ---------------------------------------------------------------------
# Environment Configuration
# ---------------------------------------------------------------------
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "CHANGE_THIS_TO_A_RANDOM_VALUE")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///finance.db")
PORT = int(os.getenv("PORT", 5001)) # Default to 5001 to avoid conflict with Next.js (3000)
DEBUG_MODE = os.getenv("FLASK_ENV") == "development"

# ---------------------------------------------------------------------
# Flask Application Setup
# ---------------------------------------------------------------------
app = Flask(__name__)
CORS(app)  # <--- Crucial for Next.js to talk to Flask

app.config.update(
    SECRET_KEY=SECRET_KEY,
    SQLALCHEMY_DATABASE_URI=DATABASE_URL,
    SQLALCHEMY_TRACK_MODIFICATIONS=False,
)

db.init_app(app)

# Create tables if they don't exist
with app.app_context():
    db.create_all()

# ---------------------------------------------------------------------
# API Routes (JSON Only)
# ---------------------------------------------------------------------

@app.route('/api/analyze', methods=['POST'])
def analyze_api():
    data = request.get_json()
    ticker = data.get('ticker')
    
    if not ticker:
        return jsonify({"error": "No ticker provided"}), 400

    try:
        # 1. Fetch Real Data
        stock_data = get_stock_data(ticker)
        
        # 2. Run AI Analysis
        ai_analysis = run_financial_graph(ticker, stock_data)
        
        # 3. Save to Database
        new_analysis = AnalysisHistory(
            ticker=ticker,
            analysis=ai_analysis
        )
        db.session.add(new_analysis)
        db.session.commit()

        # 4. Return Data
        return jsonify({
            "company": stock_data.get('company', ticker),
            "ticker": ticker,
            "price": stock_data.get('price'),
            "change_pct": stock_data.get('change_pct'),
            "pe_ratio": stock_data.get('pe_ratio'),
            "beta": stock_data.get('beta'),
            "insight": ai_analysis,
            "history_json": stock_data.get('history_json', [])
        })
    except Exception as e:
        print(f"Error in analysis: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/portfolio', methods=['GET'])
def portfolio_api():
    try:
        holdings = Holding.query.all()
        portfolio_data = []
        total_value = 0.0

        for h in holdings:
            stock_data = get_stock_data(h.ticker)
            current_price = stock_data.get('price', 0.0)
            position_value = current_price * h.quantity
            
            portfolio_data.append({
                "id": h.id,
                "ticker": h.ticker,
                "quantity": h.quantity,
                "price": current_price,
                "value": round(position_value, 2)
            })
            total_value += position_value

        return jsonify({
            "holdings": portfolio_data,
            "total_value": round(total_value, 2)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/portfolio/add', methods=['POST'])
def add_portfolio_api():
    try:
        data = request.get_json()
        ticker = data.get('ticker').upper()
        quantity = float(data.get('quantity'))
        
        existing = Holding.query.filter_by(ticker=ticker).first()
        if existing:
            existing.quantity += quantity
        else:
            new_holding = Holding(ticker=ticker, quantity=quantity)
            db.session.add(new_holding)
        
        db.session.commit()
        return jsonify({"message": "Added successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/portfolio/delete', methods=['POST'])
def delete_portfolio_api():
    try:
        data = request.get_json()
        ticker = data.get('ticker')
        
        holding = Holding.query.filter_by(ticker=ticker).first()
        if holding:
            db.session.delete(holding)
            db.session.commit()
            return jsonify({"message": "Deleted"})
        
        return jsonify({"error": "Stock not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/history', methods=['GET'])
def history_api():
    try:
        records = AnalysisHistory.query.order_by(AnalysisHistory.created_at.desc()).limit(20).all()
        data = []
        for r in records:
            data.append({
                "id": r.id,
                "ticker": r.ticker,
                "analysis": r.analysis,
                "date": r.created_at.strftime('%Y-%m-%d %H:%M')
            })
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/portfolio/report")
def portfolio_report():
    """Generates PDF. NOTE: Frontend calls this URL directly to download."""
    try:
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter

        # PDF Header
        c.setFont("Helvetica-Bold", 18)
        c.drawString(50, height - 50, "Portfolio Report")
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

        # Content
        holdings = Holding.query.all()
        total_portfolio_value = 0.0
        c.setFont("Helvetica", 12)

        for h in holdings:
            stock = get_stock_data(h.ticker)
            price = stock.get("price", 0) or 0.0
            value = price * h.quantity
            total_portfolio_value += value

            c.drawString(50, y, h.ticker)
            c.drawString(150, y, str(h.quantity))
            c.drawString(250, y, f"${price:.2f}")
            c.drawString(350, y, f"${value:,.2f}")
            y -= 20

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
        return jsonify({"error": f"Error generating report: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=DEBUG_MODE)