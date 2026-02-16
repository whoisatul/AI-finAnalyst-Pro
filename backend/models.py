from extensions import db
from datetime import datetime

class Holding(db.Model):
    __tablename__ = 'holdings'  # Name of the table in the database
    # Primary key to uniquely identify each holding record
    id = db.Column(db.Integer, primary_key=True)
    # Stock ticker symbol (e.g., AAPL, TSLA)
    # Indexed for faster lookup and unique to avoid duplicate entries
    ticker = db.Column(db.String(16), nullable=False, unique=True, index=True)
    # Quantity of shares owned by the user
    # Default is 0.0 to avoid null or missing entries
    quantity = db.Column(db.Float, nullable=False, default=0.0)
    # Representation method for debugging and logging
    def __repr__(self):
        return f"<Holding {self.ticker} x {self.quantity}>"

class AnalysisHistory(db.Model):
    __tablename__ = 'analysis_history'  # Table name in the database
    # Primary key for unique identification
    id = db.Column(db.Integer, primary_key=True)
    # Stock ticker symbol associated with this analysis
    ticker = db.Column(db.String(16), nullable=False, index=True)
    # The AI-generated analysis text stored as a large text field
    analysis = db.Column(db.Text, nullable=False)
    # Timestamp when this analysis was created
    # Automatically set to the current UTC time
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    # Representation method for debugging and logging
    def __repr__(self):
        return f"<AnalysisHistory {self.ticker} @ {self.created_at.isoformat()}>"