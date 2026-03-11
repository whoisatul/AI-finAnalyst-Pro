-- CreateTable
CREATE TABLE "holdings" (
    "id" SERIAL NOT NULL,
    "ticker" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "holdings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analysis_history" (
    "id" SERIAL NOT NULL,
    "ticker" TEXT NOT NULL,
    "analysis" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analysis_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "holdings_ticker_key" ON "holdings"("ticker");
