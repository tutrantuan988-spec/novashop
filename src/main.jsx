import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { I18nProvider } from './context/I18nContext';
import { queryClient } from './lib/queryClient';
import { initMonitoring } from './lib/monitoring';
import App from './App';
import './styles.css';

initMonitoring();

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (import.meta.env.PROD && clerkKey?.startsWith('pk_test_')) {
  console.warn('⚠️ CLERK: Đang dùng development key trên production! Truy cập clerk.com → Production instance để lấy pk_live_');
}

const useClerk = !!clerkKey && clerkKey.startsWith('pk_');

const DevKeyBanner = () =>
  (import.meta.env.PROD && clerkKey?.startsWith('pk_test_')) ? (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: '#ff4444', color: 'white',
      textAlign: 'center', padding: '8px',
      fontSize: '13px', zIndex: 99999
    }}>
      ⚠️ Clerk chưa cấu hình production key — Đăng nhập sẽ bị giới hạn
    </div>
  ) : null;

const AppShell = () => (
  <I18nProvider>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </I18nProvider>
);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {useClerk ? (
      <ClerkProvider
        publishableKey={clerkKey}
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-xl'
          }
        }}
      >
        <>
          <AppShell />
          <DevKeyBanner />
        </>
      </ClerkProvider>
    ) : (
      <>
        <AppShell />
        <DevKeyBanner />
      </>
    )}
  </React.StrictMode>
);
