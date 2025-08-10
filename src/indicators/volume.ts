export const OBV = (closes: number[], volumes: number[]): number[] => {
    const out = new Array<number>(closes.length).fill(0);
    for (let i = 1; i < closes.length; i++) {
        if (closes[i] > closes[i - 1]) out[i] = out[i - 1] + volumes[i];
        else if (closes[i] < closes[i - 1]) out[i] = out[i - 1] - volumes[i];
        else out[i] = out[i - 1];
    }
    return out;
};

export const MFI = (
    highs: number[], lows: number[], closes: number[], volumes: number[], period = 14
): (number | null)[] => {
    const tp = closes.map((_, i) => (highs[i] + lows[i] + closes[i]) / 3);
    const raw = tp.map((t, i) => t * volumes[i]);
    const pos: number[] = [0], neg: number[] = [0];
    for (let i = 1; i < tp.length; i++) {
        if (tp[i] > tp[i - 1]) { pos[i] = raw[i]; neg[i] = 0; }
        else if (tp[i] < tp[i - 1]) { pos[i] = 0; neg[i] = raw[i]; }
        else { pos[i] = 0; neg[i] = 0; }
    }
    return closes.map((_, i) => {
        if (i < period) return null;
        const ps = pos.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        const ns = neg.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        if (ns === 0) return 100;
        const mr = ps / ns;
        return 100 - 100 / (1 + mr);
    });
};
