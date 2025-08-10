import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStockCache } from '../context/StockDataContext';
import { PriceBands } from '../components/charts/PriceBands';
import { Volume } from '../components/charts/Volume';
import { RSIChart } from '../components/charts/RSIChart';
import { Candles } from '../components/charts/Candles';
import { MACDPanel } from '../components/charts/MACDPanel';
import { ADXPanel } from '../components/charts/ADXPanel';
import { Recommendation } from '../components/Recommendation';
import { Loader } from 'lucide-react';

const StockDetail: React.FC = () => {
    const { symbol = '' } = useParams();

    // ⬅️ make sure we pull these from the context
    const { getData, getLastUpdated, prefetch, loading, status } = useStockCache();

    const rows = getData(symbol);
    const lastUpdated = getLastUpdated(symbol);

    // If navigated directly and cache is empty, fetch just this symbol
    useEffect(() => {
        if (symbol && rows.length === 0) {
            void prefetch(symbol);
        }
        // we intentionally don't add `rows` to deps to avoid re-fetch loop
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [symbol, prefetch]);

    const latest = rows[rows.length - 1];

    return (
        <div className="min-h-screen w-screen overflow-x-hidden bg-gray-900 text-white py-6">
            <div className="max-w-none w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
                <div className="flex items-center justify-between mb-6">
                    <div className="min-w-0">
                        <h1 className="text-3xl font-bold truncate">{symbol} — Details</h1>
                        <p className="text-gray-400">
                            Last close: {latest?.close != null ? `$${latest.close.toFixed(2)}` : '—'}
                        </p>
                        <p className="text-gray-500 text-sm">
                            Last updated:{' '}
                            {lastUpdated ? new Date(lastUpdated).toLocaleString() : '—'}
                        </p>
                    </div>
                    <Link
                        to="/"
                        className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 whitespace-nowrap"
                    >
                        ← Back to overview
                    </Link>
                </div>

                {loading && (
                    <div className="bg-blue-900 border border-blue-700 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-3">
                            <Loader className="animate-spin text-blue-400" size={20} />
                            <div>
                                <p className="text-blue-200 font-medium">Loading {symbol}…</p>
                                <p className="text-blue-300 text-sm">{status}</p>
                            </div>
                        </div>
                    </div>
                )}

                <Recommendation data={rows} symbol={symbol} />

                {/* Full-width grid; renders even if empty so layout doesn't jump */}
                <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(360px,1fr))]">
                    {rows.length > 0 ? (
                        <>
                            <div className="min-w-0 w-full"><PriceBands data={rows} /></div>
                            <div className="min-w-0 w-full"><Volume data={rows} /></div>
                            <div className="min-w-0 w-full"><RSIChart data={rows} /></div>
                            <div className="min-w-0 w-full"><Candles data={rows} /></div>
                            <div className="min-w-0 w-full"><MACDPanel data={rows} /></div>
                            <div className="min-w-0 w-full"><ADXPanel data={rows} /></div>
                        </>
                    ) : (
                        <div className="bg-gray-800 rounded-xl p-12 text-center text-gray-400">
                            {loading ? 'Loading charts…' : 'No data yet.'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StockDetail;
