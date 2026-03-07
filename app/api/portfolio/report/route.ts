import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStockData } from "@/lib/stockData";
import { generatePortfolioPdf } from "@/lib/pdfReport";

export async function GET() {
  try {
    const holdings = await prisma.holding.findMany();

    const rows = await Promise.all(
      holdings.map(async (h) => {
        const stock = await getStockData(h.ticker);
        const price = stock.price ?? 0;
        return {
          ticker: h.ticker,
          quantity: h.quantity,
          price,
          value: parseFloat((price * h.quantity).toFixed(2)),
        };
      })
    );

    const pdfBytes = await generatePortfolioPdf(rows);
    const buffer = Buffer.from(pdfBytes);

    const today = new Date().toISOString().split("T")[0];
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="portfolio_report_${today}.pdf"`,
      },
    });
  } catch (err) {
    console.error("Error in GET /api/portfolio/report:", err);
    return NextResponse.json(
      { error: `Error generating report: ${String(err)}` },
      { status: 500 }
    );
  }
}
