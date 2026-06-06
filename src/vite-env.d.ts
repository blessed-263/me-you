/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_USE_MOCK_DATA?: string;
  readonly VITE_MEDUSA_API_URL?: string;
  readonly VITE_MEDUSA_PUBLISHABLE_KEY?: string;
  readonly VITE_MEDUSA_REGION_ID?: string;
  readonly VITE_MEDUSA_CURRENCY_CODE?: string;
  readonly VITE_YME_ORGANIZER_ID?: string;
  readonly VITE_AMPEX_FRONTEND_URL?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_GOOGLE_SITE_VERIFICATION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
