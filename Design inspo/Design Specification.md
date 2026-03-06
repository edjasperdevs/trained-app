# WellTrained — Design Specification
### Visual Identity & Creative Direction for Designers

**Version 1.1 — March 2026** *(Updated with codebase review)*
**Prepared by Manus AI for the WellTrained Design Team**

---

> *This document is a creative direction guide, not a rigid rulebook. It establishes the soul, palette, and personality of WellTrained so that designers can make informed, confident decisions while bringing their own craft and creativity to the execution. Think of it as the north star — not the map.*

---

## 1. Brand Soul

WellTrained is built on a single, powerful idea: **training is not a habit, it is a calling.** The people who use this app do not work out to lose weight or hit a step count. They train because they are building something — a body, a discipline, a legacy. The design must honor that seriousness.

The closest cultural references are not other fitness apps. They are the **trophy case in a champion's home**, the **weight of a gold medal**, the **aesthetic of a luxury sports brand** that has earned the right to be expensive. The Hades game art direction is a direct influence — not because the app is a game, but because Hades understood something rare: that a dark, mythological world rendered with warmth and craft feels more alive than a bright, clinical one.

The name **WellTrained** carries its own gravitas. It is not aspirational — it is declarative. The design should feel the same way. Every screen should communicate that the person using it has already arrived somewhere worth being.

---

## 2. The Obsidian Design Language

The overarching design language is called **Obsidian** — named for the volcanic glass that is simultaneously the darkest and sharpest material in nature. The aesthetic is built on three pillars:

**Darkness as canvas.** True black is not a background color in WellTrained — it is the stage. Everything else exists on top of it. The darkness should never feel cold or empty; it should feel like the moment before a spotlight hits.

**Gold as earned, not decorative.** The gold accent is not used for decoration. It appears where something has been achieved, where something is active, where something matters. A gold element should always mean something. Used sparingly, it reads as prestige. Used liberally, it reads as gaudy — and WellTrained is never gaudy.

**The avatar as the emotional center.** The Hades-style character avatar is not a mascot or a gimmick. It is the user's physical self rendered as a champion. Every design decision around the avatar should reinforce the feeling that this character is *you* — and that you are becoming more formidable over time.

---

## 3. Color Direction

The palette is intentionally minimal. Restraint is a feature, not a limitation.

| Role | Suggested Value | Notes |
|---|---|---|
| **Canvas** | True black, ~`#0A0A0A` | The foundation of every screen. Not dark gray — actual black. |
| **Surface / Cards** | Deep charcoal, ~`#141414` | Slightly lifted from the canvas to create depth without harsh contrast. |
| **Surface Elevated** | ~`#1C1C1C` | For modals, sheets, or any element that needs a third layer of depth. |
| **Primary Accent** | Warm gold, ~`#D4A853` | The signature color. Reserved for active states, key metrics, CTAs, and achievement moments. |
| **Accent Warm Dim** | Muted gold, ~`#9A7A3A` | For secondary gold elements — inactive tab icons, subtle borders, supporting text. |
| **Primary Text** | Warm white, ~`#F5F0E8` | Slightly warm rather than pure white — feels more premium and easier on the eyes in dark mode. |
| **Secondary Text** | Warm gray, ~`#8A8070` | For labels, captions, supporting information. Should feel recessive but readable. |
| **Destructive / Alert** | Deep crimson, ~`#8B1A1A` | Used only for errors or destructive actions. Echoes the Hades palette's red tones. |
| **Success / PR** | Ember orange-gold, ~`#C87941` | For personal records, new achievements, positive milestones. Distinct from the primary gold. |

The designers should feel free to explore subtle warm gradients — particularly on card surfaces and behind the avatar — but the overall impression should always be that the app lives in darkness punctuated by gold, not the other way around.

---

## 4. Typography Direction

Typography is one of the most powerful tools available to distinguish WellTrained from every other fitness app. The suggestion is a **two-family system** that creates a clear hierarchy between moments of drama and moments of data.

