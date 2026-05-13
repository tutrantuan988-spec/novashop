import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { initMonitoring } from './lib/monitoring';
import App from './App';
import './styles.css';

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const useClerk = !!clerkKey;
initMonitoring();

const AppShell = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </QueryClientProvider>
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
