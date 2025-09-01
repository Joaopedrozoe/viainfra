import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/auth'
import { PermissionsProvider } from './contexts/PermissionsContext'
import { UsersProvider } from './contexts/UsersContext'

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <PermissionsProvider>
      <UsersProvider>
        <App />
      </UsersProvider>
    </PermissionsProvider>
  </AuthProvider>
);
