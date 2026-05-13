import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { I18nProvider } from './context/I18nContext';
import { queryClient } from './lib/queryClient';
import App from './App';
import './styles.css';

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const useClerk = !!clerkKey && clerkKey.startsWith('pk_') && clerkKey.length > 80;

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
      <ClerkProvider publishableKey={clerkKey}>
        <AppShell />
      </ClerkProvider>
    ) : (
      <AppShell />
    )}
  </React.StrictMode>
);
