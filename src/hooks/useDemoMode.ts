
// Sempre em modo demo para Lovable
import { useState, useEffect } from 'react';

export const useDemoMode = () => {
  const [isDemoMode] = useState(true); // SEMPRE true para Lovable

  const toggleDemoMode = () => {
    // No-op - sempre demo
  };

  const resetDemoData = () => {
    localStorage.removeItem('demo-conversations');
    localStorage.removeItem('demo-contacts');
    localStorage.removeItem('demo-channels');
    localStorage.removeItem('demo-auth');
    window.location.reload();
  };

  return {
    isDemoMode: true, // SEMPRE true
    toggleDemoMode,
    resetDemoData
  };
};
