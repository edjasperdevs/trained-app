# React/Vite PWA Polish Techniques for Launch

> Research compiled for Trained app launch to 90k fitness enthusiasts
> Stack: React 18 + Vite 5.4 + TypeScript + Zustand + Supabase + Tailwind CSS + Framer Motion

---

## Table of Contents

1. [PWA Optimization](#1-pwa-optimization)
2. [Performance Profiling & Optimization](#2-performance-profiling--optimization)
3. [Bundle Analysis & Code Splitting](#3-bundle-analysis--code-splitting)
4. [Animation Smoothness (60fps)](#4-animation-smoothness-60fps)
5. [Loading States & Skeleton Patterns](#5-loading-states--skeleton-patterns)
6. [Quick Wins vs Deeper Optimizations](#6-quick-wins-vs-deeper-optimizations)
7. [Anti-Patterns to Avoid](#7-anti-patterns-to-avoid)
8. [Launch Checklist](#8-launch-checklist)

---

## 1. PWA Optimization

### Current State Analysis

Your app already has `vite-plugin-pwa@0.19.8` configured with:
- `registerType: 'autoUpdate'` (good for automatic updates)
- Basic workbox with `globPatterns` for static assets
- Manifest with proper icons (192x192, 512x512, maskable)

### Quick Wins

#### 1.1 Enhance Service Worker Caching

Update `vite.config.ts` workbox configuration:

```typescript
workbox: {
  globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
  // Add runtime caching for API calls
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 // 1 hour
        },
        networkTimeoutSeconds: 10
      }
    },
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
        }
      }
    }
  ],
  // Clean old caches on update
  cleanupOutdatedCaches: true,
  // Skip waiting for faster updates
  skipWaiting: true,
  clientsClaim: true
}
```

#### 1.2 Custom Install Prompt

Create a hook for custom install experience:

```typescript
// src/hooks/usePWAInstall.ts
import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setIsInstalled(true));

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const promptInstall = async () => {
    if (!installPrompt) return false;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    setInstallPrompt(null);
    return outcome === 'accepted';
  };

  return { canInstall: !!installPrompt, isInstalled, promptInstall };
}
```

**Best timing for install prompts:**
- After completing a workout (user is engaged)
- After 3+ sessions (user is committed)
- In Settings screen (non-intrusive)

#### 1.3 Update Notification

Add an update banner with `workbox-window`:

```typescript
// src/components/PWAUpdateBanner.tsx
import { useEffect, useState } from 'react';
import { Workbox } from 'workbox-window';

export function PWAUpdateBanner() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [wb, setWb] = useState<Workbox | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const workbox = new Workbox('/sw.js');
      setWb(workbox);

      workbox.addEventListener('waiting', () => {
        setShowUpdate(true);
      });

      workbox.register();
    }
  }, []);

  const handleUpdate = () => {
    wb?.messageSkipWaiting();
    window.location.reload();
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed top-0 inset-x-0 bg-primary text-black p-3 text-center z-50">
      <span>New version available!</span>
      <button onClick={handleUpdate} className="ml-4 underline font-bold">
        Update Now
      </button>
    </div>
  );
}
```

---

## 2. Performance Profiling & Optimization

### Audit Commands

```bash
# Run Lighthouse audit (requires Chrome)
npx lighthouse https://your-app.com --view

# Local audit in CI
npx lighthouse-ci autorun

# Quick performance check
npm run build && npm run preview
# Then open Chrome DevTools > Lighthouse > Generate report

# Analyze Core Web Vitals
npx web-vitals-cli https://your-app.com
```

### Target Metrics

| Metric | Target | Critical |
|--------|--------|----------|
| Largest Contentful Paint (LCP) | < 2.5s | < 4.0s |
| First Input Delay (FID) / INP | < 100ms | < 300ms |
| Cumulative Layout Shift (CLS) | < 0.1 | < 0.25 |
| First Contentful Paint (FCP) | < 1.8s | < 3.0s |
| Total Blocking Time (TBT) | < 200ms | < 600ms |

### React DevTools Profiler

1. Install [React Developer Tools](https://react.dev/learn/react-developer-tools)
2. Open DevTools > Profiler tab
3. Click Record, interact with app, Stop
4. Look for:
   - Components rendering unnecessarily
   - Long render times (> 16ms)
   - Cascading updates

### Add Web Vitals Monitoring

```typescript
// src/lib/vitals.ts
import { onCLS, onFID, onLCP, onFCP, onTTFB } from 'web-vitals';

export function reportWebVitals() {
  onCLS(console.log);
  onFID(console.log);
  onLCP(console.log);
  onFCP(console.log);
  onTTFB(console.log);
}

// In production, send to analytics:
// onLCP((metric) => sendToAnalytics(metric));
```

**Install:** `npm install web-vitals@4`

---

## 3. Bundle Analysis & Code Splitting

### Bundle Analysis Tools

#### Option A: rollup-plugin-visualizer (Recommended)

```bash
npm install -D rollup-plugin-visualizer
```

```typescript
// vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    // ... existing plugins
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ]
});
```

```bash
# Run analysis
npm run build
# Opens stats.html automatically
```

#### Option B: vite-bundle-analyzer

```bash
npm install -D vite-bundle-analyzer
```

```typescript
import { analyzer } from 'vite-bundle-analyzer';

export default defineConfig({
  plugins: [
    // ... existing plugins
    analyzer()
  ]
});
```

### Code Splitting Strategies

#### Route-Based Splitting (High Impact)

Your current App.tsx loads all screens eagerly. Convert to lazy loading:

```typescript
// src/App.tsx - BEFORE (current state)
import { Home, Workouts, Macros, AvatarScreen, Settings, Coach, Achievements } from '@/screens'

// AFTER - lazy load heavy screens
import { lazy, Suspense } from 'react';

const Home = lazy(() => import('@/screens/Home'));
const Workouts = lazy(() => import('@/screens/Workouts'));
const Macros = lazy(() => import('@/screens/Macros'));
const AvatarScreen = lazy(() => import('@/screens/AvatarScreen'));
const Settings = lazy(() => import('@/screens/Settings'));
const Coach = lazy(() => import('@/screens/Coach'));
const Achievements = lazy(() => import('@/screens/Achievements'));

// Wrap routes in Suspense
<Suspense fallback={<ScreenSkeleton />}>
  <Routes>
    <Route path="/" element={<Home />} />
    {/* ... */}
  </Routes>
</Suspense>
```

#### Manual Chunks for Vendor Splitting

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-zustand': ['zustand'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-motion': ['framer-motion'],
          'vendor-icons': ['lucide-react']
        }
      }
    }
  }
});
```

### Tree-Shaking Lucide Icons

You're using `lucide-react@0.563.0`. Ensure you import individual icons:

```typescript
// GOOD - tree-shakeable
import { Home, Settings, Trophy } from 'lucide-react';

// BAD - imports entire library
import * as Icons from 'lucide-react';
```

---

## 4. Animation Smoothness (60fps)

### Framer Motion Best Practices

You're using `framer-motion@11.0.8`. Key optimizations:

#### 4.1 Use GPU-Accelerated Properties

```typescript
// GOOD - GPU accelerated (transform, opacity)
<motion.div
  animate={{ x: 100, opacity: 0.5, scale: 1.1 }}
/>

// AVOID - triggers layout (slow)
<motion.div
  animate={{ width: 200, height: 100, top: 50 }}
/>
```

#### 4.2 Use Motion Values (No Re-renders)

```typescript
import { useMotionValue, useTransform } from 'framer-motion';

function ProgressRing({ progress }: { progress: number }) {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [0, 100], [1, 0]);

  return (
    <motion.div style={{ x, opacity }} />
  );
}
```

#### 4.3 Optimize List Animations

```typescript
// For lists, use layout animations carefully
<motion.ul layout>
  {items.map(item => (
    <motion.li
      key={item.id}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }} // Keep exit animations short
    />
  ))}
