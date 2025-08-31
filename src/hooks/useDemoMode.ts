
// Hybrid mode - supports both demo and production
import { useState, useEffect } from 'react';

export const useDemoMode = () => {
  // Check if we're in development (Lovable) or production environment
  const isLovableEnvironment = window.location.hostname.includes('sandbox.lovable.dev');
  
  const [isDemoMode, setIsDemoMode] = useState(() => {
    // If in Lovable sandbox, allow demo mode toggle
    if (isLovableEnvironment) {
      const saved = localStorage.getItem('demo-mode');
      return saved ? JSON.parse(saved) : true; // Default to demo mode in development
    }
    // In production, always false
    return false;
  });

  useEffect(() => {
    if (isLovableEnvironment) {
      localStorage.setItem('demo-mode', JSON.stringify(isDemoMode));
    }
  }, [isDemoMode, isLovableEnvironment]);

  const toggleDemoMode = () => {
    if (isLovableEnvironment) {
      setIsDemoMode(!isDemoMode);
    } else {
      console.log('Demo mode toggle disabled in production build');
    }
  };

  const resetDemoData = () => {
    if (isLovableEnvironment) {
      localStorage.removeItem('demo-conversations');
      localStorage.removeItem('demo-contacts');
      localStorage.removeItem('demo-channels');
      localStorage.removeItem('demo-auth');
      window.location.reload();
    } else {
      console.log('Demo data reset disabled in production build');
    }
  };

  return {
    isDemoMode: isLovableEnvironment ? isDemoMode : false,
    toggleDemoMode,
    resetDemoData
  };
};
