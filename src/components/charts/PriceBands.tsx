import React from 'react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import { EnrichedRow } from '../../types/market';

export const PriceBands: React.FC<{ data: EnrichedRow[] }> = ({ data }) => (
    <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4">Price, MAs & Bollinger</h3>
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', borderRadius: '8px' }} />
                <Legend />
                <Line type="monotone" dataKey="close" stroke="#3b82f6" strokeWidth={2} name="Close" dot={false} />
                <Line type="monotone" dataKey="sma" stroke="#10b981" strokeWidth={1} strokeDasharray="5 5" name="SMA (20)" dot={false} />
                <Line type="monotone" dataKey="ema" stroke="#f59e0b" strokeWidth={1} strokeDasharray="3 3" name="EMA (12)" dot={false} />
                <Line type="monotone" dataKey="bbUpper" stroke="#9CA3AF" strokeDasharray="4 4" name="BB Upper" dot={false} />
                <Line type="monotone" dataKey="bbMid" stroke="#6B7280" strokeDasharray="2 2" name="BB Mid" dot={false} />
                <Line type="monotone" dataKey="bbLower" stroke="#9CA3AF" strokeDasharray="4 4" name="BB Lower" dot={false} />
            </LineChart>
        </ResponsiveContainer>
    </div>
);
