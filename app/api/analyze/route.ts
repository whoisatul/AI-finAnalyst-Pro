import { NextRequest, NextResponse } from "next/server";
import { getStockData } from "@/lib/stockData";
import { runFinancialGraph } from "@/lib/aiAgent";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ticker: string = body.ticker?.toString().toUpperCase();

    if (!ticker) {
      return NextResponse.json({ error: "No ticker provided" }, { status: 400 });
    }

    // 1. Fetch real stock data (via yahoo-finance2)
    const stockData = await getStockData(ticker);

    // 2. Run LangGraph AI analysis (news_scout -> analyst -> risk_manager)
    const aiAnalysis = await runFinancialGraph(ticker, stockData as unknown as Record<string, unknown>);

    // 3. Save to database
    await prisma.analysisHistory.create({
      data: { ticker, analysis: aiAnalysis },
    });

    // 4. Return JSON (same shape as Flask response)
    return NextResponse.json({
      company: stockData.company,
      ticker: stockData.ticker,
      price: stockData.price,
      change_pct: stockData.change_pct,
      pe_ratio: stockData.pe_ratio,
      beta: stockData.beta,
      insight: aiAnalysis,
      history_json: stockData.history_json,
    });
  } catch (err) {
    console.error("Error in /api/analyze:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
