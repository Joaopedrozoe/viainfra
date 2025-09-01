
// Sempre em modo demo para Lovable
import { useState, useEffect } from 'react';

export const useDemoMode = () => {
  // Check if running in production (not on lovable.dev)
  const isProduction = !window.location.hostname.includes('lovable.dev');
  const [isDemoMode] = useState(!isProduction);

  const toggleDemoMode = () => {
    if (isProduction) {
      console.log('Demo mode disabled in production');
      return;
    }
    // Allow toggle only in development
  };

  const resetDemoData = () => {
    if (isProduction) {
      console.log('Demo data reset disabled in production');
      return;
    }
    localStorage.removeItem('demo-conversations');
    localStorage.removeItem('demo-contacts');
    localStorage.removeItem('demo-channels');
    localStorage.removeItem('demo-auth');
    window.location.reload();
  };

  return {
    isDemoMode: !isProduction,
    toggleDemoMode,
    resetDemoData
  };
};
