/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MONGODB_URI: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}