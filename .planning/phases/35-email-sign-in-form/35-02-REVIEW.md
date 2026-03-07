# Phase 35 Plan 02: Email Sign In Screen Visual Review

**Date:** 2026-03-07
**Reviewer:** Claude (pre-user verification)

## Implementation State

### Screen Elements Present

- [x] Back arrow (top-left)
- [x] Chain-link crown logo
- [x] WELCOME BACK headline
- [x] Subline: "Sign in with your email and password."
- [x] Email field with gold Mail icon
- [x] Password field with gold Lock icon
- [x] Show/hide password toggle
- [x] Forgot Password link (below password, right-aligned)
- [x] SIGN IN button
- [x] Create Account link
- [x] Error message display area

### Current Styling

**Background:**
- Screen background: #0A0A0A (Obsidian)
- Layout: Centered column with px-6 horizontal padding

**Back Arrow:**
- Position: Absolute top-4 left-4
- Icon: ArrowLeft from lucide-react, w-6 h-6
- Color: #8A8A8A (gray), hover: white
- Transition: color transition on hover

**Logo:**
- Component: ChainLinkCrownLogo inline SVG
- Size: w-16 h-16 (64px)
- Position: Centered, below mt-16 spacer
- Color: #D4A853 (gold) stroke and fill

**Headline:**
- Text: "WELCOME BACK"
- Font: Oswald (via inline style)
- Size: text-2xl
- Color: #F5F0E8 (warm white)
- Transform: uppercase (inherent in text)
- Weight: font-bold
- Spacing: tracking-wide
- Alignment: text-center
- Margin: mt-6 below logo

**Subline:**
- Text: "Sign in with your email and password."
- Size: text-sm
- Color: #8A8A8A (gray)
- Alignment: text-center
- Margin: mt-2 below headline

**Input Fields (Email and Password):**
- Container: max-w-sm with space-y-4 between fields
- Label: text-xs uppercase tracking-wider text-[#8A8A8A] mb-2
- Background: #141414 (dark card)
- Border: 1px solid #3A3A3A (subtle gray)
- Height: h-14 (56px)
- Border radius: rounded-xl (12px)
- Padding: px-4 (right), pl-12 (left for icon space), pr-12 (password for toggle)
- Text color: #F5F0E8 (warm white)
- Placeholder: #8A8A8A
- Focus state: ring-2 ring-[#D4A853] ring-opacity-50

**Input Icons:**
- Mail icon (email field): w-5 h-5, color #D4A853 (gold)
- Lock icon (password field): w-5 h-5, color #D4A853 (gold)
- Position: absolute left-4, vertically centered (top-1/2 -translate-y-1/2)

**Password Toggle:**
- Icons: Eye / EyeOff from lucide-react, w-5 h-5
- Position: absolute right-4, vertically centered
- Color: #8A8A8A (gray), hover: white
- Transition: color transition on hover
- State: showPassword boolean controls input type and icon

**Error Display:**
- Position: Below password field (inside password div)
- Margin: mt-2
- Text: text-sm, color #EF4444 (red)
- Alignment: text-left
- Max width: max-w-sm
- Conditional render: {error && ...}

**Forgot Password Link:**
- Position: Below password field, inside password div
- Margin: mt-2
- Alignment: text-right
- Style: text-sm text-[#D4A853] underline hover:no-underline
- Handler: navigate('/auth/forgot-password')

**SIGN IN Button:**
- Width: w-full max-w-sm
- Height: h-14 (56px)
- Background: #D4A853 (gold)
- Text: black, font-bold
- Font: Oswald (via inline style)
- Size: text-base
- Transform: uppercase
- Spacing: tracking-widest
- Border radius: rounded-full
- Disabled state: opacity-50 cursor-not-allowed
- Disabled condition: !isFormValid || isLoading
- Loading text: "Signing In..." vs "SIGN IN"
- Margin: mt-6 above button

**Create Account Link:**
- Position: Bottom of screen, centered
- Margin: mt-6 below button
- Base text: text-[#8A8A8A] text-sm text-center
- Text: "New to WellTrained? "
- Link: text-[#D4A853] underline hover:no-underline
- Link text: "Create Account"
- Handler: navigate('/auth/signup')

**Form Validation:**
- Email validation: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` regex pattern
- Password validation: length > 0 (non-empty)
- Form valid when: isValidEmail(email) && password.length > 0
- Button disabled when: !isFormValid || isLoading

**Spacing:**
- Top spacer: mt-16 (64px) below safe area
- After logo: mt-6 (24px) to headline
- After headline: mt-2 (8px) to subline
- After subline: mt-8 (32px) to form
- Between fields: space-y-4 (16px)
- After form: mt-6 (24px) to button
- After button: mt-6 (24px) to footer

## Implementation File

**Path:** `src/screens/auth-screens/EmailSignInScreen.tsx`

**Component structure:**
1. ChainLinkCrownLogo inline SVG component (lines 7-50)
2. isValidEmail validation function (lines 53-55)
3. EmailSignInScreen main component (lines 57-247)

**State management:**
- email: string (controlled input)
- password: string (controlled input)
- showPassword: boolean (toggle visibility)
- isLoading: boolean (async operation state)
- error: string | null (error message display)

**Navigation handlers:**
- handleBack(): navigate(-1)
- handleForgotPassword(): navigate('/auth/forgot-password')
- handleCreateAccount(): navigate('/auth/signup')
- handleSignIn(): async Supabase auth with error handling

**Authentication:**
- Method: supabase.auth.signInWithPassword({ email, password })
- Error handling: Invalid credentials, unconfirmed email, generic errors
- Success: App.tsx routing handles navigation (session-based)
