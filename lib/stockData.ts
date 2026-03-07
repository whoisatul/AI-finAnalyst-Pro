import YahooFinance from "yahoo-finance2";

const yahooFinance = new (YahooFinance as any)();

interface StockData {
    ticker: string;
    company: string;
    price: number;
    change_pct: number;
    pe_ratio: number | string;
    beta: number | string;
    sector: string;
    history_json: { Date: string; Close: number }[];
}

function getMockData(ticker: string): StockData {
    console.warn(`⚠️ Generating MOCK DATA for ${ticker} (Yahoo Finance failed)`);
    const basePrice = Math.random() * 200 + 100;
    const history_json = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (30 - i));
        return {
            Date: d.toISOString().split("T")[0],
            Close: parseFloat((basePrice * (1 + (Math.random() - 0.5) * 0.1)).toFixed(2)),
        };
    });

    return {
        ticker: ticker.toUpperCase(),
        company: `${ticker} Corp (Mock)`,
        price: parseFloat(basePrice.toFixed(2)),
        change_pct: parseFloat(((Math.random() - 0.5) * 5).toFixed(2)),
        pe_ratio: parseFloat((Math.random() * 35 + 15).toFixed(2)),
        beta: parseFloat((Math.random() * 0.7 + 0.8).toFixed(2)),
        sector: "Technology (Mock)",
        history_json,
    };
}

export async function getStockData(ticker: string): Promise<StockData> {
    try {
        // Fetch 30-day historical data
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 31);

        let chart: any = { quotes: [] };
        let quoteSummary: any = { price: {}, summaryDetail: {}, defaultKeyStatistics: {} };

        try {
            [chart, quoteSummary] = await Promise.all([
                yahooFinance.chart(ticker, {
                    period1: start,
                    period2: end,
                    interval: "1d",
                }),
                yahooFinance.quoteSummary(ticker, {
                    modules: ["price", "summaryDetail", "defaultKeyStatistics"],
                }),
            ]);
        } catch (e) {
            console.error(`⚠️ Yahoo Finance API error or validation failed for ${ticker}:`, e);
            throw new Error("Yahoo Finance API Error");
        }

        const quotes = chart.quotes ?? [];
        if (quotes.length === 0) throw new Error("No price history found");

        const lastQuote = quotes[quotes.length - 1];
        const prevQuote = quotes.length > 1 ? quotes[quotes.length - 2] : null;
        const price = lastQuote.close ?? 0;
        const changePct =
            prevQuote && prevQuote.close
                ? parseFloat((((price - prevQuote.close) / prevQuote.close) * 100).toFixed(2))
                : 0;

        const qs = quoteSummary as any;
        const priceInfo = qs.price ?? {};
        const summaryDetail = qs.summaryDetail ?? {};
        const keyStats = qs.defaultKeyStatistics ?? {};

        const company =
            (priceInfo as Record<string, unknown>).longName as string ??
            (priceInfo as Record<string, unknown>).shortName as string ??
            ticker.toUpperCase();

        const peRatio =
            (summaryDetail as Record<string, unknown>).trailingPE ??
            (keyStats as Record<string, unknown>).trailingPE ??
            "N/A";

        const beta = (summaryDetail as Record<string, unknown>).beta ?? "N/A";
        const sector = "N/A"; // Yahoo Finance v2 quoteSummary doesn't always include sector in these modules

        // Build history_json compatible with the existing chart component
        const history_json = quotes
            .filter((q: any) => q.date && q.close != null)
            .map((q: any) => ({
                Date: (q.date as Date).toISOString().split("T")[0],
                Close: parseFloat((q.close as number).toFixed(2)),
            }));

        return {
            ticker: ticker.toUpperCase(),
            company: String(company),
            price: parseFloat(price.toFixed(2)),
            change_pct: changePct,
            pe_ratio: typeof peRatio === "number" ? parseFloat(peRatio.toFixed(2)) : (peRatio as string | number),
            beta: typeof beta === "number" ? parseFloat(beta.toFixed(2)) : (beta as string | number),
            sector: String(sector),
            history_json,
        };
    } catch (err) {
        console.error(`❌ [getStockData] Failed for ${ticker}:`, err);
        return getMockData(ticker);
    }
}
