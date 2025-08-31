// Production-ready hook to replace useDemoMode
// This hook returns false for demo mode since we're preparing for production

import { useState, useEffect } from 'react';

export const useDemoMode = () => {
  // In production, always return false for demo mode
  const [isDemoMode] = useState(false);

  const toggleDemoMode = () => {
    // No-op in production
    console.log('Demo mode toggle disabled in production build');
  };

  const resetDemoData = () => {
    // No-op in production
    console.log('Demo data reset disabled in production build');
  };

  return {
    isDemoMode,
    toggleDemoMode,
    resetDemoData
  };
};