import { EMA } from './math';
import { ATR } from './volatility';

export const MACD = (series: number[], fast = 12, slow = 26, signalP = 9) => {
    const emaFast = EMA(series, fast);
    const emaSlow = EMA(series, slow);
    const macd = series.map((_, i) => (emaFast[i] ?? 0) - (emaSlow[i] ?? 0));
    const signal = EMA(macd.map((v) => v ?? 0), signalP);
    const hist = macd.map((v, i) => v - (signal[i] ?? 0));
    return { macd, signal, hist };
};

export const ADX = (
    highs: number[], lows: number[], closes: number[], period = 14
) => {
    const len = highs.length;
    const dmPlus = new Array<number>(len).fill(0);
    const dmMinus = new Array<number>(len).fill(0);
    for (let i = 1; i < len; i++) {
        const up = highs[i] - highs[i - 1];
        const dn = lows[i - 1] - lows[i];
        dmPlus[i] = up > dn && up > 0 ? up : 0;
        dmMinus[i] = dn > up && dn > 0 ? dn : 0;
    }
    const atr = ATR(highs, lows, closes, period);
    const smDMp = EMA(dmPlus, period);
    const smDMm = EMA(dmMinus, period);
    const diPlus = smDMp.map((v, i) => (atr[i] ? (100 * (v ?? 0)) / (atr[i] as number) : null));
    const diMinus = smDMm.map((v, i) => (atr[i] ? (100 * (v ?? 0)) / (atr[i] as number) : null));
    const dx = diPlus.map((p, i) => {
        const m = diMinus[i];
        if (p == null || m == null || p + m === 0) return null;
        return (100 * Math.abs(p - m)) / (p + m);
    });
    const adx = EMA(dx.map((x) => x ?? 0), period);
    return { diPlus, diMinus, adx };
};
