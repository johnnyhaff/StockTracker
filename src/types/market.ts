export type ISODate = string; // "YYYY-MM-DD"

export interface QuoteRow {
    date: ISODate;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    price?: number; // alias of close
}

export interface EnrichedRow extends QuoteRow {
    // Moving Averages
    sma?: number | null;
    ema?: number | null;
    ema26?: number | null;

    // RSI
    rsi?: number | null;

    // Bollinger
    bbMid?: number | null;
    bbUpper?: number | null;
    bbLower?: number | null;
    bbWidth?: number | null;

    // MACD
    macd?: number | null;
    macdSignal?: number | null;
    macdHist?: number | null;

    // ATR / ADX
    atr14?: number | null;
    adx?: number | null;
    diPlus?: number | null;
    diMinus?: number | null;

    // Stochastic
    stochK?: number | null;
    stochD?: number | null;

    // Volume-based
    obv?: number | null;
    mfi14?: number | null;
}
