export const rolling = <T, R>(
    arr: T[],
    period: number,
    fn: (window: T[], i: number) => R
): (R | null)[] =>
    arr.map((_, i) => (i < period - 1 ? null : fn(arr.slice(i - period + 1, i + 1), i)));

export const SMA = (series: number[], period: number): (number | null)[] =>
    rolling(series, period, (win) => win.reduce((a, b) => a + b, 0) / period);

export const EMA = (series: number[], period: number): (number | null)[] => {
    const k = 2 / (period + 1);
    const out = new Array<number | null>(series.length).fill(null);
    let ema: number | null = null;
    for (let i = 0; i < series.length; i++) {
        const v = series[i];
        ema = ema == null ? v : (v - ema) * k + ema;
        out[i] = ema;
    }
    return out;
};
