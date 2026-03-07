# WellTrained — Authentication Flow Brief
**Version:** 1.0  
**Status:** Ready for implementation  
**Reference mock-ups:** All files prefixed `auth_` in this folder

---

## Overview

The authentication flow covers account creation and sign-in via three methods: Apple, Google, and email/password. All auth is handled through **Supabase Auth**, which is already integrated in the codebase. No new auth infrastructure is required — this is a configuration and UI implementation task.

The flow consists of five screens:

| Screen | File | Route |
|---|---|---|
| Sign Up (social entry) | `auth_signup.png` | `/auth/signup` |
| Sign In (social entry) | `auth_signin.png` | `/auth/signin` |
| Email Sign Up form | `auth_email_signup.png` | `/auth/email-signup` |
| Email Sign In form | `auth_email_signin.png` | `/auth/email-signin` |
| Forgot Password | `auth_forgot_password.png` | `/auth/forgot-password` |

---

## Navigation Logic

The auth stack sits outside the main tab navigator. The app should check `userStore.onboardingComplete` on launch:

- If `false` and no session exists → show Sign Up screen
- If `false` and session exists → resume onboarding where the user left off
- If `true` and session exists → go directly to Home tab
- If `true` and no session exists → show Sign In screen

```
App.tsx
├── AuthStack (when no active session)
│   ├── SignUp
│   ├── SignIn
│   ├── EmailSignUp
│   ├── EmailSignIn
│   └── ForgotPassword
├── OnboardingStack (when session exists but !onboardingComplete)
│   └── [8 onboarding screens]
└── MainTabNavigator (when session exists and onboardingComplete)
    ├── Home
    ├── Workout
    ├── Fuel
    └── Profile
```

---

## Screen 1 — Sign Up (Social Entry)
**Mock-up:** `auth_signup.png`

This is the first screen a new user sees. It presents three auth options in order of conversion priority.

**Layout:**
- Chain-link crown logo mark + WELLTRAINED wordmark centered at top
- Headline: `BEGIN YOUR PROTOCOL` (Oswald, uppercase, warm white)
- Subline: `Create your account to start earning Discipline Points.` (warm gray)
- Three auth buttons stacked vertically (see button specs below)
- Divider with OR
- `Already initiated?` + `Sign In` link in gold
- Legal copy: `By continuing you agree to our Terms of Service and Privacy Policy`

**Button order (do not change — Apple guidelines require Apple to be at least as prominent as other social options):**
1. Continue with Apple
2. Continue with Google
3. Continue with Email

**Button specs:**

| Button | Background | Border | Icon | Text color |
|---|---|---|---|---|
| Continue with Apple | `#000000` | `1px solid #FFFFFF` | Apple SF Symbol (white) | `#FFFFFF` |
| Continue with Google | `#1A1A1A` | `1px solid #3A3A3A` | Google G (full color) | `#F5F0E8` |
| Continue with Email | `#141414` | `1px solid #D4A853` | Lucide `Mail` (gold) | `#F5F0E8` |

All buttons: `rounded-full`, `h-14`, `w-full`, `flex items-center`, icon left-aligned with `pl-5`, text centered.

---

## Screen 2 — Sign In (Social Entry)
**Mock-up:** `auth_signin.png`

Identical layout to Sign Up with the following changes:
- Headline: `WELCOME BACK`
- Subline: `Sign in to continue your protocol.`
- Third button label: `Sign In with Email`
- Footer link: `New to WellTrained?` + `Create Account` in gold
- Additional link below footer: `Forgot Password?` in warm gray

---

## Screen 3 — Email Sign Up Form
**Mock-up:** `auth_email_signup.png`

Reached by tapping "Continue with Email" on the Sign Up screen.

**Fields:**

| Field | Label | Icon | Placeholder | Type |
|---|---|---|---|---|
| Email | `EMAIL` | `Mail` (gold) | `your@email.com` | `email` |
| Password | `PASSWORD` | `Lock` (gold) | `Create a password` | `password` + toggle eye |
| Confirm Password | `CONFIRM PASSWORD` | `Lock` (gold) | `Confirm your password` | `password` |

**Password strength indicator:**
A four-segment bar below the password field. Segments fill in gold as the password meets complexity criteria:
- 1 segment: 8+ characters
- 2 segments: + uppercase letter
- 3 segments: + number
- 4 segments: + special character

**Validation rules:**
- Email must be a valid format
- Password minimum 8 characters
- Confirm password must match password
- CREATE ACCOUNT button disabled (50% opacity, non-interactive) until all fields are valid

**Input focus state:** Active/focused input gets `ring-2 ring-[#D4A853] ring-opacity-50` — a warm gold glow border.

**Supabase call:**
```typescript
const { data, error } = await supabase.auth.signUp({
  email,
  password,
})
```

On success → navigate to onboarding Screen 1 (Welcome). The user's session is now active.

**CTA:** `CREATE ACCOUNT` (full-width gold button, Oswald uppercase, black text)

**Footer:** `Already initiated?` + `Sign In` link in gold

---

## Screen 4 — Email Sign In Form
**Mock-up:** `auth_email_signin.png`

Reached by tapping "Sign In with Email" on the Sign In screen.

**Fields:**

