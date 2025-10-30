import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const fetchTransactions = async () => {
  const res = await fetch('/api/stock/transactions', { credentials: 'include' });
  if (!res.ok) {
    throw new Error('Failed to fetch transactions');
  }
  return res.json();
};

export default function TransactionHistory() {
  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['transactions'],
    queryFn: fetchTransactions,
  });

  const downloadCsv = () => {
    window.open('/api/stock/transactions/download');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Transaction History</CardTitle>
        <Button onClick={downloadCsv} variant="outline" disabled={!transactions || transactions.length === 0}>
          Download CSV
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading && <p>Loading transactions...</p>}
        {error && <p className="text-red-500">{(error as Error).message}</p>}
        {transactions && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Ticker</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx: any) => (
                <TableRow key={tx._id}>
                  <TableCell>{new Date(tx.date).toLocaleString()}</TableCell>
                  <TableCell>{tx.ticker}</TableCell>
                  <TableCell className={`capitalize ${tx.type === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                    {tx.type}
                  </TableCell>
                  <TableCell className="text-right">{tx.quantity}</TableCell>
                  <TableCell className="text-right">${tx.price.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