</motion.ul>
```

#### 4.4 Reduce Motion for Accessibility

```typescript
// src/hooks/useReducedMotion.ts
import { useReducedMotion } from 'framer-motion';

export function useAnimationConfig() {
  const prefersReduced = useReducedMotion();

  return {
    transition: prefersReduced
      ? { duration: 0 }
      : { duration: 0.3, ease: 'easeOut' },
    animate: prefersReduced ? false : true
  };
}
```

#### 4.5 Use `layoutId` for Shared Element Transitions

```typescript
// Instead of manual animations between screens
<motion.div layoutId={`workout-${workout.id}`}>
  {/* Automatically animates between positions */}
</motion.div>
```

---

## 5. Loading States & Skeleton Patterns

### Recommended Library

```bash
npm install react-loading-skeleton
```

### Implementation Pattern

```typescript
// src/components/ScreenSkeleton.tsx
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export function ScreenSkeleton() {
  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header skeleton */}
      <Skeleton height={40} className="mb-6" baseColor="#1a1a2e" highlightColor="#2a2a4e" />

      {/* Card skeletons */}
      <div className="space-y-4">
        <Skeleton height={120} borderRadius={12} baseColor="#1a1a2e" highlightColor="#2a2a4e" />
        <Skeleton height={120} borderRadius={12} baseColor="#1a1a2e" highlightColor="#2a2a4e" />
        <Skeleton height={80} borderRadius={12} baseColor="#1a1a2e" highlightColor="#2a2a4e" />
      </div>
    </div>
  );
}
```

### Component-Level Skeletons

```typescript
// src/components/WorkoutCard.tsx
import Skeleton from 'react-loading-skeleton';

