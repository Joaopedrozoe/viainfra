/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Required environment variables
  readonly VITE_API_URL: string;
  readonly VITE_EVOLUTION_API_URL: string;
  readonly VITE_APP_ENV: 'development' | 'production';
  
  // Optional environment variables
  readonly VITE_API_TIMEOUT?: string;
  readonly VITE_ASSETS_URL?: string;
  readonly VITE_ANALYTICS_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}