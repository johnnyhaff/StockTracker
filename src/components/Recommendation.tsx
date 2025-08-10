import React, { useMemo } from 'react';
import { EnrichedRow } from '../types/market';
import { generateRecommendation } from '../logic/recommend';
import { Target, CheckCircle, XCircle, Minus } from 'lucide-react';

const color = (action: string) =>
    action === 'BUY' ? 'text-green-400 bg-green-900 border-green-700' :
        action === 'SELL' ? 'text-red-400 bg-red-900 border-red-700' :
            'text-yellow-400 bg-yellow-900 border-yellow-700';

const icon = (action: string) =>
    action === 'BUY' ? <CheckCircle size={20} /> :
        action === 'SELL' ? <XCircle size={20} /> :
            <Minus size={20} />;

export const Recommendation: React.FC<{ data: EnrichedRow[]; symbol: string }> = ({ data, symbol }) => {
    const rec = useMemo(() => generateRecommendation(data), [data]);
    return (
        <div className={`rounded-xl p-6 mb-6 border ${color(rec.action)}`}>
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0">{icon(rec.action) ?? <Target size={20} />}</div>
                <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{rec.action} {symbol}</h3>
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-800 text-gray-300">
              {rec.confidence} CONFIDENCE
            </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div><p className="text-sm text-gray-300 mb-1">Signal Strength</p><p className="font-medium">{Math.abs(rec.score)}/5</p></div>
                        <div><p className="text-sm text-gray-300 mb-1">Bullish Signals</p><p className="text-green-400 font-medium">{rec.bullishScore}</p></div>
                        <div><p className="text-sm text-gray-300 mb-1">Bearish Signals</p><p className="text-red-400 font-medium">{rec.bearishScore}</p></div>
                    </div>
                    <ul className="text-sm space-y-1">
                        {rec.reasons.map((r, i) => (<li key={i} className="flex items-start gap-2"><span className="text-gray-500 mt-1">•</span><span>{r}</span></li>))}
                    </ul>
                    <div className="mt-4 p-3 bg-gray-800 bg-opacity-50 rounded-lg">
                        <p className="text-xs text-gray-400">
                            <strong>Disclaimer:</strong> Technical analysis only; not financial advice.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
