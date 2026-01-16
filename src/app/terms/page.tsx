// src/app/terms/page.tsx
import Link from "next/link";
import { colors, fonts } from "@/lib/constants";

export const metadata = {
  title: "Terms of Service - BookMyGame",
  description: "Terms and conditions for using BookMyGame gaming cafe booking platform",
};

export default function TermsPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(circle at top, #1e1b4b 0%, #050509 45%)`,
        fontFamily: fonts.body,
        color: colors.textPrimary,
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "16px",
        }}
        className="sm:px-6 sm:py-10 md:px-8 md:py-12 lg:py-16"
      >
        {/* Back to Home */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm mb-6 sm:mb-8 md:mb-10 transition-all hover:gap-3"
          style={{
            color: colors.cyan,
            textDecoration: "none",
          }}
        >
          ← Back to Home
        </Link>

        {/* Header */}
        <header className="mb-8 sm:mb-10 md:mb-12">
          <h1
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-3 sm:mb-4"
            style={{
              fontFamily: fonts.heading,
              background: `linear-gradient(135deg, ${colors.red} 0%, ${colors.cyan} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Terms of Service
          </h1>
          <p className="text-sm sm:text-base" style={{ color: colors.textMuted }}>
            Last Updated: December 11, 2024
          </p>
        </header>

        {/* Content */}
        <div
          className="p-4 sm:p-6 md:p-8 lg:p-10 rounded-lg sm:rounded-xl md:rounded-2xl"
          style={{
            background: colors.darkCard,
            border: `1px solid ${colors.border}`,
          }}
        >
          <Section title="1. Acceptance of Terms">
            <p>
              Welcome to BookMyGame! By accessing or using our platform at{" "}
              <a href="https://www.bookmygame.co.in" style={{ color: colors.cyan }}>
                www.bookmygame.co.in
              </a>
              , you agree to be bound by these Terms of Service. If you do not agree to these terms,
              please do not use our services.
            </p>
          </Section>

          <Section title="2. Description of Service">
            <p>
              BookMyGame is India's premier gaming café booking platform that allows users to:
            </p>
            <ul className="pl-4 sm:pl-5 mt-3 space-y-1.5 sm:space-y-2">
              <li>Search and discover gaming cafés across India</li>
              <li>Book gaming sessions at partner cafés</li>
              <li>View café facilities, equipment, and pricing</li>
              <li>Manage bookings and payment history</li>
              <li>Review and rate gaming experiences</li>
            </ul>
          </Section>

          <Section title="3. User Accounts">
            <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3" style={{ color: colors.textPrimary }}>
              3.1 Registration
            </h3>
            <p>
              To book gaming sessions, you must create an account by providing accurate and complete
              information. You may register using Google authentication or email.
            </p>

            <h3 className="text-base sm:text-lg font-semibold mt-4 sm:mt-5 mb-2 sm:mb-3" style={{ color: colors.textPrimary }}>
              3.2 Account Security
            </h3>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials.
              Any activity under your account is your responsibility. Notify us immediately of any
              unauthorized access.
            </p>

            <h3 className="text-base sm:text-lg font-semibold mt-4 sm:mt-5 mb-2 sm:mb-3" style={{ color: colors.textPrimary }}>
              3.3 Age Requirement
            </h3>
            <p>
              You must be at least 13 years old to use BookMyGame. Users under 18 require parental
              consent for bookings and transactions.
            </p>
          </Section>

          <Section title="4. Booking and Payment">
            <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3" style={{ color: colors.textPrimary }}>
              4.1 Booking Process
            </h3>
            <p>
              When you make a booking through BookMyGame, you agree to pay the specified amount
              for the gaming session. All bookings are subject to café availability.
            </p>

            <h3 className="text-base sm:text-lg font-semibold mt-4 sm:mt-5 mb-2 sm:mb-3" style={{ color: colors.textPrimary }}>
              4.2 Payment
            </h3>
            <p>
              We accept various payment methods including UPI, credit/debit cards, and digital
              wallets. All payments are processed securely through our payment partners.
            </p>

            <h3 className="text-base sm:text-lg font-semibold mt-4 sm:mt-5 mb-2 sm:mb-3" style={{ color: colors.textPrimary }}>
              4.3 Pricing
            </h3>
            <p>
              Prices are set by individual gaming cafés and are displayed in Indian Rupees (₹).
              Prices may vary based on time, equipment, and special offers.
            </p>
          </Section>

          <Section title="5. Cancellation and Refunds">
            <p>
              Please refer to our{" "}
              <a href="/refund" style={{ color: colors.cyan }}>
                Refund Policy
              </a>{" "}
              for detailed information about cancellations, refunds, and rescheduling.
            </p>
          </Section>

          <Section title="6. User Conduct">
            <p>You agree NOT to:</p>
            <ul className="pl-4 sm:pl-5 mt-3 space-y-1.5 sm:space-y-2">
              <li>Provide false or misleading information</li>
              <li>Use the platform for any illegal or unauthorized purpose</li>
              <li>Interfere with or disrupt the platform's functionality</li>
              <li>Attempt to gain unauthorized access to other users' accounts</li>
              <li>Post offensive, abusive, or inappropriate content in reviews</li>
              <li>Use automated systems or bots to access the platform</li>
              <li>Resell or transfer bookings without authorization</li>
            </ul>
          </Section>

          <Section title="7. Gaming Café Responsibilities">
            <p>
              Gaming cafés listed on BookMyGame are independent businesses. While we facilitate
              bookings, the cafés are responsible for:
            </p>
            <ul className="pl-4 sm:pl-5 mt-3 space-y-1.5 sm:space-y-2">
              <li>Providing the gaming equipment and facilities as advertised</li>
              <li>Maintaining a safe and clean environment</li>
              <li>Honoring confirmed bookings</li>
              <li>Resolving on-site issues and disputes</li>
            </ul>
            <p className="mt-3">
              BookMyGame acts as a booking platform and is not responsible for the quality of
              services provided by individual cafés.
            </p>
          </Section>

          <Section title="8. Intellectual Property">
            <p>
              All content on BookMyGame, including logos, text, graphics, and software, is the
              property of BookMyGame or its licensors. You may not copy, modify, distribute, or
              reproduce any content without explicit permission.
            </p>
          </Section>

          <Section title="9. Privacy">
            <p>
              Your privacy is important to us. Please review our{" "}
              <a href="/privacy" style={{ color: colors.cyan }}>
                Privacy Policy
              </a>{" "}
              to understand how we collect, use, and protect your personal information.
            </p>
          </Section>

          <Section title="10. Limitation of Liability">
            <p>
              BookMyGame provides the platform "as is" without warranties of any kind. We are not
              liable for:
            </p>
            <ul className="pl-4 sm:pl-5 mt-3 space-y-1.5 sm:space-y-2">
              <li>Direct or indirect damages arising from platform use</li>
              <li>Loss of data, bookings, or account access</li>
              <li>Issues arising at gaming café premises</li>
              <li>Service interruptions or technical difficulties</li>
              <li>Actions or omissions of third-party cafés</li>
            </ul>
            <p className="mt-3">
              Our total liability shall not exceed the amount paid for the specific booking in
              question.
            </p>
          </Section>

          <Section title="11. Dispute Resolution">
            <p>
              For booking-related disputes, please contact us at{" "}
              <a href="mailto:bookmygame169@gmail.com" style={{ color: colors.cyan }}>
                bookmygame169@gmail.com
              </a>
              . We will work with you and the gaming café to resolve issues amicably.
            </p>
            <p className="mt-3">
              Any legal disputes shall be governed by the laws of India and subject to the
              jurisdiction of courts in Delhi, India.
            </p>
          </Section>

          <Section title="12. Modifications to Terms">
            <p>
              We reserve the right to modify these Terms of Service at any time. Changes will be
              effective immediately upon posting. Continued use of the platform after changes
              constitutes acceptance of the modified terms.
            </p>
          </Section>

          <Section title="13. Termination">
            <p>
              We may suspend or terminate your account at our discretion if you violate these
              terms or engage in fraudulent activity. Upon termination, you lose access to your
              account and any pending bookings may be cancelled.
            </p>
          </Section>

          <Section title="14. Contact Information">
            <p>For questions or concerns about these Terms of Service, please contact us:</p>
            <div className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-lg" style={{ background: colors.darkerCard }}>
              <p className="my-1">
                <strong>Email:</strong>{" "}
                <a href="mailto:bookmygame169@gmail.com" className="break-all" style={{ color: colors.cyan }}>
                  bookmygame169@gmail.com
                </a>
              </p>
              <p className="my-1">
                <strong>Phone:</strong>{" "}
                <a href="tel:+919315319103" style={{ color: colors.cyan }}>
                  +91 93153 19103
                </a>
              </p>
              <p className="my-1">
                <strong>Location:</strong> 1st Floor, A-166, Devli Rd, near by Aggrawal and Lower floor of Fit box Gym, Pocket B, Jawahar Park, Khanpur, New Delhi, Delhi 110080
              </p>
            </div>
          </Section>

          <div
            className="mt-6 sm:mt-8 md:mt-10 p-4 sm:p-5 rounded-lg sm:rounded-xl"
            style={{
              background: "rgba(0, 240, 255, 0.1)",
              border: `1px solid ${colors.cyan}`,
            }}
          >
            <p className="text-xs sm:text-sm m-0" style={{ color: colors.textSecondary }}>
              By using BookMyGame, you acknowledge that you have read, understood, and agree to be
              bound by these Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 sm:mb-8 md:mb-10">
      <h2
        className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4"
        style={{
          color: colors.textPrimary,
          fontFamily: fonts.heading,
        }}
      >
        {title}
      </h2>
      <div className="text-sm sm:text-base leading-relaxed" style={{ color: colors.textSecondary }}>
        {children}
      </div>
    </section>
  );
}
