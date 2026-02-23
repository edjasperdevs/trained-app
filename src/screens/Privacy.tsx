import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

export function Privacy() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="pt-8 pb-6 px-5 bg-card">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="w-10 h-10 bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">Privacy Policy</h1>
        </div>
      </div>

      {/* Policy Content */}
      <div className="px-5 py-6 space-y-6 text-sm text-foreground/90 leading-relaxed">
        <p className="text-xs text-muted-foreground">Last updated: February 2026</p>

        <p>
          WellTrained ("we", "our", or "us") operates the fitness tracking application
          available at app.welltrained.fitness. This Privacy Policy describes how we collect,
          use, and protect your personal information when you use our app.
        </p>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">Information We Collect</h2>

          <h3 className="text-sm font-semibold text-foreground/80 mt-4 mb-1">Account Information</h3>
          <ul className="list-disc pl-5 space-y-1 text-foreground/80">
            <li>Email address (used for authentication via Supabase)</li>
            <li>Internal user ID (Supabase auth UUID)</li>
          </ul>

          <h3 className="text-sm font-semibold text-foreground/80 mt-4 mb-1">Health &amp; Fitness Data</h3>
          <ul className="list-disc pl-5 space-y-1 text-foreground/80">
            <li>Workout logs and training history</li>
            <li>Macro and nutrition targets</li>
            <li>Weight history</li>
            <li>Daily check-in logs</li>
          </ul>

          <h3 className="text-sm font-semibold text-foreground/80 mt-4 mb-1">User Content</h3>
          <ul className="list-disc pl-5 space-y-1 text-foreground/80">
            <li>Check-in photos (stored in Supabase Storage)</li>
            <li>Text notes on weekly check-ins</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">Analytics</h2>
          <ul className="list-disc pl-5 space-y-1 text-foreground/80">
            <li>
              <span className="font-medium">Plausible Analytics:</span> Anonymous page views only.
              No cookies, no personal data collected. Privacy-focused and GDPR-compliant.
            </li>
            <li>
              <span className="font-medium">Sentry:</span> Crash reports and performance data.
              Personally identifiable information (PII) is stripped before transmission.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">How We Use Your Data</h2>
          <ul className="list-disc pl-5 space-y-1 text-foreground/80">
            <li>Provide the fitness tracking and coaching features</li>
            <li>Sync your data between devices</li>
            <li>Enable coach-client interaction (workouts, macros, check-ins)</li>
            <li>Improve app stability through crash reports (Sentry)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">Third-Party Services</h2>
          <p className="text-foreground/80 mb-2">
            We use the following third-party services to provide app functionality:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-foreground/80">
            <li>
              <span className="font-medium">Supabase</span> — Database, authentication,
              and file storage (EU/US hosting)
            </li>
            <li>
              <span className="font-medium">Sentry</span> — Error tracking and performance
              monitoring (PII stripped)
            </li>
            <li>
              <span className="font-medium">Plausible</span> — Privacy-focused analytics
              (EU-based, GDPR-compliant, no personal data)
            </li>
            <li>
              <span className="font-medium">Apple Push Notification service</span> — Push
              notification delivery
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">Data Sharing</h2>
          <p className="text-foreground/80">
            We do not sell your personal data. Data is shared only with the third-party
            services listed above for the sole purpose of providing app functionality.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">Data Retention</h2>
          <p className="text-foreground/80">
            Your data is retained while your account is active. You can delete your account
            at any time from Settings, which permanently removes all associated data from
            our servers.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">Your Rights</h2>
          <p className="text-foreground/80 mb-2">You have the right to:</p>
          <ul className="list-disc pl-5 space-y-1 text-foreground/80">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Delete your account and all associated data</li>
          </ul>
          <p className="text-foreground/80 mt-2">
            Account deletion is available in-app via Settings &gt; Danger Zone &gt; Delete Account.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">Children's Privacy</h2>
          <p className="text-foreground/80">
            WellTrained is not directed at children under 13. We do not knowingly collect
            personal information from children under 13. If you believe we have collected
            such information, please contact us so we can promptly remove it.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">Contact</h2>
          <p className="text-foreground/80">
            If you have questions about this Privacy Policy or your data, contact us at{' '}
            <a href="mailto:privacy@welltrained.fitness" className="text-primary underline">
              privacy@welltrained.fitness
            </a>.
          </p>
        </section>
      </div>
    </div>
  )
}