**Display / Headline Family:** Something with editorial weight and character — a refined serif or a high-contrast display sans-serif. Think of the kind of typeface you would find on the cover of a luxury magazine or a championship trophy. It should feel like it has been *earned*. Suggested exploration: Canela, Playfair Display, Freight Display, or a premium geometric display sans like Neue Haas Grotesk Display. The key quality is that it should feel like it belongs in a different world than a standard app.

**Data / Body Family:** A clean, highly legible geometric or humanist sans-serif. This is the workhorse — it carries all the numbers, labels, captions, and functional text. It should be invisible in the best possible way: readable without drawing attention to itself. Suggested exploration: Inter, DM Sans, Söhne, or Aktiv Grotesk. The key quality is that large numerals should look beautiful at display sizes — because workout weights, rep counts, and XP numbers will often be the largest element on a screen.

The relationship between these two families creates the app's rhythm. A screen that opens with a bold display headline and then resolves into clean data typography feels intentional and sophisticated. A screen that uses only one family for everything feels flat.

**Sizing philosophy:** Think big. The most important number on any given screen — a weight, a recovery score, a streak count — should be large enough to read at a glance from arm's length. The hierarchy should be immediately obvious without reading a single word.

---

## 5. Iconography & Mark Direction

The **WellTrained mark** combines two symbols that carry deep meaning in the context of the app: a **chain link ring** encircling a **heraldic crown**. The chain ring carries a deliberate dual meaning — it reads simultaneously as discipline and protocol (a chain as a symbol of commitment and structure) and as luxury status (a gold chain as a mark of achievement). The crown inside it speaks to mastery and rank. Together they form a mark that is immediately legible as "earned authority" — not aggressive, not decorative, but purposeful. The crown shape is wide and heraldic — five broad peaks in a W-silhouette, not a narrow or ornate form. The mark is always rendered in flat warm gold on true black.

The mark should be treated with restraint. It appears on the splash screen, in the navigation bar, and as a small watermark in achievement moments. It should never feel overused.

For **UI iconography** throughout the app, the suggestion is a line-icon style that is slightly heavier than typical — thicker strokes than SF Symbols or Material Icons, but still clean and geometric. The weight of the icons should feel consistent with the weight of the typography. Gold is used for active states; warm gray for inactive.

Achievement badges in the Trophy Room deserve special attention. The hexagonal badge shape is a strong suggestion — it reads as military, athletic, and prestigious all at once. Each badge should feel like a physical object: something with weight, texture, and a sense that it was difficult to earn.

---

## 5a. The Archetype System

WellTrained uses a five-archetype character specialization system that determines how a user earns Discipline Points. The archetype is chosen during onboarding and can be changed later. It is the primary way the app personalizes the experience to the user's training identity. Designers should treat the archetype selection screen as a meaningful RPG-style class selection — not a settings toggle.

There are five archetypes:

| Archetype | Tagline | DP Bonus | Access |
|---|---|---|---|
| **Bro** | Balanced Discipline | No modifier — consistent across all actions | Free |
| **Himbo** | Training Obsessed | +50% training DP (75 DP per workout) | Premium |
| **Brute** | Nutrition Machine | +50% protein and meal DP | Premium |
| **Pup** | Lifestyle Master | +100% steps and sleep DP | Premium |
| **Bull** | Consistency King | Streak bonuses *(coming in a future update)* | Premium |

**Bro** is the free default — every user starts here. The other four archetypes are premium-only, which makes the archetype selection screen a natural and honest upsell moment. The design should make the premium archetypes feel genuinely desirable, not locked behind a paywall in a punitive way.

Each archetype card should feel distinct. The suggestion is to give each one a short "protocol brief" — one or two lines of copy written in the WellTrained voice that describes what kind of person chooses this archetype. The **Himbo** in particular is a gift: it is the most on-brand name in the system and the training-obsessed identity is exactly the character the core audience will want to play.

The **Bull** archetype is currently a placeholder — streak bonuses are deferred to a future release. The card should carry a subtle "Coming Soon" treatment that feels like anticipation rather than absence. A locked state with a brief teaser line is the right approach.

