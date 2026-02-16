import os
import traceback
from typing import TypedDict
from dotenv import load_dotenv

# LangGraph & LangChain Imports
from langgraph.graph import StateGraph, END
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace

# 1. Load Environment Variables
# We explicitly look for the .env file in the current folder
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

HF_TOKEN = os.getenv("HF_KEY") or os.getenv("HF_TOKEN")

# DEBUG CHECK: Print status to terminal
if not HF_TOKEN:
    print("❌ ERROR: HF_TOKEN is missing! Make sure .env is in the 'backend' folder.")
else:
    print(f"✅ Found HF_TOKEN: {HF_TOKEN[:4]}...****")

# Configuration
REPO_ID = "HuggingFaceH4/zephyr-7b-beta"

# Initialize the LLM
try:
    if not HF_TOKEN:
        raise ValueError("No API Token found.")

    endpoint = HuggingFaceEndpoint(
        repo_id=REPO_ID,
        task="text-generation",
        max_new_tokens=512,
        do_sample=True,
        temperature=0.3,
        huggingfacehub_api_token=HF_TOKEN
    )
    
    llm = ChatHuggingFace(llm=endpoint)
    print(f"✅ LangGraph Chat Agent initialized with {REPO_ID}")

except Exception as e:
    print(f"❌ Failed to initialize Agent: {e}")
    llm = None

# 2. Define the State
class AgentState(TypedDict):
    ticker: str
    stock_data: dict
    draft_analysis: str
    final_output: str

# 3. Node 1: The Analyst
def analyst_node(state: AgentState):
    print(f"--- 🧠 Analyst Node: Processing {state['ticker']} ---")
    data = state['stock_data']
    
    messages = [
        SystemMessage(content="You are a Senior Financial Analyst."),
        HumanMessage(content=f"""
        Write a concise investment memo for {state['ticker']}.
        
        Data:
        - Price: ${data.get('price')}
        - P/E Ratio: {data.get('pe_ratio')}
        - Beta: {data.get('beta')}
        
        Task: Analyze these numbers. Is it overvalued? Provide a 'Buy', 'Hold', or 'Sell' thesis.
        """)
    ]
    
    try:
        response = llm.invoke(messages)
        content = response.content
    except Exception as e:
        print(f"❌ ANALYST ERROR: {e}")
        content = "Analysis unavailable due to API error."
    
    return {"draft_analysis": content}

# 4. Node 2: The Risk Manager
def risk_node(state: AgentState):
    print("--- 🛡️ Risk Node: Reviewing Draft ---")
    data = state['stock_data']
    draft = state['draft_analysis']
    
    beta = data.get('beta')
    warning = ""
    
    if beta == "N/A":
        warning = "\n\n⚠️ RISK ALERT: Volatility data is missing."
    elif isinstance(beta, (int, float)) and beta > 1.5:
        warning = "\n\n⚠️ HIGH VOLATILITY WARNING: This stock moves significantly more than the market."
    
    final_text = draft + warning
    return {"final_output": final_text}

# 5. Build the Graph
workflow = StateGraph(AgentState)
workflow.add_node("analyst", analyst_node)
workflow.add_node("risk_manager", risk_node)
workflow.set_entry_point("analyst")
workflow.add_edge("analyst", "risk_manager")
workflow.add_edge("risk_manager", END)
app = workflow.compile()

# 6. Public Function
def run_financial_graph(ticker, stock_data):
    if not llm:
        return "Error: AI Agent not initialized. Check HF_KEY."

    try:
        inputs = {"ticker": ticker, "stock_data": stock_data}
        result = app.invoke(inputs)
        return result['final_output']
    except Exception as e:
        print(f"❌ GRAPH ERROR: {e}")
        return f"Agent Workflow Failed: {str(e)}"