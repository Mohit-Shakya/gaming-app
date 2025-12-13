// src/app/privacy/page.tsx
import Link from "next/link";
import { colors, fonts } from "@/lib/constants";

export const metadata = {
  title: "Privacy Policy - BookMyGame",
  description: "Privacy policy for BookMyGame gaming cafe booking platform",
};

export default function PrivacyPage() {
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
            Privacy Policy
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
          <Section title="1. Introduction">
            <p>
              At BookMyGame, we respect your privacy and are committed to protecting your personal
              information. This Privacy Policy explains how we collect, use, disclose, and safeguard
              your information when you use our gaming café booking platform at{" "}
              <a href="https://www.bookmygame.co.in" style={{ color: colors.cyan }}>
                www.bookmygame.co.in
              </a>
              .
            </p>
            <p className="mt-3">
              By using BookMyGame, you consent to the practices described in this policy.
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3" style={{ color: colors.textPrimary }}>
              2.1 Personal Information
            </h3>
            <p>When you create an account or make a booking, we collect:</p>
            <ul className="pl-4 sm:pl-5 mt-3 space-y-1.5 sm:space-y-2">
              <li><strong>Account Information:</strong> Name, email address, phone number</li>
              <li><strong>Profile Data:</strong> Username, profile picture (if using Google login)</li>
              <li><strong>Payment Information:</strong> Billing details, transaction history</li>
              <li><strong>Booking Details:</strong> Gaming café preferences, session times, special requests</li>
            </ul>

            <h3 className="text-base sm:text-lg font-semibold mt-4 sm:mt-5 mb-2 sm:mb-3" style={{ color: colors.textPrimary }}>
              2.2 Automatically Collected Information
            </h3>
            <p>When you use our platform, we automatically collect:</p>
            <ul className="pl-4 sm:pl-5 mt-3 space-y-1.5 sm:space-y-2">
              <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent on platform</li>
              <li><strong>Location Data:</strong> Approximate location based on IP address (for showing nearby cafés)</li>
              <li><strong>Cookies:</strong> Small data files stored on your device for authentication and preferences</li>
            </ul>

            <h3 className="text-base sm:text-lg font-semibold mt-4 sm:mt-5 mb-2 sm:mb-3" style={{ color: colors.textPrimary }}>
              2.3 Third-Party Authentication
            </h3>
            <p>
              If you sign in using Google OAuth, we receive basic profile information (name, email,
              profile picture) from Google according to your Google account settings.
            </p>
          </Section>

          <Section title="3. How We Use Your Information">
            <p>We use your information for the following purposes:</p>
            <ul className="pl-4 sm:pl-5 mt-3 space-y-1.5 sm:space-y-2">
              <li><strong>Service Delivery:</strong> Process bookings, manage reservations, send confirmations</li>
              <li><strong>Account Management:</strong> Create and maintain your user account</li>
              <li><strong>Payment Processing:</strong> Handle transactions and generate receipts</li>
              <li><strong>Communication:</strong> Send booking updates, promotional offers, and important notices</li>
              <li><strong>Personalization:</strong> Recommend gaming cafés based on your preferences and history</li>
              <li><strong>Customer Support:</strong> Respond to inquiries and resolve issues</li>
              <li><strong>Platform Improvement:</strong> Analyze usage patterns to enhance user experience</li>
              <li><strong>Security:</strong> Detect fraud, prevent abuse, and protect user accounts</li>
              <li><strong>Legal Compliance:</strong> Meet regulatory requirements and enforce our terms</li>
            </ul>
          </Section>

          <Section title="4. Information Sharing and Disclosure">
            <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3" style={{ color: colors.textPrimary }}>
              4.1 Gaming Cafés
            </h3>
            <p>
              When you make a booking, we share necessary information (name, contact details, booking
              preferences) with the gaming café to fulfill your reservation.
            </p>

            <h3 className="text-base sm:text-lg font-semibold mt-4 sm:mt-5 mb-2 sm:mb-3" style={{ color: colors.textPrimary }}>
              4.2 Service Providers
            </h3>
            <p>We share data with trusted third-party providers who help us operate the platform:</p>
            <ul className="pl-4 sm:pl-5 mt-3 space-y-1.5 sm:space-y-2">
              <li><strong>Supabase:</strong> Database and authentication services</li>
              <li><strong>Payment Processors:</strong> Secure payment gateway partners</li>
              <li><strong>Email Services:</strong> For sending booking confirmations and notifications</li>
              <li><strong>Hosting Providers:</strong> Vercel for platform hosting</li>
            </ul>

            <h3 className="text-base sm:text-lg font-semibold mt-4 sm:mt-5 mb-2 sm:mb-3" style={{ color: colors.textPrimary }}>
              4.3 Legal Requirements
            </h3>
            <p>
              We may disclose your information if required by law, court order, or government
              regulation, or to protect our rights, property, or safety.
            </p>

            <h3 className="text-base sm:text-lg font-semibold mt-4 sm:mt-5 mb-2 sm:mb-3" style={{ color: colors.textPrimary }}>
              4.4 Business Transfers
            </h3>
            <p>
              If BookMyGame is involved in a merger, acquisition, or sale, your information may be
              transferred to the new entity.
            </p>
          </Section>

          <Section title="5. Data Security">
            <p>
              We implement industry-standard security measures to protect your information:
            </p>
            <ul className="pl-4 sm:pl-5 mt-3 space-y-1.5 sm:space-y-2">
              <li>Encrypted data transmission using HTTPS/SSL</li>
              <li>Secure authentication through Supabase</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and password protection</li>
              <li>Payment data handled by PCI-compliant processors</li>
            </ul>
            <p className="mt-3 p-3 sm:p-4 rounded-lg" style={{ background: "rgba(255, 107, 0, 0.1)", border: `1px solid rgba(255, 107, 0, 0.3)` }}>
              <strong>Note:</strong> No method of transmission over the internet is 100% secure.
              While we strive to protect your information, we cannot guarantee absolute security.
            </p>
          </Section>

          <Section title="6. Your Privacy Rights">
            <p>You have the following rights regarding your personal information:</p>
            <ul className="pl-4 sm:pl-5 mt-3 space-y-1.5 sm:space-y-2">
              <li>
                <strong>Access:</strong> Request a copy of the personal information we hold about you
              </li>
              <li>
                <strong>Correction:</strong> Update or correct inaccurate information through your profile settings
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your account and associated data
              </li>
              <li>
                <strong>Opt-Out:</strong> Unsubscribe from promotional emails (booking emails are mandatory)
              </li>
              <li>
                <strong>Data Portability:</strong> Request your data in a machine-readable format
              </li>
              <li>
                <strong>Withdraw Consent:</strong> Revoke consent for data processing (may limit service access)
              </li>
            </ul>
            <p className="mt-3">
              To exercise these rights, contact us at{" "}
              <a href="mailto:bookmygame169@gmail.com" style={{ color: colors.cyan }}>
                bookmygame169@gmail.com
              </a>
            </p>
          </Section>

          <Section title="7. Cookies and Tracking">
            <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3" style={{ color: colors.textPrimary }}>
              7.1 What Are Cookies?
            </h3>
            <p>
              Cookies are small text files stored on your device that help us recognize you and
              remember your preferences.
            </p>

            <h3 className="text-base sm:text-lg font-semibold mt-4 sm:mt-5 mb-2 sm:mb-3" style={{ color: colors.textPrimary }}>
              7.2 Types of Cookies We Use
            </h3>
            <ul className="pl-4 sm:pl-5 mt-3 space-y-1.5 sm:space-y-2">
              <li><strong>Essential Cookies:</strong> Required for login and basic functionality</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and choices</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how users interact with the platform</li>
            </ul>

            <h3 className="text-base sm:text-lg font-semibold mt-4 sm:mt-5 mb-2 sm:mb-3" style={{ color: colors.textPrimary }}>
              7.3 Managing Cookies
            </h3>
            <p>
              You can control cookies through your browser settings. Note that disabling essential
              cookies may affect platform functionality.
            </p>
          </Section>

          <Section title="8. Children's Privacy">
            <p>
              BookMyGame is not intended for children under 13. We do not knowingly collect personal
              information from children under 13. If you believe we have inadvertently collected such
              information, please contact us immediately.
            </p>
            <p className="mt-3">
              Users aged 13-17 should obtain parental consent before using our services.
            </p>
          </Section>

          <Section title="9. Data Retention">
            <p>
              We retain your personal information for as long as necessary to provide our services
              and comply with legal obligations:
            </p>
            <ul className="pl-4 sm:pl-5 mt-3 space-y-1.5 sm:space-y-2">
              <li><strong>Account Data:</strong> Retained while your account is active</li>
              <li><strong>Booking History:</strong> Stored for 3 years for accounting purposes</li>
              <li><strong>Payment Records:</strong> Retained as required by Indian tax laws</li>
              <li><strong>Deleted Accounts:</strong> Personal data permanently deleted within 30 days</li>
            </ul>
          </Section>

          <Section title="10. International Data Transfers">
            <p>
              Your information is primarily stored in servers located in India. If data is transferred
              internationally (e.g., through our service providers), we ensure appropriate safeguards
              are in place to protect your information.
            </p>
          </Section>

          <Section title="11. Changes to This Privacy Policy">
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices
              or legal requirements. The "Last Updated" date at the top indicates when the policy was
              last modified.
            </p>
            <p className="mt-3">
              Significant changes will be communicated via email or prominent notice on the platform.
              Continued use after changes constitutes acceptance.
            </p>
          </Section>

          <Section title="12. Contact Us">
            <p>
              If you have questions, concerns, or requests regarding this Privacy Policy or your
              personal information, please contact us:
            </p>
            <div className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-lg" style={{ background: colors.darkerCard }}>
              <p className="my-1">
                <strong>Email:</strong>{" "}
                <a href="mailto:bookmygame169@gmail.com" className="break-all" style={{ color: colors.cyan }}>
                  bookmygame169@gmail.com
                </a>
              </p>
              <p className="my-1">
                <strong>Phone:</strong>{" "}
                <a href="tel:+919910457855" style={{ color: colors.cyan }}>
                  +91 99104 57855
                </a>
              </p>
              <p className="my-1">
                <strong>Location:</strong> Delhi, India
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
              Your privacy matters to us. We are committed to protecting your personal information
              and being transparent about how we use it. Thank you for trusting BookMyGame with your
              gaming experiences.
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