The archetype icon system uses Lucide icons as a starting point (Dumbbell for Himbo, Beef for Brute, Heart for Pup, TrendingUp for Bull, User for Bro), but designers should feel free to explore custom iconography that carries more personality for the final product.

---

## 6. The Avatar System

The Hades-style character avatar is the most unique and differentiating element of WellTrained. It deserves its own section because the decisions made around it will define whether the app feels genuinely special or merely themed.

**Art style reference:** The Hades game by Supergiant Games (2020) established a visual language that is worth studying closely. The key techniques are: bold, consistent ink outlines; chiaroscuro shading with solid black shadow areas; vibrant, saturated color highlights that pop against dark backgrounds; and a sense of physical dynamism even in static poses. The characters feel like they are made of light and shadow simultaneously.

**Color palette for the avatar:** The character's primary colors — deep crimson red, warm gold armor details, amber glowing eyes — are not arbitrary. They are a direct extension of the app's color system. The avatar and the UI should feel like they were designed in the same world. Designers should consider how the avatar's warm golden aura interacts with the black background and the gold UI elements around it.

**Avatar moods:** The avatar has five emotional states that respond to user behavior: `happy`, `neutral`, `hyped`, `sad`, and `neglected`. If the user has not opened the app in three or more days, the avatar enters a `neglected` state. This is a powerful design moment — the character visually reflecting the user's consistency (or absence of it) creates an emotional hook that generic fitness apps cannot replicate. The `hyped` state triggers on rank-ups and weekly reward claims; `sad` on missed days. Each mood should be visually distinct but subtle — a shift in posture, expression, or aura intensity rather than a completely different illustration.

**Avatar as progression system:** The avatar should visibly change as the user advances through ranks. This does not need to be a dramatic transformation — subtle additions of armor pieces, a slightly more confident pose, a brighter aura — are enough to communicate growth. The Profile/Champion screen is where this progression is most explicitly shown, but the home screen avatar should also reflect the user's current rank tier.

**Placement philosophy:** The avatar works best when it is large, when it bleeds off the edges of the screen slightly, and when UI elements are layered *around* it rather than placed *beneath* it. The avatar should feel like it inhabits the screen, not like it has been placed on top of it. Designers should experiment with the avatar partially obscuring cards, with UI data floating alongside the character, and with the avatar's glow interacting with the background.

---

## 7. Screen-by-Screen Creative Direction

The following section offers directional intent for each key screen. These are starting points for exploration, not finished layouts.

### 7.1 Splash / Loading Screen

The first impression should be quiet and confident. A dark screen that resolves into the WellTrained mark and wordmark — no animation complexity needed here. The tagline "Forge Your Legend" (or a variation the team prefers) should feel like a statement, not a slogan. The loading indicator, if visible, should be minimal — a thin gold arc or a simple pulse.

### 7.2 Onboarding

Onboarding is the one place where the app can be slightly more expressive. Each screen could feature a different aspect of the avatar — perhaps the character being forged, armored, or awakened — as the user completes their profile. The goal is to make the user feel like they are not setting up an account but beginning a journey. The avatar customization step, where the user chooses their character's appearance, should feel like a meaningful moment.

### 7.3 Dashboard / Home

The home screen is the emotional heart of the app. The avatar should dominate the visual hierarchy — this is the user's champion, and it should feel heroic every time the screen opens. The **DP to Rank Up** ring is the primary daily metric — a circular progress arc showing how many Discipline Points remain before the user advances to the next rank. This is a more motivating metric than a recovery score because it is entirely within the user's control: every workout, every logged meal, every step moves that number. Supporting stats — Obedience Streak, Weekly XP, and current Level — should be present but secondary. The overall composition should feel like opening a game and seeing your character ready for the next challenge.

The bottom navigation bar has four tabs: **Home** (house icon), **Workout** (barbell icon), **Fuel** (flame icon), and **Profile** (person icon). Settings lives inside the Profile screen, not as a standalone tab.

### 7.4 Active Workout Screen

