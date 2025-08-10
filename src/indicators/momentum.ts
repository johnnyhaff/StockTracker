import { SMA } from './math';

export const RSI = (closes: number[], period = 14): (number | null)[] => {
    const out = new Array<number | null>(closes.length).fill(null);
    for (let i = 0; i < closes.length; i++) {
        if (i < period) { out[i] = 50; continue; }
        let gain = 0, loss = 0;
        for (let j = i - period + 1; j <= i; j++) {
            const diff = closes[j] - closes[j - 1];
            if (diff > 0) gain += diff; else loss -= diff;
        }
        if (loss === 0) { out[i] = 100; continue; }
        const rs = gain / period / (loss / period);
        out[i] = 100 - 100 / (1 + rs);
    }
    return out;
};

export const Stochastic = (
    highs: number[], lows: number[], closes: number[], kPeriod = 14, dPeriod = 3
) => {
    const k = closes.map((c, i) => {
        if (i < kPeriod - 1) return null;
        const hh = Math.max(...highs.slice(i - kPeriod + 1, i + 1));
        const ll = Math.min(...lows.slice(i - kPeriod + 1, i + 1));
        return ll === hh ? 50 : (100 * (c - ll)) / (hh - ll);
    });
    const d = SMA(k.map((v) => (v == null ? 50 : v)), dPeriod);
    return { k, d };
};
