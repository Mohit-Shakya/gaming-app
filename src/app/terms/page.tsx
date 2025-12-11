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
          padding: "40px 20px 80px",
        }}
      >
        {/* Back to Home */}
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            color: colors.cyan,
            textDecoration: "none",
            marginBottom: "32px",
            transition: "all 0.2s",
          }}
        >
          ← Back to Home
        </Link>

        {/* Header */}
        <header style={{ marginBottom: "48px" }}>
          <h1
            style={{
              fontFamily: fonts.heading,
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 800,
              marginBottom: "16px",
              background: `linear-gradient(135deg, ${colors.red} 0%, ${colors.cyan} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Terms of Service
          </h1>
          <p style={{ fontSize: "16px", color: colors.textMuted }}>
            Last Updated: December 11, 2024
          </p>
        </header>

        {/* Content */}
        <div
          style={{
            background: colors.darkCard,
            border: `1px solid ${colors.border}`,
            borderRadius: "16px",
            padding: "40px",
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
            <ul style={{ paddingLeft: "20px", marginTop: "12px" }}>
              <li>Search and discover gaming cafés across India</li>
              <li>Book gaming sessions at partner cafés</li>
              <li>View café facilities, equipment, and pricing</li>
              <li>Manage bookings and payment history</li>
              <li>Review and rate gaming experiences</li>
            </ul>
          </Section>

          <Section title="3. User Accounts">
            <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px", color: colors.textPrimary }}>
              3.1 Registration
            </h3>
            <p>
              To book gaming sessions, you must create an account by providing accurate and complete
              information. You may register using Google authentication or email.
            </p>

            <h3 style={{ fontSize: "18px", fontWeight: 600, margin: "20px 0 12px", color: colors.textPrimary }}>
              3.2 Account Security
            </h3>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials.
              Any activity under your account is your responsibility. Notify us immediately of any
              unauthorized access.
            </p>

            <h3 style={{ fontSize: "18px", fontWeight: 600, margin: "20px 0 12px", color: colors.textPrimary }}>
              3.3 Age Requirement
            </h3>
            <p>
              You must be at least 13 years old to use BookMyGame. Users under 18 require parental
              consent for bookings and transactions.
            </p>
          </Section>

          <Section title="4. Booking and Payment">
            <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px", color: colors.textPrimary }}>
              4.1 Booking Process
            </h3>
            <p>
              When you make a booking through BookMyGame, you agree to pay the specified amount
              for the gaming session. All bookings are subject to café availability.
            </p>

            <h3 style={{ fontSize: "18px", fontWeight: 600, margin: "20px 0 12px", color: colors.textPrimary }}>
              4.2 Payment
            </h3>
            <p>
              We accept various payment methods including UPI, credit/debit cards, and digital
              wallets. All payments are processed securely through our payment partners.
            </p>

            <h3 style={{ fontSize: "18px", fontWeight: 600, margin: "20px 0 12px", color: colors.textPrimary }}>
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
            <ul style={{ paddingLeft: "20px", marginTop: "12px" }}>
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
            <ul style={{ paddingLeft: "20px", marginTop: "12px" }}>
              <li>Providing the gaming equipment and facilities as advertised</li>
              <li>Maintaining a safe and clean environment</li>
              <li>Honoring confirmed bookings</li>
              <li>Resolving on-site issues and disputes</li>
            </ul>
            <p style={{ marginTop: "12px" }}>
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
            <ul style={{ paddingLeft: "20px", marginTop: "12px" }}>
              <li>Direct or indirect damages arising from platform use</li>
              <li>Loss of data, bookings, or account access</li>
              <li>Issues arising at gaming café premises</li>
              <li>Service interruptions or technical difficulties</li>
              <li>Actions or omissions of third-party cafés</li>
            </ul>
            <p style={{ marginTop: "12px" }}>
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
            <p style={{ marginTop: "12px" }}>
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
            <div style={{ marginTop: "16px", padding: "16px", background: colors.darkerCard, borderRadius: "8px" }}>
              <p style={{ margin: "4px 0" }}>
                <strong>Email:</strong>{" "}
                <a href="mailto:bookmygame169@gmail.com" style={{ color: colors.cyan }}>
                  bookmygame169@gmail.com
                </a>
              </p>
              <p style={{ margin: "4px 0" }}>
                <strong>Phone:</strong>{" "}
                <a href="tel:+919910457855" style={{ color: colors.cyan }}>
                  +91 99104 57855
                </a>
              </p>
              <p style={{ margin: "4px 0" }}>
                <strong>Location:</strong> Delhi, India
              </p>
            </div>
          </Section>

          <div
            style={{
              marginTop: "40px",
              padding: "20px",
              background: "rgba(0, 240, 255, 0.1)",
              border: `1px solid ${colors.cyan}`,
              borderRadius: "12px",
            }}
          >
            <p style={{ fontSize: "14px", color: colors.textSecondary, margin: 0 }}>
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
    <section style={{ marginBottom: "40px" }}>
      <h2
        style={{
          fontSize: "22px",
          fontWeight: 700,
          marginBottom: "16px",
          color: colors.textPrimary,
          fontFamily: fonts.heading,
        }}
      >
        {title}
      </h2>
      <div style={{ fontSize: "15px", lineHeight: 1.7, color: colors.textSecondary }}>
        {children}
      </div>
    </section>
  );
}
