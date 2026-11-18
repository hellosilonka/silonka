import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    rules: {
      'react-refresh/only-export-components': ['error', { allowConstantExport: true, allowExportNames: ["useCookieConsent", "getCookiePreferences", "ORGANIZATION_SCHEMA", "WEBSITE_SCHEMA", "productSchema", "breadcrumbSchema", "faqSchema", "articleSchema", "collectionSchema", "productListSchema", "badgeVariants", "buttonGroupVariants", "buttonVariants", "useFormField", "navigationMenuTriggerStyle", "useSidebar", "toggleVariants", "useAuth", "useCart", "CURRENCIES", "useCurrency", "useGeo"] }],
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
])
