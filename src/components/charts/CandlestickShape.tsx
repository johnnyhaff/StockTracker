import React from 'react';
import { EnrichedRow } from '../../types/market';

type ShapeProps = {
    payload: EnrichedRow;
    x: number; y: number; width: number; height: number;
};

const CandlestickShape: React.FC<ShapeProps> = ({ payload, x, y, width, height }) => {
    if (!payload?.open && payload?.open !== 0) return null;
    const { open, high, low, close } = payload;
    const isGreen = close >= open;
    const color = isGreen ? '#10b981' : '#ef4444';
    const range = high - low;
    if (range === 0) return null;

    const wickX = x + width / 2;
    const bodyW = width * 0.6;
    const bodyX = x + (width - bodyW) / 2;

    const highY = y;
    const lowY = y + height;
    const openY = y + ((high - open) / range) * height;
    const closeY = y + ((high - close) / range) * height;

    const bodyTop = Math.min(openY, closeY);
    const bodyBottom = Math.max(openY, closeY);
    const bodyH = Math.max(bodyBottom - bodyTop, 2);

    return (
        <g>
            <line x1={wickX} y1={highY} x2={wickX} y2={lowY} stroke={color} strokeWidth={1} />
            <rect x={bodyX} y={bodyTop} width={bodyW} height={bodyH}
                  fill={isGreen ? 'none' : color} stroke={color} strokeWidth={2} />
        </g>
    );
};

export default React.memo(CandlestickShape);
