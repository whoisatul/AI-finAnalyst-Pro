import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ticker: string = body.ticker?.toString().toUpperCase();
    const quantity: number = parseFloat(body.quantity);

    if (!ticker || isNaN(quantity)) {
      return NextResponse.json({ error: "Invalid ticker or quantity" }, { status: 400 });
    }

    const existing = await prisma.holding.findUnique({ where: { ticker } });

    if (existing) {
      await prisma.holding.update({
        where: { ticker },
        data: { quantity: existing.quantity + quantity },
      });
    } else {
      await prisma.holding.create({ data: { ticker, quantity } });
    }

    return NextResponse.json({ message: "Added successfully" });
  } catch (err) {
    console.error("Error in POST /api/portfolio/add:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
