<h1 align='center'>AI-FinAnalyst-Pro</h1> 

The concept of financial analysis can be overwhelming for retail investors due to the sheer volume of data, news, and complex metrics. In my opinion, making informed investment decisions requires a blend of quantitative data and qualitative insights. In this repo, I will take you through how to create a highly intelligent, agent-based financial analyst using LangGraph and Hugging Face, integrated seamlessly into a modern Next.js application.
<h3>Deployed link - </h3>

## 🔍 Overview
This project implements an **AI-driven Financial Analyst and Portfolio Dashboard**. The platform takes a stock ticker, fetches real-time market data, and uses an advanced AI pipeline to act as a virtual financial advisor, providing comprehensive analysis, risk assessment, and sentiment evaluation.
LangGraph and Hugging Face are well-suited for this problem as they allow us to build **multi-step, cognitive agent workflows** that can process numbers, scrape recent news, and generate structured, human-readable financial reports.
<div align="center">
    <img src="/public/ai_finanalyst_system_design.svg" alt="Logo" width="800" height="800">
</div>

---

## 🧠 Problem Statement
Given a stock ticker, provide a user with **real-time market data, aggregated news, and a comprehensive AI-generated financial analysis**, while also allowing them to track their personal stock portfolio and generate downloadable PDF reports.

---

## 🛠️ Tech Stack
- **Next.js 16 (React 19)** – Full-stack framework & API routes
- **Tailwind CSS v4 & Framer Motion** – UI styling and animations
- **Prisma & PostgreSQL** – Database ORM for tracking portfolios and analysis history
- **LangChain & LangGraph** – Multi-agent AI orchestration
- **Hugging Face Serverless Inference** – Open-source LLM processing (model: "deepseek-ai/DeepSeek-R1")
- **Yahoo Finance API (`yahoo-finance2`)** – Real-time market and historical data
- **Duck-Duck-Scrape** – Live news and web scraping
- **Chart.js** – Interactive financial data visualization
- **pdf-lib** – Automated PDF report generation

---

## 🔄 Project Workflow
1. User enters a stock ticker on the Next.js frontend.
2. Backend API fetches real-time quotes, PE ratios, beta, and historical prices using `yahoo-finance2`.
3. The **LangGraph AI pipeline** is triggered:
   - **News Scout:** Scrapes the web for the latest financial news regarding the ticker.
   - **Financial Analyst:** Synthesizes the raw data and news into a cohesive fundamental analysis using Hugging Face models.
   - **Risk Manager:** Assesses market volatility and potential downsides.
4. The final insight is compiled and saved to PostgreSQL via Prisma.
5. The frontend dynamically renders the results using markdown and interactive Chart.js graphs.
6. Users can curate their portfolio holdings and export professional PDF reports via `pdf-lib`.

---

## 🧪 AI Architecture (LangGraph)
- **State Graph:** Manages the flow of contextual data between agents.
- **Nodes (Agents):** `news_scout` -> `analyst` -> `risk_manager`.
- **LLM Pipeline:** Utilizes `@huggingface/inference` for zero-shot reasoning and summarization.

---

## 🥇 Why It's Better
Unlike generic AI chatbots that hallucinate financial data, AI-FinAnalyst-Pro uses a **Retrieval and Tool-Augmented Agentic Workflow**. It strictly grounds its analysis in real-time, deterministic data (via Yahoo Finance) and live scraped news, ensuring the resulting insights are accurate, timely, and data-backed. Furthermore, it organizes these insights into a highly polished, responsive web application rather than a simple terminal script.

---

## 🚀 Future Enhancements
- Integrate a dedicated vector database (like Pinecone) to allow semantic search over company SEC filings (10-Ks, 10-Qs).
- Add support for Options and Crypto tracking.
- Implement automated technical analysis markers (e.g., SMA, EMA, RSI) directly on the charts.
- Allow multi-user authentication (via NextAuth) to scale as a SaaS platform.
- Expose the LangGraph pipeline as an external API endpoint for other applications.

---

## 📌 Key Learnings
- **LangGraph Orchestration:** Building multi-agent state machines in a Node.js context.
- **Serverless LLM Integration:** Efficiently using Hugging Face APIs within Next.js API Routes.
- **Automated PDF Generation:** Handling document buffers and binary data on the backend with `pdf-lib`.
- **Database Schema Modeling:** Using Prisma to cleanly relate users, holdings, and historical analyses.

---

⭐ If you find this project useful, consider starring the repository!
