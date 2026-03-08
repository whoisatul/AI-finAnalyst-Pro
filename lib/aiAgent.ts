/**
 * aiAgent.ts — TypeScript port of backend/graph_agent.py
 * 
 * Uses @langchain/langgraph StateGraph with 3 nodes:
 *   news_scout -> analyst -> risk_manager -> END
 * 
 * LLM: HuggingFace Inference API (zephyr-7b-beta) via @langchain/community
 * Search: DuckDuckGo via @langchain/community DuckDuckGoSearch tool
 */

import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { HfInference } from "@huggingface/inference";
import { DuckDuckGoSearch } from "@langchain/community/tools/duckduckgo_search";


// ─────────────────────────────────────────────────────────────────────────────
// 1. State Definition (mirrors Python TypedDict AgentState)
// ─────────────────────────────────────────────────────────────────────────────
const AgentState = Annotation.Root({
    ticker: Annotation<string>({ reducer: (_prev, next) => next }),
    stockData: Annotation<Record<string, unknown>>({ reducer: (_prev, next) => next }),
    newsSummary: Annotation<string>({ reducer: (_prev, next) => next, default: () => "" }),
    draftAnalysis: Annotation<string>({ reducer: (_prev, next) => next, default: () => "" }),
    finalOutput: Annotation<string>({ reducer: (_prev, next) => next, default: () => "" }),
});

type AgentStateType = typeof AgentState.State;

// ─────────────────────────────────────────────────────────────────────────────
// 2. Initialize Tools & LLM (module-level, cached across requests in dev)
// ─────────────────────────────────────────────────────────────────────────────
const HF_TOKEN = process.env.HF_KEY;
let llm: HfInference | null = null;
let searchTool: DuckDuckGoSearch | null = null;

function getAgent() {
    if (!HF_TOKEN) {
        console.error("❌ ERROR: HF_KEY is missing! Make sure .env.local is configured.");
        return null;
    }

    if (!llm) {
        try {
            llm = new HfInference(HF_TOKEN);
            console.log("✅ HuggingFace LLM initialized (Llama-3.2-1B via Chat Completion)");
        } catch (e) {
            console.error("❌ Failed to initialize LLM:", e);
            return null;
        }
    }

    if (!searchTool) {
        searchTool = new DuckDuckGoSearch({ maxResults: 5 });
        console.log("✅ DuckDuckGoSearch tool initialized");
    }

    return { llm, searchTool };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. NODE 1 — News Scout (mirrors news_node in Python)
// ─────────────────────────────────────────────────────────────────────────────
async function newsScoutNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
    const { ticker } = state;
    console.log(`--- 🌎 News Scout: Searching for ${ticker} ---`);

    const agent = getAgent();
    if (!agent) return { newsSummary: "No news available (agent not initialized)." };

    try {
        const year = new Date().getFullYear();
        const query = `latest financial news stock analysis ${ticker} ${year}`;
        const results = await agent.searchTool!.invoke(query);
        console.log(`   Found: ${String(results).slice(0, 100)}...`);
        return { newsSummary: String(results) };
    } catch (err) {
        console.warn(`   Search failed: ${err}`);
        return { newsSummary: "No recent news available. Rely strictly on technical data." };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. NODE 2 — Analyst (mirrors analyst_node in Python)
// ─────────────────────────────────────────────────────────────────────────────
async function analystNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
    console.log(`--- 🧠 Analyst Node: Processing ${state.ticker} ---`);

    const agent = getAgent();
    if (!agent) return { draftAnalysis: "Analysis unavailable: LLM not initialized." };

    const { ticker, stockData, newsSummary } = state;
    const today = new Date().toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
    });

    const systemContent = "You are a Senior Financial Analyst at a top Wall Street firm.";
    const userContent = `Write a professional investment memo for ${ticker}.

CONTEXT:
- Report Date: ${today}
- Latest News Headlines: ${newsSummary}

FINANCIAL DATA:
- Price: $${stockData.price}
- P/E Ratio: ${stockData.pe_ratio}
- Beta: ${stockData.beta}

INSTRUCTIONS:
1. Start with an "Executive Summary" (Buy/Hold/Sell recommendation).
2. Analyze "Market Sentiment" based on the provided news.
3. Evaluate "Fundamentals" based on the P/E and Beta.
4. Mention specific news events if relevant.
5. End with a "Conclusion" and actionable "Recommendations".
6. Do NOT include any placeholders like "[Your Name]", "[Your Firm]", "[Insert Date]", "Prepared by", or contact info. This is a system-generated report.
7. Use the exact date provided above. Do NOT make up dates.
8. Keep the report concise and professional. Use markdown formatting.`;

    try {
        const response = await agent.llm!.chatCompletion({
            model: "Qwen/Qwen2.5-7B-Instruct",
            messages: [
                { role: "system", content: systemContent },
                { role: "user", content: userContent }
            ],
            max_tokens: 1024,
            temperature: 0.4,
        });
        return { draftAnalysis: response.choices[0].message.content! };
    } catch (err) {
        console.error("❌ ANALYST ERROR:", err);
        return { draftAnalysis: "Analysis unavailable due to API error." };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. NODE 3 — Risk Manager (mirrors risk_node in Python)
// ─────────────────────────────────────────────────────────────────────────────
async function riskManagerNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
    console.log("--- 🛡️ Risk Manager: Reviewing Draft ---");

    const beta = state.stockData?.beta;
    let warning = "";

    if (typeof beta === "number") {
        if (beta > 1.5) {
            warning = "\n\n---\n\n**RISK NOTICE:** High Volatility (Beta > 1.5). Consider limiting position size and implementing stop-loss orders.";
        } else if (beta < 0.8) {
            warning = "\n\n---\n\n**DEFENSIVE PLAY:** Low Volatility (Beta < 0.8). Suitable for conservative portfolios seeking stability.";
        }
    }

    return { finalOutput: state.draftAnalysis + warning };
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Build & Compile the Graph (mirrors StateGraph in Python)
// ─────────────────────────────────────────────────────────────────────────────
const workflow = new StateGraph(AgentState);

workflow.addNode("news_scout", newsScoutNode);
workflow.addNode("analyst", analystNode);
workflow.addNode("risk_manager", riskManagerNode);

// Explicitly type START to bypass TS over-constraining the node names
workflow.addEdge(START as any, "news_scout" as any);
workflow.addEdge("news_scout" as any, "analyst" as any);
workflow.addEdge("analyst" as any, "risk_manager" as any);
workflow.addEdge("risk_manager" as any, END as any);

const compiledGraph = workflow.compile();

// ─────────────────────────────────────────────────────────────────────────────
// 7. Public function (mirrors run_financial_graph in Python)
// ─────────────────────────────────────────────────────────────────────────────
export async function runFinancialGraph(
    ticker: string,
    stockData: Record<string, unknown>
): Promise<string> {
    if (!HF_TOKEN) {
        return "Error: AI Agent not initialized. Check HF_KEY in .env.local";
    }

    try {
        const inputs: AgentStateType = {
            ticker,
            stockData,
            newsSummary: "",
            draftAnalysis: "",
            finalOutput: "",
        };
        const result = await compiledGraph.invoke(inputs);
        return result.finalOutput || "Agent returned empty output.";
    } catch (err) {
        console.error("❌ GRAPH ERROR:", err);
        return `Agent Workflow Failed: ${String(err)}`;
    }
}
