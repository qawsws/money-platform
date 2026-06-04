import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import { SearchProvider } from './context/SearchContext';

const queryClient = new QueryClient();

async function initApp() {
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true') {
    try {
      const { worker } = await import('./mocks/browser');
      await worker.start({
        serviceWorker: { url: '/mockServiceWorker.js', options: { type: 'classic' } },
        onUnhandledRequest: 'bypass',
      });
      console.log('[MSW] worker started');
    } catch (error) {
      console.error('[MSW] failed to start', error);
    }
  }

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <SearchProvider>
              <App />
            </SearchProvider>
          </AuthProvider>
        </BrowserRouter>
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </StrictMode>,
  );
}

initApp();
