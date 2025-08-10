import { EnrichedRow } from '../types/market';

export interface Recommendation {
    action: 'BUY' | 'SELL' | 'HOLD';
    confidence: 'LOW' | 'MEDIUM' | 'HIGH';
    reasons: string[];
    score: number;          // net (bull - bear) after boosts/penalties
    bullishScore: number;   // raw bull points
    bearishScore: number;   // raw bear points
}

/** Robust, null-safe recommendation generator. */
export function generateRecommendation(data: EnrichedRow[] | undefined | null): Recommendation {
    const rows = Array.isArray(data) ? data : [];
    const n = rows.length;

    // Not enough candles -> HOLD
    if (n === 0) {
        return {
            action: 'HOLD',
            confidence: 'LOW',
            reasons: ['No data yet'],
            score: 0,
            bullishScore: 0,
            bearishScore: 0,
        };
    }

    // Use previous = latest if we don't have two rows yet
    const a = rows[n - 1]!;
    const b = rows[n - 2] ?? rows[n - 1]!;

    const reasons: string[] = [];
    let bull = 0;
    let bear = 0;

    // --- RSI ---
    const rsiA = a.rsi ?? 50;
    const rsiB = b.rsi ?? rsiA;
    if (rsiA <= 30) { reasons.push('RSI oversold (≤30)'); bull += 2; }
    else if (rsiA >= 70) { reasons.push('RSI overbought (≥70)'); bear += 2; }
    else {
        if (rsiA > 50 && rsiB <= 50) { reasons.push('RSI crossed > 50'); bull += 1; }
        if (rsiA < 50 && rsiB >= 50) { reasons.push('RSI crossed < 50'); bear += 1; }
    }

    // --- Price vs moving averages ---
    const sma = a.sma ?? a.close;
    const ema = a.ema ?? a.close;
    const ema26 = a.ema26 ?? ema;

    const aboveMAs = a.close > sma && a.close > ema;
    const belowMAs = a.close < sma && a.close < ema;
    const emaTrendUp = ema > ema26;
    const emaTrendDn = ema < ema26;

    if (aboveMAs && emaTrendUp) { reasons.push('Price > SMA & EMA; EMA12 > EMA26'); bull += 2; }
    if (belowMAs && emaTrendDn) { reasons.push('Price < SMA & EMA; EMA12 < EMA26'); bear += 2; }

    // --- MACD ---
    const macdA = a.macd ?? 0;
    const macdS = a.macdSignal ?? 0;
    const macdB = b.macd ?? macdA;
    const macdSB = b.macdSignal ?? macdS;
    const histA = a.macdHist ?? 0;

    if (macdB <= macdSB && macdA > macdS) { reasons.push('MACD bullish crossover'); bull += 2; }
    if (macdB >= macdSB && macdA < macdS) { reasons.push('MACD bearish crossover'); bear += 2; }
    if (histA > 0 && macdA > 0) { bull += 1; }
    if (histA < 0 && macdA < 0) { bear += 1; }

    // --- Bollinger Bands ---
    const upper = a.bbUpper ?? Number.POSITIVE_INFINITY;
    const lower = a.bbLower ?? Number.NEGATIVE_INFINITY;
    const widthA = a.bbWidth ?? 0;
    const widthB = b.bbWidth ?? widthA;

    if (a.close < lower) { reasons.push('Close below lower Bollinger (mean-reversion)'); bull += 1; }
    if (a.close > upper) { reasons.push('Close above upper Bollinger (pullback risk)'); bear += 1; }
    if (widthA > widthB * 1.2) {
        reasons.push('Bollinger width expanding (volatility breakout)');
        if (a.close > ema) { bull += 1; } else { bear += 1; }
    }

    // --- ADX / DI ---
    const adx = a.adx ?? 0;
    const diPlus = a.diPlus ?? 0;
    const diMinus = a.diMinus ?? 0;
    if (adx >= 20) {
        if (diPlus > diMinus) { reasons.push(`Trend strength (ADX ${Math.round(adx)}) favoring +DI`); bull += 1; }
        if (diMinus > diPlus) { reasons.push(`Trend strength (ADX ${Math.round(adx)}) favoring −DI`); bear += 1; }
    }

    // --- Stochastic ---
    const kA = a.stochK ?? 50, dA = a.stochD ?? 50;
    const kB = b.stochK ?? kA,  dB = b.stochD ?? dA;
    if (kB <= 20 && kA > kB && dA > dB) { reasons.push('Stochastic turning up from oversold'); bull += 1; }
    if (kB >= 80 && kA < kB && dA < dB) { reasons.push('Stochastic turning down from overbought'); bear += 1; }

    // --- OBV / MFI ---
    const obvA = a.obv ?? 0, obvB = b.obv ?? obvA;
    if (obvA > obvB && a.close > b.close) { reasons.push('OBV rising with price'); bull += 1; }
    if (obvA < obvB && a.close < b.close) { reasons.push('OBV falling with price'); bear += 1; }

    const mfi = a.mfi14 ?? 50;
    if (mfi >= 80) { reasons.push('MFI overbought (≥80)'); bear += 1; }
    if (mfi <= 20) { reasons.push('MFI oversold (≤20)'); bull += 1; }

    // --- Momentum & volume ---
    const pct = b.close ? ((a.close - b.close) / b.close) * 100 : 0;
    if (pct > 2) { reasons.push(`Up momentum (+${pct.toFixed(2)}%)`); bull += 1; }
    if (pct < -2) { reasons.push(`Down momentum (${pct.toFixed(2)}%)`); bear += 1; }

    if (a.volume > (b.volume ?? a.volume) * 1.5) {
        if (a.close >= a.open) { bull += 1; } else { bear += 1; }
        reasons.push('Volume spike');
    }

    // --- Conviction tweaks ---
    let net = bull - bear;
    const atrRatio = a.atr14 && a.close ? a.atr14 / a.close : 0;
    if (adx >= 25) net += 1;                 // stronger trend, higher conviction
    if (atrRatio > 0.05) net -= 1;           // very volatile → reduce conviction

    // --- Map to action / confidence ---
    let action: Recommendation['action'] = 'HOLD';
    let confidence: Recommendation['confidence'] = 'LOW';
    if (net >= 4) { action = 'BUY'; confidence = 'HIGH'; }
    else if (net >= 2) { action = 'BUY'; confidence = 'MEDIUM'; }
    else if (net <= -4) { action = 'SELL'; confidence = 'HIGH'; }
    else if (net <= -2) { action = 'SELL'; confidence = 'MEDIUM'; }

    if (!reasons.length) reasons.push('Insufficient data');

    return {
        action,
        confidence,
        reasons,
        score: net,
        bullishScore: bull,
        bearishScore: bear
    };
}
