import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/auth'
import { PermissionsProvider } from './contexts/PermissionsContext'

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <PermissionsProvider>
      <App />
    </PermissionsProvider>
  </AuthProvider>
);