During a workout, the design should shift into a more focused, stripped-back mode. The avatar can recede — perhaps appearing only as a small badge or thumbnail — while the exercise name, weight, and rep count take over the screen. Large display numerals for the weight are essential. The rest timer should feel like a countdown to something, not just a number decreasing. The "Complete Set" action should be the most prominent interactive element on the screen.

### 7.5 Workout Log / Exercise List

This screen is primarily functional — the user needs to find exercises, add sets, and move efficiently. The design should not fight the utility here. Clean list rows, clear typography, and a consistent use of gold for active or highlighted elements. The challenge is making something inherently data-dense feel premium rather than spreadsheet-like. Generous spacing, subtle card surfaces, and the occasional gold accent on a PR or highlighted set will do most of the work.

### 7.6 Progress & Analytics

The progress screen is where the user reflects on what they have built. The gold area chart — volume over time, always trending upward — is the hero element. Personal record cards with trophy icons give the data emotional weight. The weekly heatmap calendar is a powerful visual that rewards consistency. The overall tone of this screen should feel like looking at a trophy case: evidence of work done, displayed with pride.

### 7.7 Trophy Room

This screen should feel the most game-like of all the screens — and that is intentional. The large trophy illustration at the top is a bold choice that signals to the user that WellTrained takes achievement seriously. The hexagonal badge grid below it should feel like a collection worth completing. Locked badges should feel tantalizing, not discouraging — the user should look at them and think "I'm going to earn that," not "I haven't done enough."

### 7.8 Profile / Your Champion Screen

This is the most personal screen in the app. The user's avatar, at its largest, with their rank, total DP, and Obedience Streak visible at a glance. The rank progression bar should display the user's current rank name and the DP required to reach the next rank — drawn from the actual 16-rank system in the app.

The sixteen ranks, in order, are: **Uninitiated, Initiate, Compliant, Obedient, Disciplined, Conditioned, Proven, Hardened, Forged, Trusted, Enforcer, Seasoned, Elite, Apex, Sovereign, Master.** These names are already on-brand and should be used verbatim in the UI — they do not need to be replaced with generic terms. Seeing "Rank: Forged" or "Rank: Sovereign" on screen is a far more powerful moment than seeing "Level 8."

The archetype section of this screen shows the user's selected archetype — their training identity — with its tagline and DP bonus displayed. This is also where the user can change their archetype if they choose.

The overall feel should be somewhere between a luxury brand's product page and an RPG character sheet. The avatar's current mood state should be subtly visible — not as a UI label, but as a quality of the illustration itself.

### 7.9 Fuel (Macros Dashboard)

The nutrition tab is called **Fuel** — not "Nutrition," not "Diet," not "Macros." The word is intentional. It frames food as a performance input rather than a restriction or a chore, which is consistent with the WellTrained ethos that everything the user does is in service of becoming stronger.

The hero element of this screen is a large circular macro ring — a single ring divided into three arcs representing Protein, Carbs, and Fat, with total calories displayed prominently in the center. The ring should feel substantial and satisfying to look at, not clinical. The three macro tiles below it carry the detailed gram counts and individual progress bars for each macronutrient. The color differentiation between the three macros should be subtle — variations within the gold and amber family rather than introducing new colors — so the screen stays cohesive with the rest of the app.

Below the ring and tiles, the "Meals Today" section gives the user a quick overview of what they have already logged, organized by meal type. The "Log a Meal" call-to-action should be prominent and easy to reach — nutrition logging lives or dies on how frictionless the entry experience is.

### 7.10 Log a Meal (Food Logging Screen)

The food logging screen is the most utilitarian screen in the app, and that is fine. Utility done beautifully is still beautiful. The design challenge here is making a data-entry screen feel as premium as the rest of WellTrained without sacrificing speed or clarity.

The meal type selector at the top — Breakfast, Lunch, Dinner, Snack, Pre-Workout, Post-Workout — is a meaningful addition. The Pre-Workout and Post-Workout categories are specific to the WellTrained context and reinforce the idea that nutrition is tied directly to training, not just to daily habit. The active tab should be clearly distinguished in gold.

