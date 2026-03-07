-- CreateTable
CREATE TABLE "holdings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ticker" TEXT NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 0.0
);

-- CreateTable
CREATE TABLE "analysis_history" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ticker" TEXT NOT NULL,
    "analysis" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "holdings_ticker_key" ON "holdings"("ticker");