export function WorkoutCardSkeleton() {
  return (
    <div className="bg-surface rounded-xl p-4">
      <div className="flex items-center gap-3">
        <Skeleton circle width={48} height={48} baseColor="#1a1a2e" />
        <div className="flex-1">
          <Skeleton width="60%" height={20} baseColor="#1a1a2e" />
          <Skeleton width="40%" height={16} className="mt-2" baseColor="#1a1a2e" />
        </div>
      </div>
    </div>
  );
}

// Usage
function WorkoutList() {
  const { data, isLoading } = useWorkouts();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <WorkoutCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return data.map(workout => <WorkoutCard key={workout.id} {...workout} />);
}
```

### Suspense + Skeleton Integration

```typescript
// For lazy-loaded routes
<Suspense fallback={<ScreenSkeleton />}>
  <Outlet />
</Suspense>
```

---

## 6. Quick Wins vs Deeper Optimizations

### Quick Wins (Do This Week)

| Task | Impact | Effort | Command/Action |
|------|--------|--------|----------------|
| Add bundle analyzer | High | 5 min | `npm i -D rollup-plugin-visualizer` |
| Run Lighthouse audit | High | 10 min | DevTools > Lighthouse |
| Lazy load routes | High | 30 min | Convert imports to `lazy()` |
| Add loading skeletons | Medium | 1 hr | Add to main screens |
| Update SW caching | Medium | 30 min | Add runtimeCaching config |
| Vendor chunk splitting | Medium | 15 min | Add manualChunks config |
| Check Lucide imports | Low | 10 min | Ensure named imports |

### Deeper Optimizations (Post-Launch)

| Task | Impact | Effort | Notes |
|------|--------|--------|-------|
| Implement image lazy loading | High | 2-4 hrs | For avatar/badge images |
| Add React Compiler | High | 4-8 hrs | Requires React 19 |
| Virtualize long lists | Medium | 2-4 hrs | If workout history is long |
| Add web vitals monitoring | Medium | 1-2 hrs | Real user metrics |
| Custom service worker (injectManifest) | Medium | 4-6 hrs | Advanced caching control |
| Prefetch critical routes | Low | 1-2 hrs | Link hover prefetching |

---

## 7. Anti-Patterns to Avoid

### PWA Anti-Patterns

| Anti-Pattern | Why It's Bad | What To Do |
|--------------|--------------|------------|
| Cache everything forever | Stale content, storage bloat | Set `maxEntries` and `maxAgeSeconds` |
| No cache versioning | Users stuck on old versions | Use `cleanupOutdatedCaches: true` |
| Ignoring Safari differences | Safari caches more aggressively | Test in Safari, shorter cache times |
| No update notification | Users miss critical updates | Add update banner component |
| Caching auth endpoints | Security risk, stale sessions | Use NetworkOnly for auth |
| Using localStorage for app data | Synchronous, blocks main thread | Use IndexedDB for large data |

### React Performance Anti-Patterns

| Anti-Pattern | Why It's Bad | Fix |
|--------------|--------------|-----|
| Inline objects/arrays as props | New reference every render | Define outside component or `useMemo` |
| Everything in one Context | All consumers re-render | Split contexts by concern |
| Missing `key` on lists | React can't track items | Always use unique, stable keys |
| Index as key | Breaks on reorder/filter | Use item ID |
| useState + useEffect for derived data | Extra renders | Direct computation or `useMemo` |
| Creating functions in render | New reference = re-render children | `useCallback` for stable references |
| Not memoizing expensive components | Unnecessary renders | `React.memo()` for pure components |

### Animation Anti-Patterns

| Anti-Pattern | Why It's Bad | Fix |
|--------------|--------------|-----|
| Animating width/height | Triggers layout (slow) | Animate `scale`, `x`, `y`, `opacity` |
| Long exit animations | Users perceive slowness | Keep under 200ms |
| Animating offscreen elements | Wasted GPU cycles | Use `useInView` |
| React state for animation values | Causes re-renders | Use `useMotionValue` |

---

## 8. Launch Checklist

### Pre-Launch Audit (Run These)

```bash
# 1. Build and analyze
npm run build

