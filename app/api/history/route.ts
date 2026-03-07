import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const records = await prisma.analysisHistory.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const data = records.map((r) => ({
      id: r.id,
      ticker: r.ticker,
      analysis: r.analysis,
      date: r.createdAt
        .toISOString()
        .replace("T", " ")
        .slice(0, 16),
    }));

    return NextResponse.json(data);
  } catch (err) {
    console.error("Error in GET /api/history:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
