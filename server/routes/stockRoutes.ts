import { Router, Request } from 'express';
import { authMiddleware } from '../middleware/auth';
import { checkDepartment } from '../middleware/role';
import Portfolio from '../models/Portfolio';
import Transaction from '../models/Transaction';

// Extend Request type to include user and portfolio
interface AuthRequest extends Request {
  user?: any;
  portfolio?: any;
}

const router = Router();

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const FINNHUB_API_URL = 'https://finnhub.io/api/v1';

// Simple mock generator for Finnhub endpoints when API key is missing
const mockFinnhubResponse = (endpoint: string) => {
  // Normalize
  const upper = endpoint.toUpperCase();
  // Extract symbol if present
  const symbolMatch = /SYMBOL=([A-Z0-9\.-]+)/.exec(upper);
  const symbol = symbolMatch ? symbolMatch[1] : 'MOCK';

  // Deterministic pseudo-random based on symbol
  let seed = 0;
  for (let i = 0; i < symbol.length; i++) {
    seed = (seed * 31 + symbol.charCodeAt(i)) >>> 0;
  }
  const rand = (min: number, max: number) => {
    // xorshift-like
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    const n = (seed >>> 0) / 0xffffffff;
    return min + (max - min) * n;
  };

  if (upper.startsWith('/SEARCH?')) {
    const qMatch = /\?Q=([^&]+)/.exec(upper);
    const q = qMatch ? qMatch[1] : 'MO';
    return {
      count: 3,
      result: [
        { description: `${q} Corporation`, displaySymbol: `${q}`, symbol: `${q}`, type: 'Common Stock' },
        { description: `${q} Tech Inc`, displaySymbol: `${q}T`, symbol: `${q}T`, type: 'Common Stock' },
        { description: `${q} Holdings`, displaySymbol: `${q}H`, symbol: `${q}H`, type: 'Common Stock' },
      ],
    };
  }

  if (upper.startsWith('/QUOTE?')) {
    const base = Math.max(5, Math.round(rand(20, 300) * 100) / 100);
    const change = Math.round(rand(-5, 5) * 100) / 100;
    const open = Math.max(1, base - Math.round(rand(0, 3) * 100) / 100);
    const high = base + Math.abs(change) + 1;
    const low = Math.max(1, base - Math.abs(change) - 1);
    const prevClose = Math.max(1, base - change);
    return {
      c: base, // current price
      d: change, // change
      dp: Math.round((change / prevClose) * 10000) / 100, // percent change
      h: high,
      l: low,
      o: open,
      pc: prevClose,
      t: Math.floor(Date.now() / 1000),
    };
  }

  if (upper.startsWith('/STOCK/CANDLE?')) {
    const now = Math.floor(Date.now() / 1000);
    const points = 60; // 60 candles
    const t: number[] = [];
    const o: number[] = [];
    const h: number[] = [];
    const l: number[] = [];
    const c: number[] = [];
    const v: number[] = [];
    let price = Math.max(5, Math.round(rand(20, 300)));
    for (let i = points - 1; i >= 0; i--) {
      const ts = now - i * 24 * 60 * 60;
      const drift = rand(-3, 3);
      const open = Math.max(1, price + rand(-2, 2));
      const close = Math.max(1, open + drift);
      const high = Math.max(open, close) + rand(0, 2);
      const low = Math.max(1, Math.min(open, close) - rand(0, 2));
      const vol = Math.round(rand(10000, 500000));
      t.push(ts);
      o.push(Number(open.toFixed(2)));
      h.push(Number(high.toFixed(2)));
      l.push(Number(low.toFixed(2)));
      c.push(Number(close.toFixed(2)));
      v.push(vol);
      price = close;
    }
    return { s: 'ok', t, o, h, l, c, v };
  }

  // Default generic
  return { ok: true } as any;
};

// Helper to fetch from Finnhub (with mock fallback when API key missing)

const fetchFinnhub = async (endpoint: string) => {
  if (!FINNHUB_API_KEY) {
    return mockFinnhubResponse(endpoint);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout

  try {
    const url = `${FINNHUB_API_URL}${endpoint}&token=${FINNHUB_API_KEY}`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`Finnhub API error: ${res.statusText}`);
    }
    return await res.json();
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Request to Finnhub API timed out.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

// Middleware to ensure user has a portfolio
const ensurePortfolio = async (req: AuthRequest, res: any, next: any) => {
  try {
    let portfolio = await Portfolio.findOne({ user: req.user._id });
    if (!portfolio) {
      portfolio = await Portfolio.create({ user: req.user._id });
    }
    req.portfolio = portfolio;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error accessing portfolio' });
  }
};

// All routes in this file are for BBA students and require a portfolio
router.use(authMiddleware, checkDepartment(['bba']), ensurePortfolio);

// Search for a stock
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ message: 'Query parameter "q" is required.' });
    }
    const data = await fetchFinnhub(`/search?q=${query}`);
    res.json(data);
  } catch (error: any) {
    console.error(`Error in ${req.path}:`, error);
    res.status(500).json({ message: error.message });
  }
});

// Get a stock quote
router.get('/quote/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const data = await fetchFinnhub(`/quote?symbol=${ticker.toUpperCase()}`);
    res.json(data);
  } catch (error: any) {
    console.error(`Error in ${req.path}:`, error);
    res.status(500).json({ message: error.message });
  }
});