# 2. Check bundle size (add visualizer first)
# Opens stats.html with treemap

# 3. Run local preview
npm run preview

# 4. Lighthouse audit (in Chrome DevTools)
# Target: Performance 90+, Accessibility 100, Best Practices 90+

# 5. Test PWA install
# - Chrome: Look for install icon in address bar
# - Safari iOS: Share > Add to Home Screen

# 6. Test offline mode
# DevTools > Network > Offline, reload app

# 7. Test update flow
# Deploy update, verify banner appears
```

### Manual Verification

- [ ] All routes load with skeleton/loading state
- [ ] Animations are smooth (no jank on scroll)
- [ ] PWA installs correctly on iOS and Android
- [ ] App works offline (at least static content)
- [ ] Error boundary catches crashes gracefully
- [ ] No console errors in production build
- [ ] Touch targets are at least 44x44px
- [ ] Text is readable (contrast ratios)

### Sentry Already Configured

Your app has `@sentry/react@10.38.0` - ensure it's capturing:
- JavaScript errors
- Performance transactions
- Web Vitals metrics

---

## Tools & Versions Summary

| Tool | Version | Purpose |
|------|---------|---------|
| vite-plugin-pwa | ^0.19.8 | PWA generation (already installed) |
| workbox-window | ^7.0.0 | SW update detection (already installed) |
| rollup-plugin-visualizer | ^5.12.0 | Bundle analysis |
| web-vitals | ^4.2.0 | Performance monitoring |
| react-loading-skeleton | ^3.4.0 | Loading states |
| framer-motion | ^11.0.8 | Animations (already installed) |

---

## References

- [Vite Plugin PWA Documentation](https://vite-pwa-org.netlify.app/)
- [Workbox Caching Strategies](https://vite-pwa-org.netlify.app/workbox/)
- [Motion Performance Guide](https://motion.dev/docs/performance)
- [React Performance Best Practices 2025](https://dev.to/alex_bobes/react-performance-optimization-15-best-practices-for-2025-17l9)
- [Advanced Vite + React Guide](https://codeparrot.ai/blogs/advanced-guide-to-using-vite-with-react-in-2025)
- [Web Vitals](https://web.dev/vitals/)
- [PWA Installation Best Practices](https://web.dev/learn/pwa/installation-prompt)
- [React Loading Skeleton](https://github.com/dvtng/react-loading-skeleton)
