# Integrations

## Health Platform Integrations

### Apple Health (iOS)
- **Read**: Steps, active calories, weight, workouts logged in other apps
- **Write**: Workouts logged in Trained, weight entries
- Sync frequency: real-time or daily batch
- Permission handling and privacy controls

### Google Fit (Android)
- **Read**: Steps, calories, weight, workouts
- **Write**: Workouts, weight
- OAuth2 authentication flow
- Background sync capability

### Samsung Health
- Similar to Google Fit integration
- Samsung-specific API requirements

---

## Wearable Integrations

### Apple Watch
- Companion app for quick workout logging
- Complications for streak display
- Workout auto-detection and import
- Heart rate data for calorie accuracy

### Fitbit
- OAuth connection to Fitbit account
- Import workouts, steps, sleep
- Weight sync from Fitbit scale

### Garmin
- Garmin Connect API integration
- Import running, cycling, strength workouts
- Training load considerations

### Whoop
- Strain and recovery data import
- Readiness score integration
- Suggest rest days based on recovery

---

## Nutrition Integrations

### MyFitnessPal
- Import logged meals
- Sync macro targets
- Avoid double-logging

### Cronometer
- Micronutrient data import
- Detailed nutrition sync

### Barcode Scanning
- In-app barcode scanner
- Open Food Facts database integration
- Quick food logging from packages

---

## Fitness App Integrations

### Strava
- Import cardio workouts (runs, rides)
- Activity feed integration
- Strava challenges participation

### Strong App
- Import weightlifting data
- Exercise history sync
- PR detection from Strong logs

### Hevy
- Similar to Strong integration
- Workout template import

---

## Smart Scale Integrations

### Withings
- Auto-import weight measurements
- Body composition data (if available)
- Trend sync

### Renpho
- Weight auto-sync
- Body fat percentage import

### Eufy
- Weight and composition sync

---

## Calendar Integrations

### Google Calendar
- Workout reminders as calendar events
- Rest day blocking
- Meal prep reminders

### Apple Calendar
- Similar to Google Calendar
- Native iOS integration

---

## Implementation Considerations

### Privacy & Permissions
- Granular permission requests (don't ask for everything)
- Clear explanation of what data is used and why
- Easy disconnect/revoke access
- Data deletion on disconnect

### Sync Conflict Resolution
- Manual entry takes precedence over imported
- User can choose "always prefer X" settings
- Duplicate detection and merging

### Battery & Performance
- Background sync should be battery-efficient
- Batch syncs vs real-time tradeoffs
- User control over sync frequency

---

## Implementation Priority

1. **Phase 1**: Apple Health read/write (largest iOS user base)
2. **Phase 2**: Google Fit for Android users
3. **Phase 3**: Barcode scanning for nutrition
4. **Phase 4**: Apple Watch companion
5. **Phase 5**: Third-party fitness apps (Strava, Strong)
6. **Phase 6**: Smart scales and other wearables
