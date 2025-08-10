import React from 'react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, Legend } from 'recharts';
import { EnrichedRow } from '../../types/market';

export const ADXPanel: React.FC<{ data: EnrichedRow[] }> = ({ data }) => (
    <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4">ADX & DI (14)</h3>
        <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', borderRadius: '8px' }} />
                <Legend />
                <Line type="monotone" dataKey="adx" stroke="#3b82f6" dot={false} name="ADX" />
                <Line type="monotone" dataKey="diPlus" stroke="#10b981" dot={false} name="+DI" />
                <Line type="monotone" dataKey="diMinus" stroke="#ef4444" dot={false} name="−DI" />
            </LineChart>
        </ResponsiveContainer>
    </div>
);
