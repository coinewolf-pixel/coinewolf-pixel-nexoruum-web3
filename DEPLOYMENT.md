# NEXORUM OS Web3 Application Module Deployment Guide

This repository contains the official Web3 Application module for NEXORUM OS.

## 🚀 Quick Deployment Options

### Option 1: Cloudflare Pages + Workers (Recommended)

1. **Install Wrangler CLI**:
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**:
   ```bash
   wrangler login
   ```

3. **Deploy Web Worker to Cloudflare**:
   ```bash
   cd cloudflare
   wrangler d1 create nexorum_web3_db
   wrangler d1 execute nexorum_web3_db --file=../db/schema.sql
   wrangler d1 execute nexorum_web3_db --file=../db/migrations/0001_init.sql
   wrangler deploy
   ```

4. **Deploy Static Assets to Cloudflare Pages**:
   ```bash
   npm run build
   npx wrangler pages deploy dist --project-name=nexorum-web3-app
   ```

---

### Option 2: Docker Container / Cloud Run Deployment

1. **Build the Docker Image**:
   ```bash
   docker build -t nexorum-web3-os .
   ```

2. **Run Container**:
   ```bash
   docker run -d -p 3000:3000 -e GEMINI_API_KEY="your_gemini_key" nexorum-web3-os
   ```

---

### Option 3: Direct NEXORUM Kernel Plugin Integration

1. Copy module output `dist/server.cjs` and frontend bundle `dist` to `/nexorum/plugins/web3-application/`.
2. Execute `nexorum plugin register /nexorum/plugins/web3-application/manifest.json`.
3. The NEXORUM Kernel automatically mounts all API endpoints at `/api/v1/plugins/web3/` and registers navigation tabs.

---

## 🔐 Environment Variables

Ensure the following environment variables are set in `.env` or Cloudflare Worker Secrets:

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API Key for NEXORUM AI Engine |
| `WALLETCONNECT_PROJECT_ID` | WalletConnect v2 Cloud Project ID |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API Token for 1-click Authentication |
| `DATABASE_URL` | D1 / SQLite / Postgres Connection String |
