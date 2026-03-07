import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStockData } from "@/lib/stockData";

export async function GET() {
  try {
    const holdings = await prisma.holding.findMany();

    let totalValue = 0;
    const portfolioData = await Promise.all(
      holdings.map(async (h) => {
        const stockData = await getStockData(h.ticker);
        const currentPrice = stockData.price ?? 0;
        const positionValue = parseFloat((currentPrice * h.quantity).toFixed(2));
        totalValue += positionValue;

        return {
          id: h.id,
          ticker: h.ticker,
          quantity: h.quantity,
          price: currentPrice,
          value: positionValue,
        };
      })
    );

    return NextResponse.json({
      holdings: portfolioData,
      total_value: parseFloat(totalValue.toFixed(2)),
    });
  } catch (err) {
    console.error("Error in GET /api/portfolio:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
