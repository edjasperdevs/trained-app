# Phase 32-02 Review: Sign Up Screen Visual Gaps

## Mockup Reference
`Design inspo/mockups/auth flow/auth_signup.png`

## Current Implementation State

### 1. Logo (ChainLinkCrownLogo)
- **Current size:** `w-24 h-24` (96px x 96px)
- **Position:** Centered, at top of flex container
- **Styling:** Gold (#D4A853) stroke, chain-link ellipses with crown below
- **Spacing from wordmark:** `mt-4` (16px) on wordmark below

### 2. WELLTRAINED Wordmark
- **Font size:** `text-3xl` (30px)
- **Font family:** Oswald (inline style)
- **Color:** `#D4A853` (gold)
- **Font weight:** `font-bold` (700)
- **Letter spacing:** `tracking-wide`
- **Spacing from logo:** `mt-4` (16px)

### 3. BEGIN YOUR PROTOCOL Headline
- **Font size:** `text-2xl` (24px)
- **Font family:** Oswald (inline style)
- **Font weight:** `font-bold` (700)
- **Color:** `#F5F0E8` (warm white)
- **Letter spacing:** `tracking-wide`
- **Alignment:** `text-center`
- **Spacing from wordmark:** `mt-12` (48px) via spacer div

### 4. Subline
- **Text:** "Create your account to start earning Discipline Points."
- **Font size:** `text-sm` (14px)
- **Color:** `#8A8A8A` (muted gray)
- **Alignment:** `text-center`
- **Spacing from headline:** `mt-2` (8px)

### 5. Auth Buttons

#### Container
- **Width:** `w-full max-w-sm` (384px max)
- **Spacing between buttons:** `space-y-4` (16px)
- **Spacing from subline:** `mt-8` (32px) via spacer div

#### Continue with Apple Button
- **Height:** `h-14` (56px)
- **Width:** `w-full`
- **Border radius:** `rounded-full`
- **Background:** `bg-black`
- **Border:** `border border-white` (1px solid white)
- **Text color:** `text-white`
- **Font weight:** `font-medium`
- **Icon:** Apple logo, `w-5 h-5` (20px), positioned `absolute left-5` (20px from left)
- **Text:** Centered via `w-full text-center`

#### Continue with Google Button
- **Height:** `h-14` (56px)
- **Width:** `w-full`
- **Border radius:** `rounded-full`
- **Background:** `bg-[#1A1A1A]`
- **Border:** `border border-[#3A3A3A]` (1px solid subtle gray)
- **Text color:** `text-[#F5F0E8]`
- **Font weight:** `font-medium`
- **Icon:** Google G logo (multicolor), `w-5 h-5` (20px), positioned `absolute left-5`
- **Text:** Centered via `w-full text-center`

#### Continue with Email Button
- **Height:** `h-14` (56px)
- **Width:** `w-full`
- **Border radius:** `rounded-full`
- **Background:** `bg-[#141414]`
- **Border:** `border border-[#D4A853]` (1px solid gold)
- **Text color:** `text-[#F5F0E8]`
- **Font weight:** `font-medium`
- **Icon:** Mail icon (Lucide), `w-5 h-5` (20px), `text-[#D4A853]`, positioned `absolute left-5`
- **Text:** Centered via `w-full text-center`

### 6. OR Divider
- **Container:** `flex items-center w-full max-w-sm`
- **Lines:** `flex-1 h-px bg-[#3A3A3A]`
- **Text:** "OR", `text-[#8A8A8A] text-xs` (12px)
- **Text padding:** `px-4` (16px horizontal)
- **Spacing from buttons:** `mt-6` (24px)

### 7. Sign In Link
- **Container text:** `text-[#8A8A8A] text-sm` (14px, muted gray)
- **Prefix text:** "Already initiated?"
- **Link text:** "Sign In"
- **Link color:** `text-[#D4A853]` (gold)
- **Link style:** `hover:underline`
- **Spacing from OR divider:** `mt-6` (24px)

### 8. Legal Copy
- **Font size:** `text-xs` (12px)
- **Color:** `text-[#8A8A8A]` (muted gray)
- **Alignment:** `text-center`
- **Max width:** `max-w-xs` (320px)
- **Text:** "By continuing you agree to our Terms of Service and Privacy Policy"
- **Link colors:** `text-[#D4A853]` (gold)
- **Link style:** `hover:underline`
- **Spacing from Sign In link:** `mt-8` (32px)

### 9. Overall Layout
- **Container:** `min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-6 pt-safe pb-safe`
- **Background:** Obsidian (#0A0A0A)
- **Horizontal padding:** `px-6` (24px)
- **Safe area:** `pt-safe pb-safe` for iOS notch

---

## Visual Gaps Identified

*Awaiting human visual comparison at checkpoint...*

---

## Refinement Tasks for Plan 03

*To be determined after checkpoint comparison...*

---

## Approved Elements (no changes needed)

*To be determined after checkpoint comparison...*
