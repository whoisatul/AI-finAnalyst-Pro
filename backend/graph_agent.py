import os
import traceback
from typing import TypedDict
from dotenv import load_dotenv

# LangGraph & LangChain Imports
from langgraph.graph import StateGraph, END
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace

load_dotenv()

# 1. Configuration
HF_TOKEN = os.getenv("HF_KEY") or os.getenv("HF_TOKEN")

# We use Zephyr again, but this time via the Chat Interface
REPO_ID = "HuggingFaceH4/zephyr-7b-beta"

# Initialize the LLM
try:
    # Step 1: Create the base endpoint
    endpoint = HuggingFaceEndpoint(
        repo_id=REPO_ID,
        task="text-generation", # We keep this for the base, but wrap it below
        max_new_tokens=512,
        do_sample=True,
        temperature=0.3,
        huggingfacehub_api_token=HF_TOKEN
    )
    
    # Step 2: WRAP it in ChatHuggingFace
    # This automatically formats requests as "Conversational" for the API
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
    
    # Create a Structured Chat Message
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
        # Invoke with MESSAGES, not string
        response = llm.invoke(messages)
        content = response.content # Extract text from AI Message
    except Exception as e:
        print(f"❌ ANALYST ERROR: {e}")
        # traceback.print_exc()
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