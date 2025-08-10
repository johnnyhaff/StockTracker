import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import { fetchDaily } from '../api/alphaVantage';
import { enrichWithIndicators } from '../indicators';
import type { EnrichedRow, QuoteRow } from '../types/market';
import { getLastFetched, getQuotes, putQuotes, setLastFetched } from '../db/stockDB';

/** -------- Types -------- */
type Cached = { rows: EnrichedRow[]; lastUpdated?: number };
type MapType = Record<string, Cached>;
type Status = { loading: boolean; status: string; error: string | null };

type Ctx = {
    data: MapType;
    symbols: string[];
    setSymbols: (s: string[]) => void;
    addSymbol: (s: string) => void;
    removeSymbol: (s: string) => void;
    getData: (symbol: string) => EnrichedRow[];
    getLastUpdated: (symbol: string) => number | undefined;
    prefetch: (symbols: string[] | string) => Promise<void>;
} & Status;

/** -------- Context -------- */
const StockDataContext = createContext<Ctx | null>(null);

/** -------- Constants / helpers -------- */
const LS_SYMBOLS_KEY = 'qfd:symbols';
const LS_INITIAL_HASH_KEY = 'qfd:initialHash';

// legacy localStorage cache (older builds stored enriched rows here)
// we use it as a last-resort fallback during hydration
const LS_CACHE_PREFIX = 'qfd:cache:'; // value: { ts: number, rows: EnrichedRow[] }

const HISTORY_DAYS = 60;              // how many days to keep/use
const FRESH_TTL_MS = 15 * 60 * 1000;  // 15 minutes considered fresh

const normalize = (s: string) => s.trim().toUpperCase();
const saveSymbols = (symbols: string[]) => {
    try { localStorage.setItem(LS_SYMBOLS_KEY, JSON.stringify(symbols)); } catch {}
};
const loadSymbols = (fallback: string[]) => {
    try {
        const raw = localStorage.getItem(LS_SYMBOLS_KEY);
        if (!raw) return fallback;
        const arr = JSON.parse(raw);
        return Array.isArray(arr) && arr.length ? arr.map(normalize) : fallback;
    } catch { return fallback; }
};

// legacy enriched cache loader (optional)
function loadLegacyEnriched(sym: string): { rows: EnrichedRow[]; ts?: number } | null {
    try {
        const raw = localStorage.getItem(`${LS_CACHE_PREFIX}${normalize(sym)}`);
        if (!raw) return null;
        const obj = JSON.parse(raw) as { ts?: number; rows?: EnrichedRow[] };
        if (!obj?.rows?.length) return null;
        return { rows: obj.rows, ts: obj.ts };
    } catch {
        return null;
    }
}

