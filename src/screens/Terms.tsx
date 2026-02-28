import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

export function Terms() {
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
          <h1 className="text-2xl font-bold">Terms of Use</h1>
        </div>
      </div>

      {/* Terms Content */}
      <div className="px-5 py-6 space-y-6 text-sm text-foreground/90 leading-relaxed">
        <p className="text-xs text-muted-foreground">Last updated: February 2026</p>

        <p>
          Welcome to WellTrained. By using our fitness tracking application, you agree to
          these Terms of Use. Please read them carefully before using the app.
        </p>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">Use of Service</h2>
          <p className="text-foreground/80 mb-2">
            WellTrained provides fitness tracking, nutrition logging, and training guidance.
            You may use the service for personal, non-commercial purposes only.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-foreground/80">
            <li>You must be at least 13 years old to use this service</li>
            <li>You are responsible for maintaining the security of your account</li>
            <li>You agree not to misuse or attempt to disrupt the service</li>
            <li>You will not use the service for any illegal purpose</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">User Accounts</h2>
          <p className="text-foreground/80">
            You are responsible for all activity that occurs under your account. Keep your
            login credentials secure and notify us immediately if you suspect unauthorized
            access. We reserve the right to suspend or terminate accounts that violate these
            terms.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">Subscriptions</h2>
          <p className="text-foreground/80 mb-2">
            WellTrained offers premium features through paid subscriptions. By subscribing:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-foreground/80">
            <li>Payment will be charged to your iTunes Account at confirmation of purchase</li>
            <li>
              Subscription automatically renews unless auto-renew is turned off at least
              24 hours before the end of the current period
            </li>
            <li>
              Your account will be charged for renewal within 24 hours prior to the end
              of the current period
            </li>
            <li>
              Subscriptions may be managed and auto-renewal may be turned off in your
              Account Settings after purchase
            </li>
            <li>
              No refunds are provided for partial subscription periods
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">User Content</h2>
          <p className="text-foreground/80">
            You retain ownership of content you submit (photos, notes, etc.). By submitting
            content, you grant us a license to store and process it for providing the service.
            You are responsible for ensuring you have the right to submit any content.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">Termination</h2>
          <p className="text-foreground/80">
            You may stop using the service and delete your account at any time via Settings.
            We may suspend or terminate your access if you violate these terms or engage in
            harmful conduct. Upon termination, your right to use the service ceases immediately.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">Disclaimers</h2>
          <p className="text-foreground/80">
            WellTrained is provided "as is" without warranties of any kind. We do not guarantee
            fitness results. The app provides general fitness guidance and should not replace
            professional medical advice. Consult a healthcare provider before starting any
            exercise or nutrition program.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">Limitation of Liability</h2>
          <p className="text-foreground/80">
            To the fullest extent permitted by law, WellTrained and its operators shall not
            be liable for any indirect, incidental, special, consequential, or punitive damages,
            or any loss of profits or revenues, whether incurred directly or indirectly, or any
            loss of data, use, goodwill, or other intangible losses resulting from your use of
            the service.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">Changes to Terms</h2>
          <p className="text-foreground/80">
            We may update these terms from time to time. Continued use of the service after
            changes constitutes acceptance of the new terms. We will notify you of significant
            changes through the app or via email.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">Privacy</h2>
          <p className="text-foreground/80">
            Your use of WellTrained is also governed by our{' '}
            <button
              onClick={() => navigate('/privacy')}
              className="text-primary underline"
            >
              Privacy Policy
            </button>
            , which describes how we collect, use, and protect your personal information.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">Contact</h2>
          <p className="text-foreground/80">
            If you have questions about these Terms of Use, contact us at{' '}
            <a href="mailto:support@welltrained.fitness" className="text-primary underline">
              support@welltrained.fitness
            </a>.
          </p>
        </section>
      </div>
    </div>
  )
}
