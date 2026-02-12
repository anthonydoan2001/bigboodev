'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useDashboardSettings, useDashboardSettingsMutation } from '@/lib/hooks/useDashboardSettings';
import { TrendingUp, Plus, X, Loader2, CheckCircle } from 'lucide-react';

export function PricesSettings() {
  const { settings, isLoading } = useDashboardSettings();
  const { save, isSaving } = useDashboardSettingsMutation();

  const [stocks, setStocks] = useState<string[]>([]);
  const [crypto, setCrypto] = useState<string[]>([]);
  const [stockInput, setStockInput] = useState('');
  const [cryptoInput, setCryptoInput] = useState('');
  const [saveResult, setSaveResult] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setStocks(settings.stocks);
      setCrypto(settings.crypto);
    }
  }, [settings]);

  const addStock = () => {
    const symbol = stockInput.trim().toUpperCase();
    if (symbol && !stocks.includes(symbol)) {
      setStocks([...stocks, symbol]);
      setStockInput('');
    }
  };

  const removeStock = (symbol: string) => {
    setStocks(stocks.filter(s => s !== symbol));
  };

  const addCrypto = () => {
    const symbol = cryptoInput.trim().toUpperCase();
    if (symbol && !crypto.includes(symbol)) {
      setCrypto([...crypto, symbol]);
      setCryptoInput('');
    }
  };

  const removeCrypto = (symbol: string) => {
    setCrypto(crypto.filter(s => s !== symbol));
  };

  const handleSave = async () => {
    setSaveResult(null);
    try {
      await save({ stocks, crypto });
      setSaveResult('Saved');
      setTimeout(() => setSaveResult(null), 2000);
    } catch {
      setSaveResult('Failed to save');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, addFn: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addFn();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <CardTitle>Tracked Prices</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          <CardTitle>Tracked Prices</CardTitle>
        </div>
        <CardDescription>
          Choose which stocks and crypto to track on your dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3">
          <Label>Stock Tickers</Label>
          <div className="flex flex-wrap gap-1.5">
            {stocks.map(symbol => (
              <Badge key={symbol} variant="secondary" className="gap-1 pr-1">
                {symbol}
                <button
                  onClick={() => removeStock(symbol)}
                  className="ml-0.5 rounded-full hover:bg-foreground/10 p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. AAPL"
              value={stockInput}
              onChange={e => setStockInput(e.target.value.toUpperCase())}
              onKeyDown={e => handleKeyDown(e, addStock)}
              className="max-w-[140px]"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={addStock}
              disabled={!stockInput.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Crypto Symbols</Label>
          <div className="flex flex-wrap gap-1.5">
            {crypto.map(symbol => (
              <Badge key={symbol} variant="secondary" className="gap-1 pr-1">
                {symbol}
                <button
                  onClick={() => removeCrypto(symbol)}
                  className="ml-0.5 rounded-full hover:bg-foreground/10 p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. BTC"
              value={cryptoInput}
              onChange={e => setCryptoInput(e.target.value.toUpperCase())}
              onKeyDown={e => handleKeyDown(e, addCrypto)}
              className="max-w-[140px]"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={addCrypto}
              disabled={!cryptoInput.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save
          </Button>
          {saveResult && (
            <span className="text-sm text-success flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" />
              {saveResult}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
