# Technology Stack

**Analysis Date:** 2026-02-04

## Languages

**Primary:**
- TypeScript ~5.6.2 - Frontend application with strict type checking
- JavaScript (ES2020 target) - Build outputs and configuration

**Secondary:**
- SQL - Supabase database migrations and schema (`supabase/migrations/`, `supabase/schema.sql`)

## Runtime

**Environment:**
- Node.js (implicit, from package.json type: "module")

**Package Manager:**
- npm 10+ (lockfile: `package-lock.json` present)

## Frameworks

**Core:**
- React 18.3.1 - UI framework
- React Router DOM 6.22.3 - Client-side routing
- Zustand 4.5.2 - State management (lightweight alternative to Redux)

**UI Components & Styling:**
- Tailwind CSS 3.4.3 - Utility-first CSS framework
- Lucide React 0.563.0 - Icon library (replacing emojis)
- Framer Motion 11.0.8 - Animation library

**Backend/Data:**
- Supabase JS Client 2.93.3 - PostgreSQL database and auth client
- Vite 5.4.2 - Build tool and dev server
- Vite PWA 0.19.8 - Progressive Web App plugin
- Workbox Window 7.0.0 - Service worker integration

**Testing:**
- Vitest 1.6.0 - Unit/integration test runner
- React Testing Library 16.3.2 - Component testing
- Testing Library User Event 14.6.1 - User interaction simulation
- JSDOM 28.0.0 - DOM implementation for Node.js

**Error Tracking:**
- Sentry React 10.38.0 - Error monitoring and crash reporting

**Build/Dev:**
- Vite React Plugin 4.3.1 - React fast refresh support
- TypeScript ESLint 8.3.0 - Linting with TypeScript support
- ESLint 9.9.1 - JavaScript linter
- PostCSS 8.4.38 - CSS transformation (required by Tailwind)
- Autoprefixer 10.4.19 - CSS vendor prefixing
- Sharp 0.34.5 - Image optimization (for PWA icons)

## Key Dependencies

**Critical:**
- @supabase/supabase-js 2.93.3 - Database, auth, real-time sync
- react 18.3.1 - Core UI library
- zustand 4.5.2 - App state (user profile, workouts, XP, macros, achievements)

**Infrastructure:**
- @sentry/react 10.38.0 - Production error tracking (optional, dev disabled)
- vite 5.4.2 - Fast dev server and production bundler
- vite-plugin-pwa 0.19.8 - PWA manifest, service worker generation

**External APIs (via fetch):**
- USDA FoodData Central API - Food nutrition data (optional fallback: Open Food Facts)
- Lemon Squeezy License API - License key validation for app access
- Plausible Analytics - Privacy-friendly analytics (via script tag in HTML)

## Configuration

**Environment:**
- Configuration via `.env` variables (Vite VITE_* prefix for frontend access)
- Required vars (from `.env.example`):
  - `VITE_SUPABASE_URL` - Supabase project URL
  - `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- Optional vars:
  - `VITE_SENTRY_DSN` - Error tracking (production only)
  - `VITE_LEMONSQUEEZY_API_URL` - License validation API
  - `VITE_MASTER_ACCESS_CODE` - Override access code for testing
  - `VITE_USDA_API_KEY` - Food API key (defaults to DEMO_KEY)

**Build:**
- `vite.config.ts` - Vite configuration with PWA setup, path aliases, test configuration
- `tsconfig.json` - TypeScript config (ES2020 target, strict mode enabled)
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS setup for Tailwind
- `.eslintrc.js` - ESLint configuration (TypeScript + React hooks)

**Deployment:**
- `vercel.json` - Vercel deployment config (rewrite rules for SPA, cache headers for assets)
- `.vercelignore` - Files to exclude from Vercel deployment

## Platform Requirements

**Development:**
- Node.js with npm
- Modern browser (ES2020 JavaScript support)
- Environment variables configured in `.env`

**Production:**
- Deployment target: Vercel (configured in `vercel.json`)
- Progressive Web App (installable on iOS/Android)
- Service worker caching via Workbox
- Cache strategies: immutable for assets, no-cache for service worker

---

*Stack analysis: 2026-02-04*
