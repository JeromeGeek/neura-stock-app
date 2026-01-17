
# NEURA 📈

**NEURA** is a minimalistic, dark-mode stock tracking web application designed for modern investors. It provides a clean, fast, and intuitive interface to monitor stock prices, view interactive charts, manage a personalized watchlist, and stay updated with the latest financial news. The focus is on clarity and performance, offering key insights without the complexity of trading functionalities.

![NEURA Screenshot](https://i.imgur.com/8Q6tJ2g.png)

---

## 📖 Description

NEURA is a sleek and modern stock tracking application for investors who value speed, clarity, and design. In a world of complex trading platforms, NEURA takes a minimalist approach, delivering critical financial insights without the clutter. It offers real-time stock quotes, beautiful interactive charts, and a personalized watchlist in a responsive, dark-mode interface, making it the perfect companion for monitoring your portfolio and the market.

---

## ✨ Key Features

- **Real-time Stock Quotes**: Get the latest prices and daily changes for your favorite stocks, with subtle flashing indicators for price movements.
- **Customizable Dashboard**: A drag-and-drop interface to arrange widgets like your Watchlist, Market Overview, Top Movers, and Global News to your preference.
- **Interactive Charts**: Visualize historical performance with beautiful, responsive charts. Switch between time ranges from 1-day to 5-years.
- **Personalized Watchlist**: Add and remove stocks from a personal watchlist that persists in your browser's local storage.
- **Stock Comparison Tool**: Select two or more stocks from your watchlist to compare their performance over time on a single normalized chart.
- **Financial News**: Access the latest news for a specific stock or view top global financial headlines.
- **Powerful Search**: Quickly find any stock by its ticker or company name.
- **Clean & Responsive UI**: A sleek, dark-mode design that looks great and is fully functional on both desktop and mobile devices.

---

## 🛠️ Tech Stack

This project is built with a modern, efficient, and dependency-light stack.

- **Frontend**: [React](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (via CDN for simplicity)
- **Charting**: [Recharts](https://recharts.org/)
- **Drag & Drop**: [React DnD](https://react-dnd.github.io/react-dnd/)
- **Data Source**: [Finnhub.io API](https://finnhub.io/)
- **Deployment**: [Vercel](https://vercel.com/)

---

## 🚀 Getting Started & Deployment

This application is designed for a seamless deployment on Vercel, which handles the serverless API proxy required to protect your API key.

### Prerequisites

- A [GitHub](https://github.com/) account.
- A free API key from [Finnhub.io](https://finnhub.io/).

### Step-by-Step Deployment

1.  **Upload to GitHub**:
    - Create a new repository on GitHub.
    - Use the "Add file" -> "Upload files" option on the repository page to upload all the project files and folders.

2.  **Sign up for Vercel**:
    - Go to [vercel.com](https://vercel.com/) and sign up using your GitHub account.

3.  **Import and Deploy Project**:
    - From your Vercel dashboard, click **"Add New..."** -> **"Project"**.
    - Find and **"Import"** the GitHub repository you just created.
    - Vercel will automatically detect the correct settings.

4.  **Add Environment Variable (Crucial Step)**:
    - Before deploying, expand the **Environment Variables** section.
    - Create a new variable:
      - **Name**: `FINNHUB_API_KEY`
      - **Value**: Paste the API key you got from Finnhub.
    - Click **"Add"**.

5.  **Deploy**:
    - Click the **"Deploy"** button.
    - Vercel will build and deploy your application. In a minute, you'll have a live URL for your fully functional stock tracking app!

---

## 📁 Project Structure

The codebase is organized to be clean and maintainable.

```
/
├── api/
│   └── [[path]].ts       # Serverless proxy function for Finnhub API calls
├── components/           # Reusable React components (Card, Chart, etc.)
├── hooks/                # Custom React hooks (useWatchlist, useRealtimeQuotes)
├── pages/                # Top-level page components (HomePage, StockDetailPage)
├── services/             # API service layer (stockService.ts)
├── utils/                # Helper functions (formatTime.ts)
├── App.tsx               # Main application component and routing logic
├── index.html            # The single HTML entry point
├── index.tsx             # React DOM renderer
├── types.ts              # TypeScript type definitions
└── README.md             # This file
```

### Serverless API Proxy (`/api/[[path]].ts`)

To protect the `FINNHUB_API_KEY`, the frontend does not call the Finnhub API directly. Instead, it calls a serverless function hosted at `/api/*`. This function, running on Vercel's edge network, receives the request, securely attaches the API key, forwards it to Finnhub, and returns the response to the frontend. This is a best practice for handling API keys in modern web applications.

---

*Disclaimer: Market data provided by Finnhub. Data is delayed and for informational purposes only. Not for trading purposes.*