| Field | Label | Icon | Placeholder | Type |
|---|---|---|---|---|
| Email | `EMAIL` | `Mail` (gold) | `your@email.com` | `email` |
| Password | `PASSWORD` | `Lock` (gold) | `Your password` | `password` + toggle eye |

**Forgot Password link:** Right-aligned below the password field, warm gold, navigates to Screen 5.

**Supabase call:**
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
})
```

On success → check `onboardingComplete`. If true, navigate to Home. If false, navigate to onboarding.

**Error handling:**
- Invalid credentials → show inline error below password field: `Incorrect email or password.` in a small red text (`#EF4444`)
- Network error → show toast notification at bottom of screen

**CTA:** `SIGN IN` (full-width gold button)

**Footer:** `New to WellTrained?` + `Create Account` link in gold

---

## Screen 5 — Forgot Password
**Mock-up:** `auth_forgot_password.png`

Reached by tapping "Forgot Password?" on the Email Sign In screen.

**Layout:**
- Back arrow top left
- Chain-link crown logo mark centered
- Large gold key icon (Lucide `KeyRound`, 64px, gold `#D4A853`)
- Headline: `RESET YOUR PASSWORD`
- Subline: `Enter your email and we will send you a reset link.`
- Single email input field (same spec as above)
- CTA: `SEND RESET LINK`
- Footer: `Remember your password?` + `Sign In` link in gold

**Supabase call:**
```typescript
const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: 'welltrained://reset-password',
})
```

On success → replace the form with a confirmation state showing a gold checkmark icon and the message: `Check your inbox. A reset link has been sent to [email].` with a `Back to Sign In` link below.

---

## Apple Sign In — Implementation

Apple Sign In requires configuration in both Xcode and the Apple Developer portal before the Supabase call will work.

**Steps:**
1. In Xcode, add the `Sign In with Apple` capability to the app target
2. In the Apple Developer portal, enable Sign In with Apple for the App ID
3. In Supabase dashboard → Authentication → Providers → Apple: enter the Service ID, Team ID, Key ID, and private key
4. In the app, use `expo-apple-authentication` (already in the Expo ecosystem):

```typescript
import * as AppleAuthentication from 'expo-apple-authentication'

const credential = await AppleAuthentication.signInAsync({
  requestedScopes: [
    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
    AppleAuthentication.AppleAuthenticationScope.EMAIL,
  ],
})

const { data, error } = await supabase.auth.signInWithIdToken({
  provider: 'apple',
  token: credential.identityToken,
})
```

**Important:** Apple only returns the user's name and email on the **first** sign-in. Store `credential.fullName` to your user profile on that first sign-in. On subsequent sign-ins, Apple returns only the identity token.

---

## Google Sign In — Implementation

**Steps:**
1. Create a project in Google Cloud Console and obtain OAuth 2.0 credentials (Web client ID and iOS client ID)
2. In Supabase dashboard → Authentication → Providers → Google: enter the Web client ID and secret
3. In the app, use `@react-native-google-signin/google-signin`:

```typescript
import { GoogleSignin } from '@react-native-google-signin/google-signin'

GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID',
  iosClientId: 'YOUR_IOS_CLIENT_ID',
})

const { idToken } = await GoogleSignin.signIn()

const { data, error } = await supabase.auth.signInWithIdToken({
  provider: 'google',
  token: idToken,
})
```

---

## Shared Design Tokens for Auth Screens

All auth screens use the standard Obsidian design tokens. Reference `constants.ts` for values. Key tokens used in auth:

| Token | Value | Usage |
|---|---|---|
| `bg-obsidian` | `#0A0A0A` | Screen background |
| `bg-card` | `#141414` | Input field and card backgrounds |
| `bg-card-hover` | `#1A1A1A` | Google button background |
| `gold` | `#D4A853` | Active borders, icons, links, CTA button |
| `text-primary` | `#F5F0E8` | Body text |
| `text-muted` | `#8A8A8A` | Placeholder text, sublines, legal copy |
| `text-error` | `#EF4444` | Validation error messages |

**Input field base class:**
```
bg-[#141414] rounded-xl border border-[#3A3A3A] h-14 px-4
focus:outline-none focus:ring-2 focus:ring-[#D4A853] focus:ring-opacity-50
```

**CTA button base class:**
```
w-full h-14 rounded-full bg-[#D4A853] text-black font-bold
tracking-widest uppercase font-oswald text-base
```

---

## Session Persistence

Supabase handles session persistence automatically via `AsyncStorage`. The session survives app restarts. No additional configuration is needed beyond the existing Supabase client setup in the codebase.

To check for an existing session on app launch:

```typescript
const { data: { session } } = await supabase.auth.getSession()
```

Subscribe to auth state changes to handle sign-out and token refresh:

```typescript
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    // Clear local stores and navigate to Sign Up
  }
})
```

---

## Sign Out

Sign out is accessible from the Profile tab → Settings. The sign-out action should:
1. Call `supabase.auth.signOut()`
2. Clear all Zustand stores (`dpStore`, `avatarStore`, `macroStore`, etc.)
3. Reset `userStore.onboardingComplete` to `false`
4. Navigate to the Sign Up screen

```typescript
await supabase.auth.signOut()
useUserStore.getState().reset()
useDpStore.getState().reset()
// etc.
navigation.reset({ index: 0, routes: [{ name: 'SignUp' }] })
```
