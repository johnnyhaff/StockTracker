import { EMA, SMA } from './math';

export const ATR = (
    highs: number[], lows: number[], closes: number[], period = 14
): (number | null)[] => {
    const tr = highs.map((h, i) => {
        if (i === 0) return h - lows[i];
        return Math.max(h - lows[i], Math.abs(h - closes[i - 1]), Math.abs(lows[i] - closes[i - 1]));
    });
    return EMA(tr, period);
};

export const Bollinger = (series: number[], period = 20, mult = 2) => {
    const ma = SMA(series, period);
    return series.map((_, i) => {
        if (i < period - 1) return { bbMid: null, bbUpper: null, bbLower: null, bbWidth: null as number | null };
        const win = series.slice(i - period + 1, i + 1);
        const mean = ma[i] as number;
        const variance = win.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / period;
        const sd = Math.sqrt(variance);
        const upper = mean + mult * sd;
        const lower = mean - mult * sd;
        return { bbMid: mean, bbUpper: upper, bbLower: lower, bbWidth: mean ? (upper - lower) / mean : null };
    });
};
