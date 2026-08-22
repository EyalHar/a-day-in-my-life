import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { PrivateSessionProvider } from './hooks/PrivateSessionContext';
import './styles/global.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <PrivateSessionProvider>
          <App />
        </PrivateSessionProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
