import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';

const searchStocks = async (query: string) => {
  if (!query) return [];
  const res = await fetch(`/api/stock/search?q=${query}`, { credentials: 'include' });
  if (!res.ok) {
    throw new Error('Failed to search stocks');
  }
  const data = await res.json();
  return data.result || [];
};

interface StockSearchProps {
  onSelect: (symbol: string) => void;
}

export default function StockSearch({ onSelect }: StockSearchProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['stockSearch', debouncedQuery],
    queryFn: () => searchStocks(debouncedQuery),
    enabled: !!debouncedQuery,
  });

  return (
    <div className="relative">
      <Input
        placeholder="Search for a stock... (e.g., AAPL)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {debouncedQuery && (
        <div className="absolute z-10 w-full bg-card border rounded-md mt-1 shadow-lg">
          {isLoading && <div className="p-2">Searching...</div>}
          {searchResults && searchResults.length === 0 && <div className="p-2">No results found.</div>}
          {searchResults && searchResults.map((stock: any) => (
            <div
              key={stock.symbol}
              className="p-2 hover:bg-muted cursor-pointer"
              onClick={() => {
                onSelect(stock.symbol);
                setQuery('');
              }}
            >
              <p className="font-semibold">{stock.symbol}</p>
              <p className="text-sm text-muted-foreground">{stock.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
