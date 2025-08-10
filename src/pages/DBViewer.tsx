import React, { useEffect, useMemo, useState } from 'react';
import { getQuotes, getLastFetched } from '../db/stockDB';
import { useStockCache } from '../context/StockDataContext';

type Row = {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    // price may exist in your rows but we don't need it here
};

const DbViewer: React.FC = () => {
    const { symbols } = useStockCache();            // use the app's symbol list
    const [symbol, setSymbol] = useState<string>('');
    const [limit, setLimit] = useState<number>(200); // latest N rows to show
    const [rows, setRows] = useState<Row[]>([]);
    const [lastFetched, setLastFetchedTs] = useState<number | undefined>();
    const [loading, setLoading] = useState(false);

    // Pick the first known symbol when page loads
    useEffect(() => {
        if (!symbol && symbols.length) setSymbol(symbols[0]);
    }, [symbols, symbol]);

    // Load rows whenever symbol/limit changes
    useEffect(() => {
        (async () => {
            if (!symbol) return;
            setLoading(true);
            try {
                const [r, lf] = await Promise.all([
                    getQuotes(symbol, { limit }),
                    getLastFetched(symbol),
                ]);
                setRows(r as Row[]);
                setLastFetchedTs(lf ?? undefined);
            } finally {
                setLoading(false);
            }
        })();
    }, [symbol, limit]);

    // Derive available date range from loaded rows
    const dateRange = useMemo(() => {
        if (!rows.length) return { min: undefined as string | undefined, max: undefined as string | undefined };
        return { min: rows[0].date, max: rows[rows.length - 1].date };
    }, [rows]);

    // Quick CSV export
    const handleExportCsv = () => {
        if (!rows.length) return;
        const header = ['date', 'open', 'high', 'low', 'close', 'volume'].join(',');
        const lines = rows.map(r => [r.date, r.open, r.high, r.low, r.close, r.volume].join(','));
        const csv = [header, ...lines].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(symbol || 'SYMBOL').toUpperCase()}_quotes.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white py-6">
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
                <h1 className="text-2xl font-bold mb-4">DB Viewer</h1>

                <div className="flex flex-wrap items-end gap-4 mb-6">
                    <div>
                        <label className="text-sm text-gray-400">Symbol</label>
                        <select
                            className="block mt-1 bg-gray-800 border border-gray-700 rounded px-3 py-2"
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value)}
                        >
                            {symbols.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm text-gray-400">Limit (latest N rows)</label>
                        <input
                            type="number"
                            min={10}
                            step={10}
                            className="block mt-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 w-32"
                            value={limit}
                            onChange={(e) => setLimit(Math.max(10, Number(e.target.value) || 0))}
                        />
                    </div>

                    <div className="text-sm text-gray-400">
                        <div>Date range: {dateRange.min ?? '—'} → {dateRange.max ?? '—'}</div>
                        <div>Last fetched: {lastFetched ? new Date(lastFetched).toLocaleString() : '—'}</div>
                    </div>

                    <button
                        className="px-3 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-60"
                        onClick={handleExportCsv}
                        disabled={!rows.length}
                    >
                        Export CSV
                    </button>
                </div>

                <div className="overflow-auto border border-gray-700 rounded">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-800">
                        <tr>
                            {['date','open','high','low','close','volume'].map((h) => (
                                <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {loading ? (
                            <tr>
                                <td className="px-3 py-6 text-center text-gray-400" colSpan={6}>Loading…</td>
                            </tr>
                        ) : rows.length ? (
                            rows.slice().reverse().map((r) => (
                                <tr key={r.date} className="odd:bg-gray-800/60">
                                    <td className="px-3 py-2">{r.date}</td>
                                    <td className="px-3 py-2">{r.open.toFixed(2)}</td>
                                    <td className="px-3 py-2">{r.high.toFixed(2)}</td>
                                    <td className="px-3 py-2">{r.low.toFixed(2)}</td>
                                    <td className="px-3 py-2">{r.close.toFixed(2)}</td>
                                    <td className="px-3 py-2">{r.volume.toLocaleString()}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td className="px-3 py-6 text-center text-gray-400" colSpan={6}>No rows</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DbViewer;