The search bar with barcode scanning capability is the primary entry point. The "Suggested for [Meal Type]" section below recent foods is a smart contextual feature — the app should learn what the user typically eats before training and surface those options automatically. This is the kind of detail that makes an app feel like it knows you.

The persistent summary bar at the bottom of the screen — showing running totals for the current meal as items are added — is essential. The user should never have to do mental math. The "Done" button in gold closes the loop cleanly.

---

## 8. Motion & Interaction Philosophy

Animation in WellTrained should feel **weighty and deliberate** — not bouncy or playful. The physical metaphor is a heavy gold medal being placed around your neck, not a confetti cannon going off.

A few directional principles worth exploring:

Screen transitions should feel like the world is revealing itself rather than sliding in from the side. A subtle fade with a slight upward drift tends to feel more premium than a horizontal swipe.

Number animations — when XP increases, when a streak counter ticks up, when a new level is reached — should count up with a slight ease-out, like a scoreboard. This makes every increment feel earned.

The avatar's idle animation, if implemented, should be subtle — a slow breathing cycle, a slight shift in weight. Enough to feel alive, not enough to be distracting.

Achievement unlock moments deserve special treatment. A brief, dramatic animation — the badge materializing, a flash of gold light, the avatar reacting — is the kind of micro-moment that users will remember and talk about.

---

## 9. Voice & Tone

Design and copy are inseparable. The words that appear in the app should feel consistent with the visual identity. A few directional notes for the writing:

WellTrained speaks to the user as an equal, not as a coach or a cheerleader. The tone is **direct, confident, and respectful of the user's intelligence.** It does not over-explain. It does not use exclamation points. It does not say "Amazing job!" It might say "New record." or "Unbroken. 21 days."

Achievement names in the app are called **Marks of Devotion** and should feel earned and specific. The existing badge names in the system are already strong and should be used as the standard: **Iron Will** (7-day streak), **Relentless** (30-day streak), **Unstoppable** (100-day streak), **Battle Tested** (50 workouts), **Beast Mode** (100 workouts). New badge names added by the design team should follow this pattern — mythological weight, no generic fitness language.

Screen titles and section headers should be short and declarative. "Trophy Room." "Your Champion." "Your Progress." Not "Track Your Achievements" or "View Your Stats."

---

## 10. What WellTrained Is Not

It can be as useful to define what the design should avoid as what it should pursue.

WellTrained is **not** Apple Fitness. It does not use rings, it does not use the San Francisco typeface, it does not use the clinical white-and-color palette of health apps. If a design decision could appear in Apple Health, it should be reconsidered.

WellTrained is **not** a gaming app. The Hades influence is a tonal and aesthetic reference, not a genre classification. The gamification elements — XP, levels, trophies — should feel like they belong in a premium fitness context, not like they were borrowed from a mobile game. The difference is craft and restraint.

WellTrained is **not** aggressive or intimidating. The darkness and the warrior aesthetic should feel aspirational and empowering, not exclusionary. The app should feel like it welcomes anyone who is serious about their training — not just a specific body type or demographic.

---

## 11. Reference Touchstones

The following apps, brands, and works are offered as creative reference points — not for copying, but for understanding the emotional register WellTrained is aiming for.

| Reference | What to Take From It |
|---|---|
| **Hades (Supergiant Games)** | Avatar illustration style, chiaroscuro technique, dark world with warm gold accents, achievement system |
| **Equinox** | Editorial restraint, luxury brand confidence, the feeling that the product is for serious people |
| **WHOOP** | Data-forward design that feels premium, not clinical; the circular metric as an iconic UI element |
| **Rise Sleep** | Deep dark backgrounds with rich accent colors, custom illustration system, emotional design |
| **Rolex** | Gold as a mark of achievement and precision, not decoration; timeless over trendy |
| **Nike Training Club** | Bold typography as a design element, photography-driven hero moments |

---

*This document is a living reference. As the design evolves, it should be updated to reflect decisions made and directions explored. The goal is always the same: to make WellTrained feel like the app that a champion deserves.*

---

**WellTrained — Forge Your Legend**