/** -------- Provider -------- */
export const StockDataProvider: React.FC<{
    initialSymbols?: string[];
    persistSymbols?: boolean;
    resetOnInitialChange?: boolean;
    children: React.ReactNode;
}> = ({
          initialSymbols = ['AAPL', 'GOOGL', 'MSFT', 'NVDA'],
          persistSymbols = true,
          resetOnInitialChange = true,
          children
      }) => {
    const initialList = initialSymbols.map(normalize);
    const initialHash = JSON.stringify(initialList);

    const [symbols, setSymbols] = useState<string[]>(
        () => (persistSymbols ? loadSymbols(initialList) : initialList)
    );
    const [data, setData] = useState<MapType>({});
    const [loading, setLoading] = useState(false); // reflects background network prefetch
    const [status, setStatus] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => { if (persistSymbols) saveSymbols(symbols); }, [symbols, persistSymbols]);

    useEffect(() => {
        if (!persistSymbols) { setSymbols(initialList); return; }
        if (!resetOnInitialChange) return;
        try {
            const storedHash = localStorage.getItem(LS_INITIAL_HASH_KEY);
            if (storedHash !== initialHash) {
                setSymbols(initialList);
                saveSymbols(initialList);
                localStorage.setItem(LS_INITIAL_HASH_KEY, initialHash);
            }
        } catch {
            setSymbols(initialList);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialHash, persistSymbols, resetOnInitialChange]);

    const busy = useRef(false);

    const getData = useCallback(
        (symbol: string) => data[normalize(symbol)]?.rows ?? [],
        [data]
    );
    const getLastUpdated = useCallback(
        (symbol: string) => data[normalize(symbol)]?.lastUpdated,
        [data]
    );

    /** Hydrate from local DB (or legacy localStorage) before any network calls. */
    const hydrateFromDB = useCallback(async (syms: string[]) => {
        if (!syms.length) return;

        const hydrated: MapType = {};
        for (const s of syms) {
            const sym = normalize(s);

            // 1) try IndexedDB (quotes + lastFetched)
            const [rows, lastTs] = await Promise.all([
                getQuotes(sym, { limit: HISTORY_DAYS }),
                getLastFetched(sym),
            ]);

            if (rows.length) {
                const derivedTs =
                    lastTs ??
                    new Date(rows[rows.length - 1]!.date + 'T16:00:00Z').getTime();
                hydrated[sym] = {
                    rows: enrichWithIndicators(rows),
                    lastUpdated: derivedTs,
                };
                continue;
            }

            // 2) fallback: legacy localStorage enriched cache
            const legacy = loadLegacyEnriched(sym);
            if (legacy?.rows?.length) {
                hydrated[sym] = {
                    rows: legacy.rows, // already enriched historically
                    lastUpdated: legacy.ts ?? Date.now(),
                };
            }
        }

        if (Object.keys(hydrated).length) {
            // show last known data immediately
            setData(prev => ({ ...prev, ...hydrated }));
        }
    }, []);

    /** Fetch one symbol: prefer DB if fresh; else API; always return {rows, lastUpdated} */
    const fetchOne = useCallback(
        async (sym: string): Promise<{ rows: EnrichedRow[]; lastUpdated: number }> => {
            const symbol = normalize(sym);

            // 1) Try IndexedDB
            const [dbRows, lastTs] = await Promise.all([
                getQuotes(symbol, { limit: HISTORY_DAYS }),
                getLastFetched(symbol),
            ]);

            // Derive a timestamp if meta missing (use newest candle’s date @ 16:00 UTC)
            const derivedTs =
                lastTs ??
                (dbRows.length
                    ? new Date(dbRows[dbRows.length - 1]!.date + 'T16:00:00Z').getTime()
                    : Date.now());

            const isFresh = !!lastTs && Date.now() - lastTs < FRESH_TTL_MS;
            if (dbRows.length >= Math.min(HISTORY_DAYS, 20) && (isFresh || lastTs == null)) {
                return { rows: enrichWithIndicators(dbRows), lastUpdated: derivedTs };
            }

            // 2) API → persist quotes and lastFetched
            try {
                const apiRows: QuoteRow[] = await fetchDaily(symbol);
                await putQuotes(symbol, apiRows);
                const ts = Date.now();
                await setLastFetched(symbol, ts);
                const merged = apiRows.length ? apiRows : dbRows;
                return { rows: enrichWithIndicators(merged), lastUpdated: ts };
            } catch {
                // 3) Fallback: serve DB if present, else mock (don't persist mock)
                if (dbRows.length) {
                    return { rows: enrichWithIndicators(dbRows), lastUpdated: derivedTs };
                }

                // mock -> enrich
                let base = Math.random() * 200 + 50;
                let vol = Math.random() * 1_000_000 + 500_000;
                const mock: QuoteRow[] = Array.from({ length: HISTORY_DAYS }).map((_, i) => {
                    const d = new Date(); d.setDate(d.getDate() - (HISTORY_DAYS - i));
                    base += (Math.random() - 0.5) * base * 0.02;
                    const open = base;
                    const high = open + Math.random() * open * 0.03;
                    const low  = open - Math.random() * open * 0.03;
                    const close = low + Math.random() * (high - low);
                    vol *= 0.8 + Math.random() * 0.4;
                    return {
                        date: d.toISOString().split('T')[0],
                        open: +open.toFixed(2),
                        high: +high.toFixed(2),
                        low:  +low.toFixed(2),
                        close:+close.toFixed(2),
                        volume: Math.floor(vol),
                        price: +close.toFixed(2),
                    };
                });
                return { rows: enrichWithIndicators(mock), lastUpdated: Date.now() };
            }
        },
        []
    );

    /** Fetch many symbols with AV rate-limiting pauses */
    const prefetch = useCallback(
        async (syms: string[] | string) => {
            const list = (Array.isArray(syms) ? syms : [syms]).map(normalize).filter(Boolean);
            if (!list.length || busy.current) return;

            busy.current = true;
            setLoading(true);
            setError(null);

            const next: MapType = {};
            let ok = 0;
            const fail: string[] = [];

            for (let i = 0; i < list.length; i++) {
                const sym = list[i];

                if (data[sym]?.rows?.length) {
                    // keep already-hydrated rows by default; we'll overwrite only if fresher arrives
                    next[sym] = data[sym];
                    ok++;
                }

                try {
                    setStatus(`Fetching ${sym}... (${i + 1}/${list.length})`);
                    const { rows, lastUpdated } = await fetchOne(sym);

                    // only overwrite if we got newer data than what we have
                    const currentTs = next[sym]?.lastUpdated ?? data[sym]?.lastUpdated ?? 0;
                    if (lastUpdated >= currentTs) {
                        next[sym] = { rows, lastUpdated };
                    } // else keep the existing (older) rows already there

                    ok++;
                    if (i < list.length - 1) {
                        setStatus(`Rate limit pause… Next: ${list[i + 1]}`);
                        await new Promise((r) => setTimeout(r, 12_000));
                    }
                } catch {
                    fail.push(sym);
                }
            }

            if (Object.keys(next).length) {
                setData((prev) => ({ ...prev, ...next }));
            }
            setLoading(false);
            setStatus('');
            if (ok && fail.length) setError(`Loaded ${ok}/${list.length}. Failed: ${fail.join(', ')}`);
            else if (fail.length === list.length) setError('All API calls failed. Using mock data.');
            busy.current = false;
        },
        [data, fetchOne]
    );

    // 1) Hydrate from DB (and legacy cache) to show last known data immediately
    // 2) Then refresh in the background
    useEffect(() => {
        (async () => {
            await hydrateFromDB(symbols);
            void prefetch(symbols);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const value = useMemo<Ctx>(() => ({
        data,
        symbols,
        setSymbols,
        addSymbol: (s: string) => {
            const sym = normalize(s);
            if (!sym) return;
            setSymbols((prev) => (prev.includes(sym) ? prev : [...prev, sym]));
        },
        removeSymbol: (s: string) => {
            const sym = normalize(s);
            setSymbols((prev) => prev.filter((x) => x !== sym));
        },
        getData,
        getLastUpdated,
        prefetch,
        loading,
        status,
        error,
    }), [data, symbols, getData, getLastUpdated, prefetch, loading, status, error]);

    return <StockDataContext.Provider value={value}>{children}</StockDataContext.Provider>;
};

/** Hook */
export const useStockCache = () => {
    const ctx = useContext(StockDataContext);
    if (!ctx) throw new Error('useStockCache must be used within StockDataProvider');
    return ctx;
};
