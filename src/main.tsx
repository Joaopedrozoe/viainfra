import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AppErrorBoundary, isChunkLoadError, reloadOnceForNewVersion } from './components/AppErrorBoundary'

// Após uma nova publicação, arquivos antigos deixam de existir: recarrega uma vez em vez de tela branca.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  reloadOnceForNewVersion();
});
window.addEventListener('unhandledrejection', (event) => {
  if (isChunkLoadError(event.reason)) reloadOnceForNewVersion();
});

createRoot(document.getElementById("root")!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
