import os
import datetime
import traceback
from typing import TypedDict
from dotenv import load_dotenv

# LangGraph & LangChain Imports
from langgraph.graph import StateGraph, END
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace
from langchain_community.tools import DuckDuckGoSearchRun # <--- The "Eyes" of the Agent

# 1. Load Environment Variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

HF_TOKEN = os.getenv("HF_KEY") or os.getenv("HF_TOKEN")

# DEBUG CHECK
if not HF_TOKEN:
    print("❌ ERROR: HF_TOKEN is missing! Make sure .env is in the 'backend' folder.")
else:
    print(f"✅ Found HF_TOKEN: {HF_TOKEN[:4]}...****")

# Configuration
REPO_ID = "HuggingFaceH4/zephyr-7b-beta"
# Alternative if Zephyr fails: "microsoft/Phi-3.5-mini-instruct"

# Initialize Search Tool
search_tool = DuckDuckGoSearchRun()

# Initialize LLM
try:
    if not HF_TOKEN:
        raise ValueError("No API Token found.")

    endpoint = HuggingFaceEndpoint(
        repo_id=REPO_ID,
        task="text-generation",
        max_new_tokens=1024, # Increased for longer, detailed reports
        do_sample=True,
        temperature=0.4,
        huggingfacehub_api_token=HF_TOKEN
    )
    
    llm = ChatHuggingFace(llm=endpoint)
    print(f"✅ LangGraph Agent initialized with {REPO_ID}")

except Exception as e:
    print(f"❌ Failed to initialize Agent: {e}")
    llm = None

# 2. Define the State (Added 'news_summary')
class AgentState(TypedDict):
    ticker: str
    stock_data: dict
    news_summary: str   # <--- New memory slot
    draft_analysis: str
    final_output: str

# 3. NODE 1: The News Scout (New!)
def news_node(state: AgentState):
    ticker = state['ticker']
    print(f"--- 🌎 News Scout: Searching for {ticker} ---")
    
    try:
        # We add the current year to ensure fresh results
        current_year = datetime.date.today().year
        query = f"latest financial news stock analysis {ticker} {current_year}"
        
        # Perform the search
        results = search_tool.invoke(query)
        print(f"   found: {results[:100]}...") # Print first 100 chars to log
        
    except Exception as e:
        print(f"   Search failed: {e}")
        results = "No recent news available. Rely strictly on technical data."
    
    return {"news_summary": results}

# 4. NODE 2: The Analyst (Updated to use News)
def analyst_node(state: AgentState):
    print(f"--- 🧠 Analyst Node: Processing {state['ticker']} ---")
    data = state['stock_data']
    news = state['news_summary']
    today = datetime.date.today().strftime("%B %d, %Y") # Real Date
    
    messages = [
        SystemMessage(content="You are a Senior Financial Analyst at a top Wall Street firm."),
        HumanMessage(content=f"""
        Write a professional investment memo for {state['ticker']}.
        
        CONTEXT:
        - Report Date: {today}
        - Latest News Headlines: {news}
        
        FINANCIAL DATA:
        - Price: ${data.get('price')}
        - P/E Ratio: {data.get('pe_ratio')}
        - Beta: {data.get('beta')}
        
        INSTRUCTIONS:
        1. Start with an "Executive Summary" (Buy/Hold/Sell).
        2. Analyze "Market Sentiment" based on the provided news.
        3. Evaluate "Fundamentals" based on the P/E and Beta.
        4. Mention specific news events if relevant.
        5. Do NOT use placeholders like "[Insert Date]". Use the date provided above.
        """)
    ]
    
    try:
        response = llm.invoke(messages)
        content = response.content
    except Exception as e:
        print(f"❌ ANALYST ERROR: {e}")
        content = "Analysis unavailable due to API error."
    
    return {"draft_analysis": content}

# 5. NODE 3: The Risk Manager
def risk_node(state: AgentState):
    print("--- 🛡️ Risk Node: Reviewing Draft ---")
    data = state['stock_data']
    draft = state['draft_analysis']
    
    beta = data.get('beta')
    warning = ""
    
    if isinstance(beta, (int, float)):
        if beta > 1.5:
            warning = "\n\n⚠️ RISK NOTICE: High Volatility (Beta > 1.5). Limit position size."
        elif beta < 0.8:
            warning = "\n\nℹ️ DEFENSIVE PLAY: Low Volatility (Beta < 0.8). Good for stability."
    
    final_text = draft + warning
    return {"final_output": final_text}

# 6. Build the Graph
workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("news_scout", news_node) # <--- Added
workflow.add_node("analyst", analyst_node)
workflow.add_node("risk_manager", risk_node)

# Connect Edges (News -> Analyst -> Risk -> End)
workflow.set_entry_point("news_scout")
workflow.add_edge("news_scout", "analyst")
workflow.add_edge("analyst", "risk_manager")
workflow.add_edge("risk_manager", END)

app = workflow.compile()

# 7. Public Function
def run_financial_graph(ticker, stock_data):
    if not llm:
        return "Error: AI Agent not initialized. Check HF_KEY."

    try:
        inputs = {
            "ticker": ticker, 
            "stock_data": stock_data,
            "news_summary": "" # Start empty, Scout will fill it
        }
        result = app.invoke(inputs)
        return result['final_output']
    except Exception as e:
        print(f"❌ GRAPH ERROR: {e}")
        traceback.print_exc()
        return f"Agent Workflow Failed: {str(e)}"