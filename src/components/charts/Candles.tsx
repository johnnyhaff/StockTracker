import React from 'react';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import { EnrichedRow } from '../../types/market';
import CandlestickShape from './CandlestickShape';

export const Candles: React.FC<{ data: EnrichedRow[] }> = ({ data }) => {
    const sliced = data.slice(-20); // show recent 20 sessions
    return (
        <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4">OHLC Candlestick</h3>
            <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={sliced}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', borderRadius: '8px' }}
                        content={({ active, payload, label }) => {
                            if (active && payload && payload[0]) {
                                const d = payload[0].payload as EnrichedRow;
                                const change = d.close - d.open;
                                const pct = d.open ? ((change / d.open) * 100).toFixed(2) : '0.00';
                                return (
                                    <div className="bg-gray-800 p-3 rounded-lg border border-gray-600">
                                        <p className="text-sm text-gray-300 mb-2">{label}</p>
                                        <p className="text-blue-400">Open: ${d.open.toFixed(2)}</p>
                                        <p className="text-green-400">High: ${d.high.toFixed(2)}</p>
                                        <p className="text-red-400">Low: ${d.low.toFixed(2)}</p>
                                        <p className="text-yellow-400">Close: ${d.close.toFixed(2)}</p>
                                        <p className={`${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            Change: ${change.toFixed(2)} ({pct}%)
                                        </p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    {/* Dummy Bar series to render the custom candle for each datum */}
                    <Bar dataKey="high" shape={(props: any) => <CandlestickShape {...props} />} />

                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};
