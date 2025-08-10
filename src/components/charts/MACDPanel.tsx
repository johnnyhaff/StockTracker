import React from 'react';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, Bar, Legend } from 'recharts';
import { EnrichedRow } from '../../types/market';

export const MACDPanel: React.FC<{ data: EnrichedRow[] }> = ({ data }) => (
    <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4">MACD (12,26,9)</h3>
        <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', borderRadius: '8px' }} />
                <Legend />
                <Line type="monotone" dataKey="macd" stroke="#10b981" dot={false} name="MACD" />
                <Line type="monotone" dataKey="macdSignal" stroke="#f59e0b" dot={false} name="Signal" />
                <Bar dataKey="macdHist" fill="#60a5fa" name="Histogram" />
            </ComposedChart>
        </ResponsiveContainer>
    </div>
);