// Get historical data for a stock
router.get('/history/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const to = Math.floor(Date.now() / 1000);
    const from = to - (365 * 24 * 60 * 60); // 1 year ago
    const data = await fetchFinnhub(`/stock/candle?symbol=${ticker.toUpperCase()}&resolution=D&from=${from}&to=${to}`);
    res.json(data);
  } catch (error: any) {
    console.error(`Error in ${req.path}:`, error);
    res.status(500).json({ message: error.message });
  }
});

// Get portfolio
router.get('/portfolio', async (req: AuthRequest, res) => {
  try {
    const portfolio = req.portfolio.toObject();

    const holdingsWithMarketValue = await Promise.all(
      portfolio.holdings.map(async (holding: any) => {
        const quote = await fetchFinnhub(`/quote?symbol=${holding.ticker}`);
        const currentPrice = quote.c;
        const currentValue = currentPrice * holding.quantity;
        const cost = holding.purchasePrice * holding.quantity;
        const profitLoss = currentValue - cost;
        return {
          ...holding,
          currentPrice,
          currentValue,
          profitLoss,
        };
      })
    );

    const totalHoldingsValue = holdingsWithMarketValue.reduce((acc, holding) => acc + holding.currentValue, 0);
    const totalPortfolioValue = portfolio.virtualBalance + totalHoldingsValue;
    const totalProfitLoss = holdingsWithMarketValue.reduce((acc, holding) => acc + holding.profitLoss, 0);

    res.json({
      ...portfolio,
      holdings: holdingsWithMarketValue,
      totalHoldingsValue,
      totalPortfolioValue,
      totalProfitLoss,
    });

  } catch (error: any) {
    console.error(`Error in ${req.path}:`, error);
    res.status(500).json({ message: error.message });
  }
});

// Buy a stock
router.post('/buy', async (req: AuthRequest, res) => {
  try {
    const { ticker, quantity } = req.body;
    if (!ticker || !quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Ticker and positive quantity are required.' });
    }

    const quote = await fetchFinnhub(`/quote?symbol=${ticker.toUpperCase()}`);
    const price = quote.c; // Current price
    const cost = price * quantity;

    const portfolio = req.portfolio;
    if (portfolio.virtualBalance < cost) {
      return res.status(400).json({ message: 'Insufficient funds.' });
    }

    portfolio.virtualBalance -= cost;
    const holding = portfolio.holdings.find((h: any) => h.ticker === ticker.toUpperCase());

    if (holding) {
      holding.purchasePrice = (holding.purchasePrice * holding.quantity + cost) / (holding.quantity + quantity);
      holding.quantity += quantity;
    } else {
      portfolio.holdings.push({ ticker: ticker.toUpperCase(), quantity, purchasePrice: price });
    }

    await portfolio.save();

    await Transaction.create({
      user: req.user._id,
      ticker: ticker.toUpperCase(),
      type: 'buy',
      quantity,
      price,
    });

    res.json(portfolio);

  } catch (error: any) {
    console.error(`Error in ${req.path}:`, error);
    res.status(500).json({ message: error.message });
  }
});

// Get all transactions for the user
router.get('/transactions', async (req: AuthRequest, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id }).sort({ date: -1 });
    res.json(transactions);
  } catch (error: any) {
    console.error(`Error in ${req.path}:`, error);
    res.status(500).json({ message: error.message });
  }
});

// Download all transactions as CSV
router.get('/transactions/download', async (req: AuthRequest, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id }).sort({ date: -1 });

    const fields = ['date', 'ticker', 'type', 'quantity', 'price'];
    
    let csv = fields.join(',') + '\n';
    transactions.forEach(transaction => {
      const tx: any = (transaction as any)?.toObject ? (transaction as any).toObject() : (transaction as any);
      const row = fields.map(field => {
        if (field === 'date') {
          return new Date(transaction.date).toLocaleString();
        }
        return tx[field];
      });
      csv += row.join(',') + '\n';
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('transactions.csv');
    res.send(csv);

  } catch (error: any) {
    console.error(`Error in ${req.path}:`, error);
    res.status(500).json({ message: error.message });
  }
});

// Sell a stock
router.post('/sell', async (req: AuthRequest, res) => {
  try {
    const { ticker, quantity } = req.body;
    if (!ticker || !quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Ticker and positive quantity are required.' });
    }

    const portfolio = req.portfolio;
    const holdingIndex = portfolio.holdings.findIndex((h: any) => h.ticker === ticker.toUpperCase());

    if (holdingIndex === -1) {
      return res.status(400).json({ message: 'You do not own this stock.' });
    }

    const holding = portfolio.holdings[holdingIndex];
    if (holding.quantity < quantity) {
      return res.status(400).json({ message: 'You do not own enough shares to sell.' });
    }

    const quote = await fetchFinnhub(`/quote?symbol=${ticker.toUpperCase()}`);
    const price = quote.c; // Current price
    const revenue = price * quantity;

    portfolio.virtualBalance += revenue;
    holding.quantity -= quantity;

    if (holding.quantity === 0) {
      portfolio.holdings.splice(holdingIndex, 1);
    }

    await portfolio.save();

    await Transaction.create({
      user: req.user._id,
      ticker: ticker.toUpperCase(),
      type: 'sell',
      quantity,
      price,
    });

    res.json(portfolio);

  } catch (error: any) {
    console.error(`Error in ${req.path}:`, error);
    res.status(500).json({ message: error.message });
  }
});

export default router;