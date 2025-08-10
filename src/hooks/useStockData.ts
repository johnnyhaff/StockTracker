import { useEffect, useMemo, useState } from 'react';
import { fetchDaily } from '../api/alphaVantage';
import { enrichWithIndicators } from '../indicators';
import { EnrichedRow, QuoteRow } from '../types/market';

function generateMock(days = 30): QuoteRow[] {
    const out: QuoteRow[] = [];
    let base = Math.random() * 200 + 50;
    let vol = Math.random() * 1_000_000 + 500_000;
    for (let i = 0; i < days; i++) {
        const date = new Date(); date.setDate(date.getDate() - (days - i));
        const v = 0.02;
        base += (Math.random() - 0.5) * base * v;
        const open = base;
        const high = open + Math.random() * open * 0.03;
        const low  = open - Math.random() * open * 0.03;
        const close = low + Math.random() * (high - low);
        vol *= (0.8 + Math.random() * 0.4);
        out.push({
            date: date.toISOString().split('T')[0],
            open: +open.toFixed(2),
            high: +high.toFixed(2),
            low:  +low.toFixed(2),
            close:+close.toFixed(2),
            volume: Math.floor(vol),
            price: +close.toFixed(2),
        });
        base = close;
    }
    return out;
}

export function useStockData(stocks: string[]) {
    const [map, setMap] = useState<Record<string, EnrichedRow[]>>({});
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const run = async () => {
            setLoading(true); setError(null);
            const next: Record<string, EnrichedRow[]> = {};
            let ok = 0; const fail: string[] = [];

            for (let i = 0; i < stocks.length; i++) {
                const sym = stocks[i];
                try {
                    setStatus(`Fetching ${sym}... (${i + 1}/${stocks.length})`);
                    const rows = await fetchDaily(sym);
                    next[sym] = enrichWithIndicators(rows);
                    ok++;
                    if (i < stocks.length - 1) {
                        setStatus(`Rate limit pause… Next: ${stocks[i + 1]}`);
                        await new Promise((r) => setTimeout(r, 12_000));
                    }
                } catch (e: any) {
                    fail.push(sym);
                    next[sym] = enrichWithIndicators(generateMock());
                }
            }

            if (!cancelled) {
                setMap(next);
                setLoading(false);
                setStatus('');
                if (ok && fail.length) setError(`Loaded ${ok}/${stocks.length}. Failed: ${fail.join(', ')}`);
                else if (fail.length === stocks.length) setError('All API calls failed. Using mock data.');
            }
        };
        void run();
        return () => { cancelled = true; };
    }, [stocks]);

    const getData = (symbol: string) => map[symbol] ?? [];
    const symbolsLoaded = useMemo(() => Object.keys(map), [map]);

    return { stockData: map, getData, symbolsLoaded, loading, status, error };
}
