/**
 * pdfReport.ts — Professional portfolio PDF report generation
 * Uses pdf-lib (pure JS, Vercel-compatible) to generate a rich PDF report.
 */

import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from "pdf-lib";

export interface HoldingRow {
  ticker: string;
  quantity: number;
  price: number;
  value: number;
}

// Color palette
const COLORS = {
  primary: rgb(0.09, 0.11, 0.18),       // dark navy
  accent: rgb(0.13, 0.53, 0.93),         // blue
  accentLight: rgb(0.13, 0.83, 0.93),    // cyan
  text: rgb(0.15, 0.15, 0.15),
  textLight: rgb(0.4, 0.4, 0.45),
  border: rgb(0.85, 0.85, 0.88),
  bgLight: rgb(0.96, 0.97, 0.98),
  white: rgb(1, 1, 1),
  green: rgb(0.13, 0.59, 0.33),
  red: rgb(0.8, 0.2, 0.2),
};

// Helper: draw text right-aligned
function drawTextRight(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  color = COLORS.text
) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: x - width, y, size, font, color });
}

export async function generatePortfolioPdf(
  holdings: HoldingRow[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // US Letter
  const { width, height } = page.getSize();

  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const oblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const margin = 50;
  const contentWidth = width - margin * 2;
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  let y = height - margin;

  // ─── Header Bar ───
  page.drawRectangle({
    x: 0,
    y: height - 80,
    width,
    height: 80,
    color: COLORS.primary,
  });

  page.drawText("FinAnalyst Pro", {
    x: margin,
    y: height - 35,
    size: 20,
    font: bold,
    color: COLORS.white,
  });

  page.drawText("Portfolio Report", {
    x: margin,
    y: height - 55,
    size: 11,
    font: regular,
    color: rgb(0.6, 0.7, 0.85),
  });

  drawTextRight(page, dateStr, width - margin, height - 35, regular, 10, rgb(0.6, 0.7, 0.85));
  drawTextRight(page, timeStr, width - margin, height - 50, regular, 9, rgb(0.5, 0.6, 0.7));

  y = height - 110;

  // ─── Portfolio Summary ───
  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
  const numPositions = holdings.length;
  const topHolding = holdings.length > 0
    ? holdings.reduce((a, b) => (a.value > b.value ? a : b))
    : null;

  page.drawText("Portfolio Summary", {
    x: margin,
    y,
    size: 14,
    font: bold,
    color: COLORS.text,
  });
  y -= 8;

  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: COLORS.accent,
  });
  y -= 22;

  // Summary boxes — 3 columns
  const boxWidth = (contentWidth - 20) / 3;
  const boxes = [
    {
      label: "Total Value",
      value: `$${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    { label: "Positions", value: String(numPositions) },
    {
      label: "Top Holding",
      value: topHolding
        ? `${topHolding.ticker} (${totalValue > 0 ? ((topHolding.value / totalValue) * 100).toFixed(1) : 0}%)`
        : "N/A",
    },
  ];

  boxes.forEach((box, i) => {
    const bx = margin + i * (boxWidth + 10);

    // Background
    page.drawRectangle({
      x: bx,
      y: y - 30,
      width: boxWidth,
      height: 50,
      color: COLORS.bgLight,
      borderColor: COLORS.border,
      borderWidth: 0.5,
    });

    // Label
    page.drawText(box.label.toUpperCase(), {
      x: bx + 12,
      y: y + 6,
      size: 7,
      font: bold,
      color: COLORS.textLight,
    });

    // Value
    page.drawText(box.value, {
      x: bx + 12,
      y: y - 14,
      size: 14,
      font: bold,
      color: COLORS.text,
    });
  });

  y -= 55;

  // ─── Holdings Table ───
  y -= 10;
  page.drawText("Holdings Breakdown", {
    x: margin,
    y,
    size: 14,
    font: bold,
    color: COLORS.text,
  });
  y -= 8;

  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: COLORS.accent,
  });
  y -= 22;

  // Table columns
  const colX = {
    ticker: margin + 10,
    qty: margin + 110,
    price: margin + 210,
    value: margin + 340,
    alloc: width - margin - 10,
  };

  // Table header background
  page.drawRectangle({
    x: margin,
    y: y - 6,
    width: contentWidth,
    height: 24,
    color: COLORS.bgLight,
  });

  const headerY = y;
  page.drawText("TICKER", { x: colX.ticker, y: headerY, size: 8, font: bold, color: COLORS.textLight });
  page.drawText("QTY", { x: colX.qty, y: headerY, size: 8, font: bold, color: COLORS.textLight });
  page.drawText("PRICE", { x: colX.price, y: headerY, size: 8, font: bold, color: COLORS.textLight });
  page.drawText("VALUE", { x: colX.value, y: headerY, size: 8, font: bold, color: COLORS.textLight });
  drawTextRight(page, "ALLOC %", colX.alloc, headerY, bold, 8, COLORS.textLight);

  y -= 28;

  // Table rows
  for (const h of holdings) {
    const allocPct = totalValue > 0 ? ((h.value / totalValue) * 100).toFixed(1) + "%" : "0%";

    // Alternating row background
    if (holdings.indexOf(h) % 2 === 0) {
      page.drawRectangle({
        x: margin,
        y: y - 6,
        width: contentWidth,
        height: 24,
        color: rgb(0.98, 0.98, 0.99),
      });
    }

    page.drawText(h.ticker, { x: colX.ticker, y, size: 11, font: bold, color: COLORS.accent });
    page.drawText(String(h.quantity), { x: colX.qty, y, size: 11, font: regular, color: COLORS.text });
    page.drawText(`$${h.price.toFixed(2)}`, { x: colX.price, y, size: 11, font: regular, color: COLORS.text });
    page.drawText(
      `$${h.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      { x: colX.value, y, size: 11, font: regular, color: COLORS.text }
    );
    drawTextRight(page, allocPct, colX.alloc, y, regular, 11, COLORS.textLight);

    y -= 26;
  }

  // Bottom divider
  y -= 4;
  page.drawLine({
    start: { x: margin, y: y + 20 },
    end: { x: width - margin, y: y + 20 },
    thickness: 0.5,
    color: COLORS.border,
  });

  // Total row
  page.drawText("TOTAL", { x: colX.ticker, y, size: 11, font: bold, color: COLORS.text });
  page.drawText(
    `$${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    { x: colX.value, y, size: 11, font: bold, color: COLORS.text }
  );
  drawTextRight(page, "100%", colX.alloc, y, bold, 11, COLORS.text);

  y -= 40;

  // ─── Allocation Summary ───
  if (holdings.length > 0) {
    page.drawText("Allocation Overview", {
      x: margin,
      y,
      size: 14,
      font: bold,
      color: COLORS.text,
    });
    y -= 8;

    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 1,
      color: COLORS.accent,
    });
    y -= 22;

    // Horizontal bar chart
    const barHeight = 18;
    const barMaxWidth = contentWidth - 120;
    const sortedHoldings = [...holdings].sort((a, b) => b.value - a.value);

    for (const h of sortedHoldings) {
      const pct = totalValue > 0 ? h.value / totalValue : 0;
      const barWidth = Math.max(barMaxWidth * pct, 2);

      // Ticker label
      page.drawText(h.ticker, { x: margin, y: y + 3, size: 10, font: bold, color: COLORS.text });

      // Bar background
      page.drawRectangle({
        x: margin + 55,
        y: y - 1,
        width: barMaxWidth,
        height: barHeight,
        color: COLORS.bgLight,
      });

      // Bar fill
      page.drawRectangle({
        x: margin + 55,
        y: y - 1,
        width: barWidth,
        height: barHeight,
        color: COLORS.accent,
      });

      // Percentage
      drawTextRight(
        page,
        `${(pct * 100).toFixed(1)}%`,
        width - margin,
        y + 3,
        regular,
        10,
        COLORS.textLight
      );

      y -= barHeight + 8;
    }
  }

  // ─── Footer ───
  y = margin + 40;

  page.drawLine({
    start: { x: margin, y: y + 10 },
    end: { x: width - margin, y: y + 10 },
    thickness: 0.5,
    color: COLORS.border,
  });

  page.drawText(
    "This report is generated by FinAnalyst Pro for informational purposes only.",
    { x: margin, y: y - 5, size: 8, font: oblique, color: COLORS.textLight }
  );
  page.drawText(
    "It does not constitute financial advice. Always consult a qualified financial advisor before making investment decisions.",
    { x: margin, y: y - 17, size: 8, font: oblique, color: COLORS.textLight }
  );

  drawTextRight(
    page,
    `Generated by FinAnalyst Pro • ${dateStr}`,
    width - margin,
    margin + 5,
    regular,
    7,
    COLORS.textLight
  );

  return pdfDoc.save();
}
