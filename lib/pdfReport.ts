/**
 * pdfReport.ts — Port of the /portfolio/report Flask endpoint
 * Uses pdf-lib (pure JS, Vercel-compatible) to generate a PDF report.
 */

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export interface HoldingRow {
  ticker: string;
  quantity: number;
  price: number;
  value: number;
}

export async function generatePortfolioPdf(
  holdings: HoldingRow[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // letter size
  const { height } = page.getSize();

  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const now = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

  // Header
  page.drawText("Portfolio Report", {
    x: 50,
    y: height - 50,
    size: 18,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  page.drawText(`Generated on: ${now}`, {
    x: 50,
    y: height - 70,
    size: 10,
    font: regularFont,
  });

  // Column headers
  let y = height - 110;
  const cols = { ticker: 50, quantity: 150, price: 250, value: 350 };
  const headers = ["Ticker", "Quantity", "Current Price", "Total Value"];
  const xPositions = [cols.ticker, cols.quantity, cols.price, cols.value];

  headers.forEach((h, i) => {
    page.drawText(h, { x: xPositions[i], y, size: 12, font: boldFont });
  });

  // Divider line
  page.drawLine({
    start: { x: 50, y: y - 6 },
    end: { x: 450, y: y - 6 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  y -= 25;
  let totalValue = 0;

  // Rows
  for (const h of holdings) {
    totalValue += h.value;
    page.drawText(h.ticker, { x: cols.ticker, y, size: 12, font: regularFont });
    page.drawText(String(h.quantity), { x: cols.quantity, y, size: 12, font: regularFont });
    page.drawText(`$${h.price.toFixed(2)}`, { x: cols.price, y, size: 12, font: regularFont });
    page.drawText(`$${h.value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`, {
      x: cols.value,
      y,
      size: 12,
      font: regularFont,
    });
    y -= 20;
  }

  // Total row
  y -= 10;
  page.drawLine({
    start: { x: 50, y: y + 15 },
    end: { x: 450, y: y + 15 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  page.drawText("Total Portfolio Value:", { x: cols.price, y, size: 12, font: boldFont });
  page.drawText(
    `$${totalValue.toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
    { x: cols.value, y, size: 12, font: boldFont }
  );

  return pdfDoc.save();
}
