import { useState } from 'react';

export function useStocks(initial: string[] = ['TSLA', 'PLTR', 'OKLO', 'XOM','KO','MSTR', 'RTX']) {
    const [stocks, setStocks] = useState<string[]>(initial);
    const [selected, setSelected] = useState<string>(initial[0] ?? '');

    const add = (sym: string) => {
        const s = sym.trim().toUpperCase();
        if (s && !stocks.includes(s)) setStocks((prev) => [...prev, s]);
    };
    const remove = (sym: string) => {
        setStocks((prev) => {
            const next = prev.filter((p) => p !== sym);
            if (selected === sym && next.length) setSelected(next[0]);
            return next.length ? next : prev; // keep at least 1
        });
    };

    return { stocks, selected, setSelected, add, remove, setStocks };
}
