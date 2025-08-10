import React from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import { EnrichedRow } from '../../types/market';

export const Volume: React.FC<{ data: EnrichedRow[] }> = ({ data }) => (
    <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4">Trading Volume</h3>
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', borderRadius: '8px' }} />
                <Bar dataKey="volume" fill="#8b5cf6" />
            </BarChart>
        </ResponsiveContainer>
    </div>
);
