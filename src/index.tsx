import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import StocksOverview from './pages/StocksOverview';
import StockDetail from './pages/StockDetail';
import { StockDataProvider } from './context/StockDataContext';
import DbViewer from './pages/DBViewer';
import './index.css';

const router = createBrowserRouter([
    { path: '/', element: <StocksOverview /> },
    { path: '/stock/:symbol', element: <StockDetail /> },
    { path: '/db', element: <DbViewer /> },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <StockDataProvider
            initialSymbols={['TSLA','OKLO','MSTR','XOM']}
            persistSymbols={true}
            resetOnInitialChange={true}   // when you update the list in code, users get the new defaults
        >
            <RouterProvider router={router} />
        </StockDataProvider>
    </React.StrictMode>

);
if (import.meta.env.DEV) {
    import('./db/stockDB').then(m => {
        (window as any).qfdTest = m.__selfTest__;
    });
}