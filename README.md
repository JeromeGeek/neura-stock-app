
# NEURA 📈

A modern stock tracking web application for monitoring real-time stock prices, managing watchlists, and viewing financial news.

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Free API key from [Finnhub.io](https://finnhub.io/dashboard)

### Local Setup

1. **Clone and install**
   ```bash
   git clone https://github.com/JeromeGeek/neura-stock-app.git
   cd neura-stock-app
   npm install
   ```

2. **Add API key**
   - Create `.env` file in root directory
   - Add: `FINNHUB_API_KEY=your_api_key_here`

3. **Start development server**
   ```bash
   npm run dev
   ```
   - Open http://localhost:3000

### Deploy to Vercel

1. Push to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Add `FINNHUB_API_KEY` environment variable
4. Deploy

---

## ✨ Features

- Real-time stock quotes
- Customizable dashboard with drag-and-drop
- Stock price charts (simulated data on free API tier)
- Personalized watchlist
- Stock comparison tool
- Financial news
- Search stocks by ticker or company name

**Note**: Charts use simulated data based on current prices. Historical data requires a premium Finnhub subscription.

---

## �️ Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **API**: Finnhub.io
- **Deployment**: Vercel

---

## 📁 Project Structure

```
/
├── api/              # Serverless proxy for API calls
├── components/       # React components
├── hooks/            # Custom React hooks
├── pages/            # Page components
├── services/         # API service layer
├── App.tsx           # Main app component
└── index.tsx         # React entry point
```

---

**Developed by Jerome Kingsly**

*Market data is delayed and for informational purposes only.*