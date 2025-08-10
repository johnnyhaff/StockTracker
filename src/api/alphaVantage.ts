import { QuoteRow } from '../types/market';

const KEY = import.meta.env.VITE_ALPHA_VANTAGE_KEY as string; // Vite
// For CRA use: const KEY = process.env.REACT_APP_ALPHA_VANTAGE_KEY as string;


export async function fetchDaily(symbol: string): Promise<QuoteRow[]> {
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(symbol)}&apikey=${KEY}`;
    const res = await fetch(url);
    const json = await res.json();

    if (json['Error Message']) throw new Error(`Alpha Vantage: ${json['Error Message']}`);
    if (json['Note']) throw new Error('API call frequency limit reached. Try again shortly.');

    const ts = json['Time Series (Daily)'];
    if (!ts) throw new Error('No time series data found');

    const rows: QuoteRow[] = Object.entries<any>(ts)
        .slice(0, 30)
        .reverse()
        .map(([date, v]) => ({
            date,
            open: parseFloat(v['1. open']),
            high: parseFloat(v['2. high']),
            low: parseFloat(v['3. low']),
            close: parseFloat(v['4. close']),
            volume: parseInt(v['5. volume'], 10),
            price: parseFloat(v['4. close']),
        }));

    return rows;
}
