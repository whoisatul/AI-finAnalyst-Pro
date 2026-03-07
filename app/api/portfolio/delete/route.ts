import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ticker: string = body.ticker?.toString().toUpperCase();

    if (!ticker) {
      return NextResponse.json({ error: "No ticker provided" }, { status: 400 });
    }

    const holding = await prisma.holding.findUnique({ where: { ticker } });
    if (!holding) {
      return NextResponse.json({ error: "Stock not found" }, { status: 404 });
    }

    await prisma.holding.delete({ where: { ticker } });
    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    console.error("Error in POST /api/portfolio/delete:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
