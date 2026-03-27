import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { SplashScreen } from './components/ui/AnimatedLogo';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } }
});

function Root() {
  const [splash, setSplash] = useState(() => {
    const seen = sessionStorage.getItem('iragi_splash_v5');
    if (seen) return false;
    sessionStorage.setItem('iragi_splash_v5', '1');
    return true;
  });

  return (
    <>
      {splash && <SplashScreen onComplete={() => setSplash(false)} />}
      <App />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Root />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#FEFAF5',
              color: '#3D2314',
              border: '1px solid #DDD5C8',
              borderRadius: '14px',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              boxShadow: '0 8px 32px rgba(61,35,20,0.12)',
              padding: '12px 16px',
            },
            success: { iconTheme: { primary: '#C9A84C', secondary: 'white' } },
            error:   { iconTheme: { primary: '#B87060', secondary: 'white' } },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
