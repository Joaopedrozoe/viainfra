
import { useState, useEffect } from 'react';

export const useDemoMode = () => {
  const [isDemoMode, setIsDemoMode] = useState(() => {
    const saved = localStorage.getItem('demo-mode');
    return saved ? JSON.parse(saved) : true; // Default to demo mode
  });

  useEffect(() => {
    localStorage.setItem('demo-mode', JSON.stringify(isDemoMode));
  }, [isDemoMode]);

  const toggleDemoMode = () => {
    setIsDemoMode(!isDemoMode);
  };

  const resetDemoData = () => {
    localStorage.removeItem('demo-conversations');
    localStorage.removeItem('demo-contacts');
    localStorage.removeItem('demo-channels');
    localStorage.removeItem('demo-auth');
    window.location.reload();
  };

  return {
    isDemoMode,
    toggleDemoMode,
    resetDemoData
  };
};
