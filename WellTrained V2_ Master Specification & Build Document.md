# WellTrained V2: Master Specification & Build Document

**Document Type:** Master Build Specification
**Version:** 2.0
**Author:** Manus AI

---

## Introduction

This document contains the complete and consolidated specification for the development of the **WellTrained V2** mobile application. It is intended to be a single source of truth for a development team (human or AI) to understand the project's vision, design, mechanics, and phased implementation plan. It synthesizes all prior analysis, design work, and strategic decisions into one actionable brief.

The project is an evolution of an existing fitness application, migrating it to a new, premium design system and layering in a sophisticated, psychologically-driven RPG/gamification system tailored to the WellTrained brand identity.

## Part 1: UI/UX Design System - "Dopamine Noir V2"

This section details the complete visual and interactive design language for the app. The aesthetic is premium, restrained, and confident, inspired by brands like Equinox and MacroFactor.

### 1.1. Design Philosophy

*   **Restrained Confidence:** The design is intentionally minimalist. It does not shout. The UI is a quiet, supportive container for the user’s effort.
*   **Signal vs. Noise:** Color is used exclusively as a signal for important information (progress, achievements, calls to action). The background is monochromatic to eliminate noise.
*   **Typography as UI:** The hierarchy and weight of the typography do the heavy lifting of guiding the user’s attention. Large, confident headings and clean body copy are paramount.
*   **Tactile & Responsive:** While visually minimal, the app should feel responsive and tactile. Micro-interactions, subtle haptics, and smooth transitions are critical.

### 1.2. Color System

| Color Name | HSL Value | Hex Value | Usage |
|:---|:---|:---|:---|
| **Background** | `240 10% 3.9%` | `#0A0A0A` | App background |
| **Surface** | `240 3.7% 15.9%` | `#26282B` | Card, popover, and input backgrounds |
| **Border** | `240 3.7% 15.9%` | `#26282B` | Borders and dividers |
| **Foreground** | `0 0% 98%` | `#FAFAFA` | Primary text |
| **Muted** | `240 5% 64.9%` | `#A1A1AA` | Secondary/muted text |
| **Signal (Primary)** | `74 99% 50%` | `#C8FF00` | CTAs, progress bars, active states, highlights |
| **Signal FG** | `240 10% 3.9%` | `#0A0A0A` | Text on Signal-colored elements |
| **Destructive** | `0 62.8% 30.6%` | `#B91C1C` | Destructive actions (e.g., delete) |

### 1.3. Typography

*   **Display Font:** `Oswald` (Variable) - Used for large stats, rank numbers, and major headings.
*   **Interface Font:** `Inter` (Variable) - Used for all body copy, labels, and general UI text.
*   **Data Font:** `JetBrains Mono` (Variable) - Used for numerical data, tables, and anywhere a fixed-width feel is needed.

### 1.4. Component Design

*   **Buttons:** Primary buttons use the `Signal` background with `Signal FG` text. They have a subtle hover state and a `0.75rem` border radius.
*   **Cards:** Use the `Surface` background with a `Border` color. No heavy shadows.
*   **Progress Bars:** The track is `Surface`, and the fill is `Signal`.
*   **Navigation:** A standard bottom tab bar with icons that are `Muted` by default and `Signal` when active.

### 1.5. Avatar Evolution

The user avatar is a key visual element that reflects progress. It is not a cartoon character but a stylized, evolving silhouette.

*   **Concept:** A series of 5 vector illustrations depicting a male physique evolving in detail and definition.
*   **Stages:** The illustration changes at key Rank milestones (e.g., Rank 1, 4, 8, 12, 15).
*   **Style:** Minimalist, sharp lines, with a geometric accent that becomes more complex at higher stages. The final stage is a highly detailed, anatomical figure.

---

## Part 2: Gamification & Progression System

This section details the core RPG mechanics that drive user engagement and retention.

### 2.1. Discipline Points (DP)

DP is the primary currency of the system, earned by completing daily tasks.

| Action | Base DP |
|:---|:---|
| Training Completed | +50 |
| Tracked Meals | +15 |
| 10k+ Steps | +10 |
| Hit Protein Target | +25 |
| 7h+ Sleep | +10 |

### 2.2. Rank Progression (15-Rank System)

The app uses a 15-rank progression system designed to take ~24-27 weeks to master, providing frequent early rewards and a satisfying long-term endgame.

