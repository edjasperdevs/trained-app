# Feature Landscape: WellTrained V2

**Domain:** Freemium fitness gamification app with DP/rank progression, HealthKit integration, archetypes, quests, and evolving avatar
**Researched:** 2026-02-27
**Overall confidence:** HIGH (V2 spec analyzed, existing codebase audited, RevenueCat/HealthKit verified)

---

## Existing State (Systems Being Replaced or Extended)

| Existing System | V2 Change | Impact |
|---|---|---|
| XP system (99 levels, weekly claiming) | Replace with DP (15 ranks, daily accumulation) | Full rewrite of `xpStore.ts` |
| Avatar mood system (happy/sad/neutral) | Replace with 5-stage evolving silhouette | Full rewrite of `avatarStore.ts` |
| Red signal color (#D55550) | Replace with lime (#C8FF00) | CSS token swap in `index.css` |
| Achievement badges (20+ badges) | Keep as complementary system alongside DP | Modify unlock conditions to reference DP/ranks |
| Streak system | Rename to "Obedience Streak", keep mechanics | Terminology change, future multiplier hook |
| Coach dashboard (~4,500 lines in-app) | Strip entirely | Delete Coach.tsx, CoachGuard, related routes |
| No subscription system | Add RevenueCat freemium paywall | New subscription flow, feature gating |
| No health data | Add HealthKit steps + sleep | New data source, new DP actions |

---

## Table Stakes

Features the V2 app MUST have. Missing any = incomplete product.

| Feature | Why Expected | Complexity | Notes |
|---|---|---|---|
| **DP earning on workout completion** | Core value loop -- train, earn points | Low | Replace XP award in existing workout completion flow |
| **DP earning on meal tracking** | Second core action users already perform | Low | Hook into existing macro store save flow |
| **15-rank progression display** | Rank is the primary motivator replacing levels | Medium | New progress UI, rank name/badge display on home screen |
| **Rank-up celebration** | Users need dopamine reward at milestones | Medium | Full-screen rank-up animation with haptic feedback |
| **Lime (#C8FF00) design system** | V2 brand identity is built around this | Medium | CSS token migration across all components |
| **Freemium paywall** | Revenue model depends on this | High | RevenueCat integration, entitlement checks, paywall UI |
| **Subscription restore** | Apple requires "Restore Purchases" | Low | Single RevenueCat API call, but must be accessible from settings |
| **Steps tracking (HealthKit + manual)** | New DP action, spec requires it | Medium | HealthKit integration + manual fallback input |
| **Sleep tracking (HealthKit + manual)** | New DP action, spec requires it | Medium | HealthKit integration + manual fallback input |
| **Bro archetype (free)** | Default archetype for all free users | Low | Generalist with no DP modifiers |
| **Obedience Streak rename** | Brand alignment | Low | Terminology change in UI only |
| **Coach dashboard removal** | Coach functionality moved to separate app | Low (deletion) | Remove ~4,500 lines, clean up routes and imports |
| **DP persistence in Supabase** | Server must know rank for future features | Medium | New migration, sync logic |

---

## Differentiators

Features that make WellTrained unique. Not expected by users, but drive engagement and subscription conversion.

| Feature | Value Proposition | Complexity | Premium? | Notes |
|---|---|---|---|---|
| **Premium archetypes (Himbo/Brute/Pup/Bull)** | Personalized DP bonuses matching training style | Medium | YES | Core subscription driver. Each archetype boosts different DP actions. |
| **Evolving avatar silhouette (5 stages)** | Visual progress tied to rank milestones | High | YES (stages 3-5) | Requires 5 SVG illustrations. Stage changes at ranks 1, 4, 8, 12, 15. |
| **Protocol Orders (daily/weekly quests)** | Bonus DP, keeps daily engagement fresh | High | Partial (weekly = premium) | Quest generation logic, completion tracking, rotation schedule. |
| **Bull archetype PR bonus** | Unique +50 DP for personal records | Medium | YES | Requires PR detection in workout store (compare weight/reps to historical best). |
| **Archetype DP modifier visualization** | Show users exactly how their archetype boosts earnings | Low | NO (visible to all, incentivizes upgrade) | UI showing "Himbo: +50% training, +25% meals" on DP breakdown screen. |

---

## Anti-Features

Features to explicitly NOT build in V2.

| Anti-Feature | Why Avoid | What to Do Instead |
|---|---|---|
| Streak multiplier | Spec says "future phase" -- multiplicative DP would require rebalancing the entire rank curve | Track streak count, display it, but do NOT apply a multiplier to DP earning. Add a `streakMultiplierEnabled: false` flag for future activation. |
| Community leaderboard | Potential V3 feature. Requires social graph, privacy considerations, abuse prevention | Persist DP in Supabase for future use. Do not build any social/comparison UI. |
| AI workout generation | Coach expertise is the product -- AI would undercut the brand value | Continue supporting coach-assigned workouts from welltrained-coach. |
| Web-based subscription purchase | Apple requires IAP for digital subscriptions in iOS apps. Web purchase would violate guidelines | Subscriptions only purchasable in iOS app via RevenueCat. Web users see "Subscribe in the app" messaging. |
| Android support | Out of scope for V2 (iOS only) | HealthKit calls gated behind `Capacitor.isNativePlatform()`. RevenueCat supports Android but do not configure it. |
| Custom themes / app icons | Deferred to post-launch premium feature | Build with token system that supports future theming, but ship only Dopamine Noir V2. |
| Light mode | Dark-only brand identity | Do not add theme toggle or light color tokens. |
| In-app coaching/messaging | Moved to welltrained-coach app | Strip coach UI entirely from trained-app. |

---

## Feature Dependencies

```
HealthKit Integration --> Steps DP Action
HealthKit Integration --> Sleep DP Action
Steps DP Action --> DP Store (must exist first)
Sleep DP Action --> DP Store (must exist first)
RevenueCat Setup --> Paywall UI
RevenueCat Setup --> Premium Feature Gating
Premium Feature Gating --> Archetype Lock (Himbo/Brute/Pup/Bull)
Premium Feature Gating --> Avatar Stages 3-5 Lock
Premium Feature Gating --> Weekly Protocol Orders Lock
DP Store --> Rank Progression Display
DP Store --> Rank-Up Celebration
Archetype Store --> DP Modifier Calculations
Archetype Store --> Archetype Selection UI
Coach Dashboard Removal --> (independent, no downstream deps)
Design System Migration --> (foundation for all new UI)
Supabase DP Migration --> DP Cloud Sync
RevenueCat Webhook --> Subscription Status in Supabase
```

**Critical path:** Design System Migration must come first (all new screens use V2 tokens). DP Store must exist before HealthKit or archetype features can award points. RevenueCat must be configured before any premium gating.

---

## MVP Recommendation

**Phase 1 priorities (must ship together):**

1. Design system migration (lime tokens, surface colors) -- foundation for everything visual
2. DP store + 15-rank progression -- replaces XP, core value loop
3. Coach dashboard removal -- reduces codebase complexity before building new features
4. Basic DP earning (workout + meals + protein + check-in) -- leverages existing actions

**Phase 2 priorities:**

5. HealthKit integration (steps + sleep) -- new DP actions
6. Archetype selection + DP modifiers -- premium differentiation begins
7. RevenueCat subscription + paywall -- monetization

**Phase 3 priorities:**

8. Evolving avatar silhouette -- premium visual reward
9. Protocol Orders (quests) -- engagement layer
10. Rank-up celebrations -- polish

**Defer to post-V2:**

- Streak multiplier (requires rank curve rebalancing)
- Community leaderboard (requires social infrastructure)
- Custom themes (requires theming abstraction beyond current single-theme)

---

## Sources

- WellTrained V2 Master Specification (in-repo)
- Existing codebase analysis (`xpStore.ts`, `avatarStore.ts`, `achievementsStore.ts`, `index.css`)
- [RevenueCat Documentation](https://www.revenuecat.com/docs/)
- [Apple App Store Review Guidelines - In-App Purchase](https://developer.apple.com/app-store/review/guidelines/#in-app-purchase)
