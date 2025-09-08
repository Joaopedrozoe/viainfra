import { useState, useEffect } from 'react';

// Hook para controlar modo demo
// No novo sistema, sempre retorna false (modo real)
export const useDemoMode = () => {
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // Por padrão, sempre usa modo real (conecta com backend)
    setIsDemoMode(false);
  }, []);

  const toggleDemoMode = () => {
    // Modo demo removido - sempre usa modo real
    setIsDemoMode(false);
  };

  const resetDemoData = () => {
    // No-op no modo real
  };

  return {
    isDemoMode,
    toggleDemoMode,
    resetDemoData
  };
};