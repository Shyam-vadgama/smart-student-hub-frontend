import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import StockSearch from '@/components/StockSearch';
import StockView from '@/components/StockView';
import TransactionHistory from '@/components/TransactionHistory';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Wallet, PieChart as PieChartIcon, 
  Activity, BarChart3, RefreshCw, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';

const fetchPortfolio = async () => {
  const res = await fetch('/api/stock/portfolio', { credentials: 'include' });
  if (!res.ok) {
    throw new Error('Failed to fetch portfolio');
  }
  return res.json();
};

// Mock data for portfolio performance chart
const portfolioPerformanceData = [
  { date: 'Jan', value: 10000 },
  { date: 'Feb', value: 12500 },
  { date: 'Mar', value: 11800 },
  { date: 'Apr', value: 13200 },
  { date: 'May', value: 14500 },
  { date: 'Jun', value: 15200 },
  { date: 'Jul', value: 16800 },
  { date: 'Aug', value: 17500 },
  { date: 'Sep', value: 16200 },
  { date: 'Oct', value: 18000 },
  { date: 'Nov', value: 19500 },
  { date: 'Dec', value: 21000 },
];

// Mock data for asset allocation
const assetAllocationData = [
  { name: 'Stocks', value: 65 },
  { name: 'Bonds', value: 15 },
  { name: 'Cash', value: 10 },
  { name: 'Crypto', value: 10 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

// Mock data for sector allocation
const sectorAllocationData = [
  { name: 'Tech', value: 35 },
  { name: 'Finance', value: 20 },
  { name: 'Healthcare', value: 15 },
  { name: 'Consumer', value: 12 },
  { name: 'Energy', value: 8 },
  { name: 'Other', value: 10 },
];

const PortfolioValueChart = () => (
  <ResponsiveContainer width="100%" height={300}>
    <AreaChart data={portfolioPerformanceData}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
      <XAxis dataKey="date" stroke="#6b7280" />
      <YAxis stroke="#6b7280" />
      <Tooltip 
        formatter={(value) => [`$${value.toLocaleString()}`, 'Value']}
        labelFormatter={(label) => `Month: ${label}`}
        contentStyle={{ borderRadius: '0.5rem', border: 'none' }}
      />
      <Area 
        type="monotone" 
        dataKey="value" 
        stroke="#3b82f6" 
        fill="url(#colorValue)" 
        strokeWidth={2}
      />
      <defs>
        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
        </linearGradient>
      </defs>
    </AreaChart>
  </ResponsiveContainer>
);

const AssetAllocationChart = () => (
  <ResponsiveContainer width="100%" height={200}>
    <PieChart>
      <Pie
        data={assetAllocationData}
        cx="50%"
        cy="50%"
        innerRadius={40}
        outerRadius={70}
        fill="#8884d8"
        paddingAngle={2}
        dataKey="value"
        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
      >
        {assetAllocationData.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip formatter={(value) => [`${value}%`, 'Allocation']} />
    </PieChart>
  </ResponsiveContainer>
);

const SectorAllocationChart = () => (
  <ResponsiveContainer width="100%" height={200}>
    <BarChart data={sectorAllocationData}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
      <XAxis dataKey="name" stroke="#6b7280" />
      <YAxis stroke="#6b7280" />
      <Tooltip formatter={(value) => [`${value}%`, 'Allocation']} />
      <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);

export default function StockTradingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'charts'>('overview');

  const { data: portfolio, isLoading, error, refetch } = useQuery({
    queryKey: ['portfolio', user?._id],
    queryFn: fetchPortfolio,
    enabled: !!user,
  });

  const popularStocks = [
    { ticker: 'AAPL', name: 'Apple Inc.', change: '+2.3%' },
    { ticker: 'GOOGL', name: 'Alphabet Inc.', change: '+1.2%' },
    { ticker: 'TSLA', name: 'Tesla Inc.', change: '-0.8%' },
    { ticker: 'AMZN', name: 'Amazon.com Inc.', change: '+0.5%' },
    { ticker: 'MSFT', name: 'Microsoft Corp.', change: '+1.7%' },
    { ticker: 'NVDA', name: 'NVIDIA Corp.', change: '+3.1%' },
  ];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Stock Trading" onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Stock Trading Dashboard</h1>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left Column - Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Popular Stocks Card */}
                <Card className="shadow-sm border-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                      Popular Stocks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      {popularStocks.map((stock) => (
                        <Button
                          key={stock.ticker}
                          variant="outline"
                          className="flex flex-col items-start h-auto p-3 hover:bg-slate-100 dark:hover:bg-slate-800"
                          onClick={() => setSelectedTicker(stock.ticker)}
                        >
                          <span className="font-bold">{stock.ticker}</span>
                          <span className="text-xs text-muted-foreground">{stock.name}</span>
                          <span className={`text-xs mt-1 ${stock.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                            {stock.change}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Stock Search */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Activity className="h-5 w-5 text-purple-500" />
                      Stock Search
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <StockSearch onSelect={setSelectedTicker} />
                  </CardContent>
                </Card>

                {/* Stock View */}
                {selectedTicker ? (
                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <BarChart3 className="h-5 w-5 text-indigo-500" />
                        {selectedTicker} Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <StockView ticker={selectedTicker} />
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="shadow-sm border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Select a Stock</h3>
                      <p className="text-muted-foreground text-center max-w-md">
                        Search for a stock using the search bar above or select from popular stocks to see its details and chart.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Column - Portfolio */}
              <div className="space-y-6">
                {/* Portfolio Summary Card */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Wallet className="h-5 w-5 text-green-500" />
                        My Portfolio
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">
                        Virtual Trading
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isLoading && (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    )}
                    
                    {error && (
                      <div className="text-red-500 text-sm py-2">
                        Error loading portfolio data
                      </div>
                    )}
                    
                    {portfolio && (
                      <>
                        <div className="space-y-1">
                          <div className="flex justify-between items-baseline">
                            <span className="text-2xl font-bold">
                              ${portfolio.totalPortfolioValue.toLocaleString(undefined, { 
                                minimumFractionDigits: 2, 
                                maximumFractionDigits: 2 
                              })}
                            </span>
                            <div className={`flex items-center gap-1 ${portfolio.totalProfitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {portfolio.totalProfitLoss >= 0 ? 
                                <ArrowUpRight className="h-4 w-4" /> : 
                                <ArrowDownRight className="h-4 w-4" />
                              }
                              <span>
                                {Math.abs(portfolio.totalProfitLoss / portfolio.totalPortfolioValue * 100).toFixed(2)}%
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
                        </div>
                        
                        <div className="pt-2 border-t">
                          <div className="flex justify-between items-baseline">
                            <span className="text-lg font-semibold">
                              ${portfolio.virtualBalance.toLocaleString(undefined, { 
                                minimumFractionDigits: 2, 
                                maximumFractionDigits: 2 
                              })}
                            </span>
                            <span className="text-sm text-muted-foreground">Available</span>
                          </div>
                          <p className="text-sm text-muted-foreground">Virtual Balance</p>
                        </div>
                        
                        <div className="pt-2 border-t">
                          <div className="flex justify-between items-baseline">
                            <span className={`font-medium ${portfolio.totalProfitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              ${portfolio.totalProfitLoss.toLocaleString(undefined, { 
                                minimumFractionDigits: 2, 
                                maximumFractionDigits: 2 
                              })}
                            </span>
                            <span className="text-sm text-muted-foreground">Total P/L</span>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Portfolio Charts Card */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <PieChartIcon className="h-5 w-5 text-amber-500" />
                        Portfolio Analytics
                      </CardTitle>
                      <div className="flex border rounded-md p-1 bg-muted">
                        <button 
                          className={`px-2 py-1 text-xs rounded-md ${activeTab === 'overview' ? 'bg-background shadow' : ''}`}
                          onClick={() => setActiveTab('overview')}
                        >
                          Overview
                        </button>
                        <button 
                          className={`px-2 py-1 text-xs rounded-md ${activeTab === 'charts' ? 'bg-background shadow' : ''}`}
                          onClick={() => setActiveTab('charts')}
                        >
                          Charts
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {activeTab === 'overview' ? (
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Portfolio Performance</h4>
                          <PortfolioValueChart />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium mb-2">Asset Allocation</h4>
                            <AssetAllocationChart />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-2">Sector Allocation</h4>
                            <SectorAllocationChart />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Asset Allocation</h4>
                          <AssetAllocationChart />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-2">Sector Allocation</h4>
                          <SectorAllocationChart />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Holdings Card */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <DollarSign className="h-5 w-5 text-yellow-500" />
                      Holdings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading && <p>Loading portfolio...</p>}
                    {error && <p className="text-red-500">{error.message}</p>}
                    {portfolio && (
                      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {portfolio.holdings.length === 0 ? (
                          <div className="text-center py-4 text-muted-foreground">
                            You do not own any stocks yet.
                          </div>
                        ) : (
                          portfolio.holdings.map((holding: any) => (
                            <div 
                              key={holding.ticker} 
                              className="flex justify-between items-center cursor-pointer hover:bg-muted p-3 rounded-md border transition-colors"
                              onClick={() => setSelectedTicker(holding.ticker)}
                            >
                              <div>
                                <p className="font-semibold">{holding.ticker}</p>
                                <p className="text-sm text-muted-foreground">{holding.quantity} shares</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">${holding.currentValue.toFixed(2)}</p>
                                <p className={`text-sm ${holding.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  {holding.profitLoss >= 0 ? '+' : ''}{holding.profitLoss.toFixed(2)} 
                                  ({(holding.profitLoss / (holding.currentValue - holding.profitLoss) * 100).toFixed(2)}%)
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Transaction History Section */}
            <div className="mt-8">
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="h-5 w-5 text-blue-500" />
                    Transaction History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TransactionHistory />
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}