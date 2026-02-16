import os
import traceback
from typing import Dict
import dspy
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------

# Load the Hugging Face Token
HF_TOKEN = os.getenv("HF_KEY") or os.getenv("HF_TOKEN")

# Model Selection:
# "huggingface/" prefix is required for DSPy 3.x to know we are using the HF API
REPO_ID = "huggingface/Qwen/Qwen2.5-7B-Instruct"

# Prompt Template
INSIGHT_PROMPT_TEMPLATE = """
You are a helpful financial analyst. Given the ticker {ticker} and the following data,
produce a concise investment analysis (3–6 short paragraphs) covering:
- recent price action summary
- key fundamental metrics (PE, beta)
- risk considerations
- investment thesis and recommended time horizon

Raw data:
{raw_summary}

Analysis:
"""

# ---------------------------------------------------------------------
# Initialize DSPy (Universal Method for v3.x)
# ---------------------------------------------------------------------
USE_AI = False
lm = None

if HF_TOKEN:
    try:
        # UPDATED: Use dspy.LM which works for version 3.0+
        lm = dspy.LM(model=REPO_ID, api_key=HF_TOKEN, temperature=0.2)
        dspy.configure(lm=lm)
        USE_AI = True
        print(f"✅ DSPy configured with model: {REPO_ID}")
    except Exception as e:
        print(f"❌ Failed to initialize AI client: {e}")
        USE_AI = False
else:
    print("⚠️ No HF_KEY found in .env. AI features will be disabled.")


# ---------------------------------------------------------------------
#  Task 4: Implement Financial Insight Generation
# ---------------------------------------------------------------------

def dsp_financial_insight(ticker: str, stock_data: Dict) -> str:
    """
    Generates a financial summary using the configured AI model.
    """
    try:
        # 1. Prepare the data string
        raw_data = {
            "company": stock_data.get("company"),
            "sector": stock_data.get("sector"),
            "price": stock_data.get("price"),
            "change_pct": stock_data.get("change_pct"),
            "pe_ratio": stock_data.get("pe_ratio"),
            "beta": stock_data.get("beta"),
        }
        raw_summary = "\n".join([f"{k}: {v}" for k, v in raw_data.items()])
        
        prompt = INSIGHT_PROMPT_TEMPLATE.format(ticker=ticker, raw_summary=raw_summary)

        # 2. Generate Insight (If AI is available)
        if USE_AI and lm:
            try:
                # Direct generation using the LM
                response = lm(prompt)
                
                # DSPy 3.x usually returns a list of strings
                if isinstance(response, list):
                    return str(response[0])
                return str(response)

            except Exception as e:
                print(f"DSPy Inference Error: {e}")
                traceback.print_exc()

        # 3. Fallback (If AI fails or key is missing)
        return (
            f"** Automated Analysis Unavailable **\n\n"
            f"**Ticker:** {ticker}\n"
            f"**Price:** ${stock_data.get('price', 'N/A')}\n"
            f"**P/E Ratio:** {stock_data.get('pe_ratio', 'N/A')}\n\n"
            f"*(System could not connect to AI Provider. Please check your HF_KEY.)*"
        )

    except Exception as e:
        traceback.print_exc()
        return f"Error generating insight: {str(e)}"