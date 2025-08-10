import { openDB, IDBPDatabase } from 'idb';
import type { QuoteRow } from '../types/market';

/**
 * DB: qfd
 * Stores:
 *  - quotes  (key: [symbol, date], index by_symbol_date)
 *  - meta    (key: symbol) { symbol, lastFetched:number }
 */
const DB_NAME = 'qfd';
const DB_VER = 2;
const STORE_QUOTES = 'quotes';
const STORE_META = 'meta';

type QRow = QuoteRow & { symbol: string };
type MetaRow = { symbol: string; lastFetched: number };

let _db: Promise<IDBPDatabase> | null = null;

function getDB() {
    if (!_db) {
        _db = openDB(DB_NAME, DB_VER, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('quotes')) {
                    const quotes = db.createObjectStore('quotes', { keyPath: ['symbol', 'date'] });
                    quotes.createIndex('by_symbol_date', ['symbol', 'date'], { unique: true });
                }
                if (!db.objectStoreNames.contains('meta')) {
                    db.createObjectStore('meta', { keyPath: 'symbol' });
                }
            },
        });
    }
    return _db;
}

/** Write/merge quotes for a symbol. */
export async function putQuotes(symbol: string, rows: QuoteRow[]) {
    if (!rows?.length) return;
    const sym = symbol.toUpperCase();
    const db = await getDB();
    const tx = db.transaction(STORE_QUOTES, 'readwrite');
    for (const r of rows) {
        // Ensure ISO date like "YYYY-MM-DD"
        if (!r.date || r.date.length < 8) continue;
        const rec: QRow = { ...r, symbol: sym };
        await tx.store.put(rec);
    }
    await tx.done;
}

/** Read quotes for a symbol (ascending). */
export async function getQuotes(
    symbol: string,
    opts?: { from?: string; to?: string; limit?: number }
): Promise<QuoteRow[]> {
    const sym = symbol.toUpperCase();
    const db = await getDB();
    const idx = db.transaction(STORE_QUOTES).store.index('by_symbol_date');

    const lower: [string, string] = [sym, opts?.from ?? ''];
    const upper: [string, string] = [sym, opts?.to ?? '\uffff'];
    const range = IDBKeyRange.bound(lower, upper);

    const rows: QRow[] = await idx.getAll(range);
    const pruned = opts?.limit ? rows.slice(-opts.limit) : rows;
    return pruned.map(({ symbol: _s, ...rest }) => rest);
}

/** Update lastFetched meta for a symbol. */
export async function setLastFetched(symbol: string, ts: number = Date.now()) {
    const sym = symbol.toUpperCase();
    const db = await getDB();
    await db.put(STORE_META, { symbol: sym, lastFetched: ts } as MetaRow);
}

/** Read lastFetched meta for a symbol. */
export async function getLastFetched(symbol: string): Promise<number | undefined> {
    const sym = symbol.toUpperCase();
    const db = await getDB();
    const row = (await db.get(STORE_META, sym)) as MetaRow | undefined;
    return row?.lastFetched;
}

/** Utilities (optional) */
export async function clearAll() {
    const db = await getDB();
    await Promise.all([db.clear(STORE_QUOTES), db.clear(STORE_META)]);
}

export async function countQuotes(symbol: string): Promise<number> {
    const sym = symbol.toUpperCase();
    const db = await getDB();
    const idx = db.transaction(STORE_QUOTES).store.index('by_symbol_date');
    const range = IDBKeyRange.bound([sym, ''], [sym, '\uffff']);
    let n = 0;
    for (let c = await idx.openCursor(range); c; c = await c.continue()) n++;
    return n;
}

/**
 * Self-test: writes 2 rows for TEST and returns count.
 * Call in console:  window.qfdTest()
 */
export async function __selfTest__() {
    const symbol = 'TEST';
    const today = new Date();
    const d = (offset: number) => {
        const t = new Date(today); t.setDate(today.getDate() - offset);
        return t.toISOString().slice(0, 10); // YYYY-MM-DD
    };
    await putQuotes(symbol, [
        { date: d(1), open: 10, high: 12, low: 9, close: 11, volume: 1000, price: 11 },
        { date: d(0), open: 11, high: 13, low: 10, close: 12, volume: 1100, price: 12 },
    ]);
    await setLastFetched(symbol, Date.now());
    return {
        rows: await getQuotes(symbol),
        lastFetched: await getLastFetched(symbol),
        count: await countQuotes(symbol),
    };
}
