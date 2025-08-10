import React from 'react';
import { Link } from 'react-router-dom';
import { useStockCache } from '../context/StockDataContext';
import { generateRecommendation } from '../logic/recommend';
import { AlertCircle, Loader, Plus, X } from 'lucide-react';

const badge = (a: string) =>
    a === 'BUY' ? 'bg-green-900 text-green-300 border-green-700' :
        a === 'SELL' ? 'bg-red-900 text-red-300 border-red-700' :
            'bg-yellow-900 text-yellow-300 border-yellow-700';

const StocksOverview: React.FC = () => {
    const {
        symbols,
        addSymbol,
        removeSymbol,
        getData,
        getLastUpdated,
        loading,
        status,
        error,
    } = useStockCache();

    return (
        <div className="min-h-screen w-screen overflow-x-hidden bg-gray-900 text-white py-6">
            <div className="max-w-none w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold">Quant Finance Dashboard</h1>
                        <p className="text-gray-400">Overview — click a stock to see detailed charts</p>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Enter stock symbol"
                            className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                            onKeyDown={(e) => {
                                const el = e.target as HTMLInputElement;
                                if (e.key === 'Enter') { addSymbol(el.value); el.value = ''; }
                            }}
                            disabled={loading}
                        />
                        <button
                            onClick={() => {
                                const el = document.querySelector<HTMLInputElement>('input[placeholder="Enter stock symbol"]');
                                if (el) { addSymbol(el.value); el.value = ''; }
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 disabled:bg-blue-400"
                            disabled={loading}
                        >
                            <Plus size={16} /> Add
                        </button>
                    </div>
                </div>

                {loading && (
                    <div className="bg-blue-900 border border-blue-700 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-3">
                            <Loader className="animate-spin text-blue-400" size={20} />
                            <div>
                                <p className="text-blue-200 font-medium">Loading stock data…</p>
                                <p className="text-blue-300 text-sm">{status}</p>
                            </div>
                        </div>
                    </div>
                )}
                {error && (
                    <div className="bg-red-900 border border-red-700 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="text-red-400" size={20} />
                            <p className="text-red-200">{error}</p>
                        </div>
                    </div>
                )}

                {/* Auto-fit grid */}
                <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]">
                    {symbols.map((sym) => {
                        const rows = getData(sym);
                        const last =
                            getLastUpdated(sym) ??
                            (rows.length
                                ? new Date(rows[rows.length - 1]!.date + 'T16:00:00Z').getTime()
                                : undefined);

                        const latest = rows[rows.length - 1];
                        const prev   = rows[rows.length - 2];
                        const price  = latest?.close ?? null;
                        const change = price != null && prev?.close != null ? price - prev.close : null;
                        const pct    = change != null && prev?.close ? (change / prev.close) * 100 : null;

                        const rec = generateRecommendation(rows);

                        return (
                            <div key={sym} className="bg-gray-800 rounded-xl p-5 border border-gray-700 w-full min-w-0">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-2xl font-bold">{sym}</h3>
                                        <div className="mt-1 text-sm text-gray-400">
                                            {price != null ? `$${price.toFixed(2)}` : '—'}{' '}
                                            <span className={`${(change ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {change != null ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}` : ''}{' '}
                                                {pct != null ? `(${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%)` : ''}
                      </span>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Last updated: {last ? new Date(last).toLocaleString() : '—'}
                                        </div>
                                    </div>

                                    {symbols.length > 1 && (
                                        <button
                                            onClick={() => removeSymbol(sym)}
                                            className="text-gray-400 hover:text-red-400"
                                            title="Remove"
                                        >
                                            <X size={18} />
                                        </button>
                                    )}
                                </div>

                                <div className={`mt-4 inline-flex items-center gap-2 px-2 py-1 rounded-full border ${badge(rec.action)}`}>
                                    <span className="text-sm font-semibold">{rec.action}</span>
                                    <span className="text-[10px] uppercase tracking-wide opacity-80">{rec.confidence} confidence</span>
                                </div>

                                <ul className="mt-4 text-sm text-gray-300 space-y-1">
                                    {rec.reasons.slice(0, 3).map((r, i) => (
                                        <li key={i} className="flex gap-2">
                                            <span className="text-gray-500">•</span><span>{r}</span>
                                        </li>
                                    ))}
                                    {rec.reasons.length > 3 && <li className="text-gray-500">+{rec.reasons.length - 3} more…</li>}
                                </ul>

                                <div className="mt-5 flex justify-end">
                                    <Link to={`/stock/${sym}`} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm">
                                        View details
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default StocksOverview;
