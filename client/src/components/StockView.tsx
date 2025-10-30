import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';

const fetchQuote = async (ticker: string) => {
  const res = await fetch(`/api/stock/quote/${ticker}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch quote');
  return res.json();
};

const fetchHistory = async (ticker: string) => {
  const res = await fetch(`/api/stock/history/${ticker}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch history');
  const data = await res.json();
  // Finnhub returns 'no_data' in the status field if no data is available
  if (data.s === 'no_data') return [];
  // Format data for recharts
  return data.t.map((timestamp: number, index: number) => ({
    date: new Date(timestamp * 1000).toLocaleDateString(),
    price: data.c[index],
  }));
};

interface StockViewProps {
  ticker: string;
}

export default function StockView({ ticker }: StockViewProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);

  const { data: quote, isLoading: isLoadingQuote, error: errorQuote } = useQuery({
    queryKey: ['quote', ticker],
    queryFn: () => fetchQuote(ticker),
  });

  const { data: history, isLoading: isLoadingHistory, error: errorHistory } = useQuery({
    queryKey: ['history', ticker],
    queryFn: () => fetchHistory(ticker),
  });

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio', user?._id] });
    },
  };

  const buyMutation = useMutation({
    mutationFn: (variables: { ticker: string, quantity: number }) =>
      fetch('/api/stock/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(variables),
      }).then(res => {
        if (!res.ok) throw new Error('Buy failed');
        return res.json();
      }),
    ...mutationOptions,
  });

  const sellMutation = useMutation({
    mutationFn: (variables: { ticker: string, quantity: number }) =>
      fetch('/api/stock/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(variables),
      }).then(res => {
        if (!res.ok) throw new Error('Sell failed');
        return res.json();
      }),
    ...mutationOptions,
  });

  if (isLoadingQuote || isLoadingHistory) return <p>Loading stock data...</p>;
  if (errorQuote || errorHistory) return <p className="text-red-500">Error loading stock data.</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{ticker}</CardTitle>
        <div className="text-2xl font-bold">${quote?.c?.toFixed(2)}</div>
        <p className={quote?.d > 0 ? 'text-green-500' : 'text-red-500'}>
          {quote?.d?.toFixed(2)} ({quote?.dp?.toFixed(2)}%)
        </p>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={['dataMin', 'dataMax']} />
              <Tooltip />
              <Line type="monotone" dataKey="price" stroke="#8884d8" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-6 flex gap-4">
          <Input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
            min="1"
            className="w-24"
          />
          <Button onClick={() => buyMutation.mutate({ ticker, quantity })} disabled={buyMutation.isPending}>
            Buy
          </Button>
          <Button onClick={() => sellMutation.mutate({ ticker, quantity })} disabled={sellMutation.isPending} variant="outline">
            Sell
          </Button>
        </div>
        {buyMutation.isError && <p className="text-red-500 mt-2">{(buyMutation.error as Error).message}</p>}
        {sellMutation.isError && <p className="text-red-500 mt-2">{(sellMutation.error as Error).message}</p>}
      </CardContent>
    </Card>
  );
}
