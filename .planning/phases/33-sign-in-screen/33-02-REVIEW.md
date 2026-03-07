# Phase 33-02 Review: Sign In Screen Visual Gaps

## Mockup Reference
`Design inspo/mockups/auth flow/auth_signin.png`

## Current Implementation State

### 1. Back Arrow
- **Position:** absolute top-4 left-4 (with p-2 padding)
- **Size:** w-6 h-6 (24px)
- **Color:** #8A8A8A (muted gray)
- **Component:** ArrowLeft from lucide-react

### 2. Logo
- **Size:** w-24 h-24 (96px)
- **Position:** Centered, at top of content flow
- **Type:** ChainLinkCrownLogo inline SVG component
- **Color:** #D4A853 (gold)

### 3. WELLTRAINED Wordmark
- **Font:** Oswald, bold (font-bold)
- **Size:** text-3xl (30px)
- **Color:** #D4A853 (gold)
- **Spacing from logo:** mt-4 (16px)
- **Letter spacing:** tracking-wide

### 4. WELCOME BACK Headline
- **Font:** Oswald, bold (font-bold)
- **Size:** text-2xl (24px)
- **Color:** #F5F0E8 (warm white)
- **Spacing from wordmark:** mt-12 (48px via spacer div)
- **Text transform:** All caps (hardcoded)

### 5. Subline
- **Font:** Default sans-serif
- **Size:** text-sm (14px)
- **Color:** #8A8A8A (muted gray)
- **Spacing from headline:** mt-2 (8px)
- **Text:** "Sign in to continue your protocol."

### 6. Auth Buttons
- **Container:** w-full max-w-sm space-y-4 (16px gap)
- **Button heights:** h-14 (56px)
- **Border radius:** rounded-full
- **Spacing from subline:** mt-8 (32px via spacer div)

**Continue with Apple:**
- Background: bg-black
- Border: border-white (solid white)
- Text color: text-white
- Icon: w-5 h-5 absolute left-5

**Continue with Google:**
- Background: bg-[#1A1A1A]
- Border: border-[#3A3A3A] (dark gray)
- Text color: text-[#F5F0E8]
- Icon: w-5 h-5 absolute left-5 (Google G multicolor)

**Sign In with Email:**
- Background: bg-[#141414]
- Border: border-[#D4A853] (gold)
- Text color: text-[#F5F0E8]
- Icon: w-5 h-5 text-[#D4A853] absolute left-5 (Mail icon)

### 7. OR Divider
- **Line color:** bg-[#3A3A3A]
- **Line height:** h-px (1px)
- **Text:** "OR" in text-xs text-[#8A8A8A]
- **Text padding:** px-4
- **Spacing from buttons:** mt-6 (24px)

### 8. Create Account Link
- **Prefix text:** "New to WellTrained?" in text-sm text-[#8A8A8A]
- **Link text:** "Create Account" in text-[#D4A853]
- **Underline:** Yes (underline class, hover:no-underline)
- **Spacing from OR divider:** mt-6 (24px)

### 9. Forgot Password Link
- **Font size:** text-sm (14px)
- **Color:** text-[#D4A853] (gold)
- **Underline:** Yes (underline class, hover:no-underline)
- **Spacing from Create Account:** mt-4 (16px)

## Visual Gaps Identified

*(To be completed after Task 2 visual comparison checkpoint)*

## Refinement Tasks for Plan 03

*(To be completed after Task 2 visual comparison checkpoint)*

## Approved Elements (no changes needed)

*(To be completed after Task 2 visual comparison checkpoint)*
