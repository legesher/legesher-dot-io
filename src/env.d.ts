/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly BUTTONDOWN_API_KEY: string;
  readonly BUTTONDOWN_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 