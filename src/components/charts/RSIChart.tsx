import React from 'react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, Legend } from 'recharts';
import { EnrichedRow } from '../../types/market';

export const RSIChart: React.FC<{ data: EnrichedRow[] }> = ({ data }) => (
    <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4">RSI (14)</h3>
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', borderRadius: '8px' }} />
                <Legend />
                <Line type="monotone" dataKey="rsi" stroke="#ef4444" strokeWidth={2} name="RSI" dot={false} />
                <Line type="monotone" dataKey={() => 70} stroke="#dc2626" strokeWidth={1} strokeDasharray="2 2" name="Overbought (70)" dot={false} />
                <Line type="monotone" dataKey={() => 30} stroke="#16a34a" strokeWidth={1} strokeDasharray="2 2" name="Oversold (30)" dot={false} />
            </LineChart>
        </ResponsiveContainer>
    </div>
);