| Rank | Rank Name | Cumulative DP |
|:----:|:-----------|:---------------|
| 1 | Initiate | 250 |
| 2 | Compliant | 750 |
| 3 | Obedient | 1,500 |
| 4 | Disciplined | 2,250 |
| 5 | Conditioned | 3,000 |
| 6 | Proven | 3,750 |
| 7 | Hardened | 4,750 |
| 8 | Forged | 5,750 |
| 9 | Trusted | 6,750 |
| 10 | Enforcer | 7,750 |
| 11 | Seasoned | 9,000 |
| 12 | Elite | 10,250 |
| 13 | Apex | 11,500 |
| 14 | Sovereign | 13,000 |
| 15 | Master | 14,750 |

### 2.3. Archetypes

Upon starting, users select one of four Archetypes that modify their DP earnings to align with their primary goal.

*   **Himbo (Aesthetics):** Bonus DP for `Training Completed` and `Tracked Meals`.
*   **Brute (Strength):** Bonus DP for `Training Completed` and `7h+ Sleep`.
*   **Pup (Endurance):** Bonus DP for `10k+ Steps` and `Hit Protein Target`.
*   **Bull (Performance):** Bonus DP for `Training Completed`, `Hit Protein Target`, `7h+ Sleep`, and a unique **+50 DP** for logging a new Personal Record (PR).

### 2.4. Streaks & Quests

*   **Obedience Streak:** Users build a streak for each consecutive day they complete at least one core action. A streak multiplier will be added in a future phase.
*   **Protocol Orders (Quests):** Daily and weekly quests will be introduced to provide bonus DP opportunities (e.g., "Complete three workouts this week for +100 DP").

---

## Part 3: Freemium Model & Monetization

### 3.1. Free Tier (The Protocol)

*   Full access to the core DP and 15-rank progression system.
*   Obedience Streak tracking.
*   Access to the "Bro" (Generalist) Archetype.
*   Daily Protocol Orders (Quests).
*   Basic analytics and progress tracking.

### 3.2. Premium Tier (The Discipline - Subscription)

*   **Price:** To be determined (recommendation: $14.99/month or $99/year).
*   **Features:**
    *   Access to all specialized Archetypes (Himbo, Brute, Pup, Bull).
    *   The full 5-stage evolving Avatar silhouette.
    *   Advanced weekly and monthly Protocol Orders with larger DP rewards.
    *   In-depth analytics and visual progress reports.
    *   Access to the coaching suite for 1-on-1 interaction.
    *   Premium app themes and custom icons.

---

## Part 4: Technical Specification & Implementation

### 4.1. Tech Stack

*   **Frontend:** Vite + React + TypeScript
*   **Styling:** Tailwind CSS
*   **Backend:** Supabase (for auth, database, and future coaching features)
*   **Deployment:** Vercel
*   **Mobile:** Capacitor (to wrap the web app for native App Store distribution)

**Decision:** Continue with the existing stack. It is modern, performant, and well-suited for this project. A full native rewrite is unnecessary and would slow down development significantly.

### 4.2. Phased Development Roadmap

**Phase 1: Design System & MVP (4-6 weeks)**
*   **Deliverable:** A functional app with the new Dopamine Noir V2 design system fully implemented.
*   Implement the new `index.css` and `tailwind.config.js`.
*   Refactor all core UI components (`Button`, `Card`, `Navigation`, etc.).
*   Implement the 15-rank progression system in the `xpStore`.
*   Implement the placeholder `Avatar` component.
*   **Goal:** The app should look and feel like the V2 design, even if the new features are not yet active.

**Phase 2: RPG Engine (3-4 weeks)**
*   **Deliverable:** The full gamification system is live.
*   Implement the Archetype selection flow and DP modification logic.
*   Implement the evolving Avatar (using the 5 commissioned illustrations).
*   Implement the Streak Multiplier and Protocol Orders (Quests) system.
*   Implement the freemium paywall, locking premium features.

**Phase 3: Social & Coaching Layer (4-5 weeks)**
*   **Deliverable:** Users can connect with coaches and each other.
*   Build the coach dashboard for viewing client progress.
*   Implement a secure messaging system between coach and client.
*   Build user profiles and a community leaderboard (optional, can be V3).

**Phase 4: Polish & Launch (2 weeks)**
*   **Deliverable:** A polished, App Store-ready build.
*   Intensive bug fixing and performance optimization.
*   Finalize all copy, onboarding, and marketing materials.
*   Submit to Apple App Store and Google Play Store.

---


This document provides the complete blueprint. The next step is to begin Phase 1: implementing the design system on the existing codebase.
