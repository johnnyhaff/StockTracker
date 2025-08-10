import { SMA, EMA } from './math';
import { Bollinger, ATR } from './volatility';
import { MACD, ADX } from './trend';
import { RSI, Stochastic } from './momentum';
import { OBV, MFI } from './volume';
import { EnrichedRow, QuoteRow } from '../types/market';

export const enrichWithIndicators = (rows: QuoteRow[]): EnrichedRow[] => {
    if (!rows?.length) return [];

    const closes = rows.map((d) => d.close);
    const highs  = rows.map((d) => d.high);
    const lows   = rows.map((d) => d.low);
    const vols   = rows.map((d) => d.volume);

    const sma20 = SMA(closes, 20);
    const ema12 = EMA(closes, 12);
    const ema26 = EMA(closes, 26);
    const macd  = MACD(closes);
    const bb    = Bollinger(closes, 20, 2);
    const atr14 = ATR(highs, lows, closes, 14);
    const adx   = ADX(highs, lows, closes, 14);
    const stoch = Stochastic(highs, lows, closes, 14, 3);
    const obv   = OBV(closes, vols);
    const mfi14 = MFI(highs, lows, closes, vols, 14);
    const rsi14 = RSI(closes, 14);

    return rows.map((row, i) => ({
        ...row,
        price: row.close,
        sma: sma20[i] ?? null,
        ema: ema12[i] ?? null,
        ema26: ema26[i] ?? null,
        macd: macd.macd[i] ?? null,
        macdSignal: macd.signal[i] ?? null,
        macdHist: macd.hist[i] ?? null,
        bbMid: bb[i]?.bbMid ?? null,
        bbUpper: bb[i]?.bbUpper ?? null,
        bbLower: bb[i]?.bbLower ?? null,
        bbWidth: bb[i]?.bbWidth ?? null,
        atr14: atr14[i] ?? null,
        diPlus: adx.diPlus[i] ?? null,
        diMinus: adx.diMinus[i] ?? null,
        adx: adx.adx[i] ?? null,
        stochK: stoch.k[i] ?? null,
        stochD: stoch.d[i] ?? null,
        obv: obv[i] ?? null,
        mfi14: mfi14[i] ?? null,
        rsi: rsi14[i] ?? null,
    }));
};
