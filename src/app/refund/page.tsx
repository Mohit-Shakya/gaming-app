// src/app/refund/page.tsx
import Link from "next/link";
import { colors, fonts } from "@/lib/constants";

export const metadata = {
  title: "Refund Policy - BookMyGame",
  description: "Cancellation and refund policy for BookMyGame gaming cafe bookings",
};

export default function RefundPage() {
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
            Refund Policy
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
          <Section title="1. Overview">
            <p>
              At BookMyGame, we understand that plans can change. This Refund Policy explains the
              cancellation and refund process for gaming café bookings made through our platform at{" "}
              <a href="https://www.bookmygame.co.in" style={{ color: colors.cyan }}>
                www.bookmygame.co.in
              </a>
              .
            </p>
            <p className="mt-3">
              Please read this policy carefully before making a booking, as refund eligibility
              depends on when you cancel.
            </p>
          </Section>

          <Section title="2. Cancellation Windows">
            <div className="grid gap-3 sm:gap-4 mt-3 sm:mt-4">
              {/* Full Refund */}
              <div
                className="p-4 sm:p-5 rounded-lg sm:rounded-xl"
                style={{
                  background: "rgba(34, 197, 94, 0.1)",
                  border: "2px solid rgba(34, 197, 94, 0.3)",
                }}
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <span className="text-xl sm:text-2xl">✅</span>
                  <h3 className="text-base sm:text-lg font-semibold m-0" style={{ color: colors.green }}>
                    Full Refund (100%)
                  </h3>
                </div>
                <p className="mt-2 ml-7 sm:ml-9" style={{ color: colors.textSecondary }}>
                  Cancel <strong>24+ hours before</strong> your scheduled session
                </p>
                <p className="mt-1 ml-7 sm:ml-9 text-xs sm:text-sm" style={{ color: colors.textMuted }}>
                  Full booking amount refunded to your original payment method within 5-7 business days
                </p>
              </div>

              {/* Partial Refund */}
              <div
                className="p-4 sm:p-5 rounded-lg sm:rounded-xl"
                style={{
                  background: "rgba(255, 193, 7, 0.1)",
                  border: "2px solid rgba(255, 193, 7, 0.3)",
                }}
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <span className="text-xl sm:text-2xl">⚠️</span>
                  <h3 className="text-base sm:text-lg font-semibold m-0" style={{ color: colors.orange }}>
                    Partial Refund (50%)
                  </h3>
                </div>
                <p className="mt-2 ml-7 sm:ml-9" style={{ color: colors.textSecondary }}>
                  Cancel <strong>6-24 hours before</strong> your scheduled session
                </p>
                <p className="mt-1 ml-7 sm:ml-9 text-xs sm:text-sm" style={{ color: colors.textMuted }}>
                  50% of booking amount refunded; 50% charged as cancellation fee
                </p>
              </div>

              {/* No Refund */}
              <div
                className="p-4 sm:p-5 rounded-lg sm:rounded-xl"
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "2px solid rgba(239, 68, 68, 0.3)",
                }}
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <span className="text-xl sm:text-2xl">❌</span>
                  <h3 className="text-base sm:text-lg font-semibold m-0" style={{ color: colors.red }}>
                    No Refund (0%)
                  </h3>
                </div>
                <p className="mt-2 ml-7 sm:ml-9" style={{ color: colors.textSecondary }}>
                  Cancel <strong>less than 6 hours before</strong> or no-show
                </p>
                <p className="mt-1 ml-7 sm:ml-9 text-xs sm:text-sm" style={{ color: colors.textMuted }}>
                  Full amount forfeited; no refund provided
                </p>
              </div>
            </div>
          </Section>

          <Section title="3. How to Cancel a Booking">
            <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3" style={{ color: colors.textPrimary }}>
              3.1 Online Cancellation
            </h3>
            <p>You can cancel your booking through your account:</p>
            <ol className="pl-4 sm:pl-5 mt-3 space-y-1.5 sm:space-y-2">
              <li>Log in to your BookMyGame account</li>
              <li>Go to "My Bookings" in your dashboard</li>
              <li>Find the booking you want to cancel</li>
              <li>Click "Cancel Booking" and confirm</li>
              <li>You'll receive an email confirmation with refund details</li>
            </ol>

            <h3 className="text-base sm:text-lg font-semibold mt-4 sm:mt-5 mb-2 sm:mb-3" style={{ color: colors.textPrimary }}>
              3.2 Customer Support Cancellation
            </h3>
            <p>If you're unable to cancel online, contact us immediately:</p>
            <ul className="pl-4 sm:pl-5 mt-3 space-y-1.5 sm:space-y-2">
              <li>
                Email:{" "}
                <a href="mailto:bookmygame169@gmail.com" style={{ color: colors.cyan }}>
                  bookmygame169@gmail.com
                </a>
              </li>
              <li>
                Phone:{" "}
                <a href="tel:+919910457855" style={{ color: colors.cyan }}>
                  +91 99104 57855
                </a>
              </li>
            </ul>
            <p className="mt-3 text-xs sm:text-sm" style={{ color: colors.textMuted }}>
              Include your booking ID and reason for cancellation in your request.
            </p>
          </Section>

          <Section title="4. Refund Processing">
            <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3" style={{ color: colors.textPrimary }}>
              4.1 Refund Method
            </h3>
            <p>
              Refunds are processed to your original payment method:
            </p>
            <ul className="pl-4 sm:pl-5 mt-3 space-y-1.5 sm:space-y-2">
              <li><strong>UPI/Digital Wallets:</strong> 3-5 business days</li>
              <li><strong>Credit/Debit Cards:</strong> 5-7 business days</li>
              <li><strong>Net Banking:</strong> 5-7 business days</li>
            </ul>

            <h3 className="text-base sm:text-lg font-semibold mt-4 sm:mt-5 mb-2 sm:mb-3" style={{ color: colors.textPrimary }}>
              4.2 Refund Confirmation
            </h3>
            <p>
              You'll receive an email confirmation when:
            </p>
            <ul className="pl-4 sm:pl-5 mt-3 space-y-1.5 sm:space-y-2">
              <li>Your cancellation is processed</li>
              <li>Refund amount is calculated</li>
              <li>Refund is initiated to your payment method</li>
            </ul>
            <p className="mt-3 p-3 sm:p-4 rounded-lg" style={{ background: colors.darkerCard }}>
              <strong>Note:</strong> The actual time for the refund to appear in your account depends
              on your bank or payment provider's processing time.
            </p>
          </Section>

          <Section title="5. Special Circumstances">
            <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3" style={{ color: colors.textPrimary }}>
              5.1 Gaming Café Cancellations
            </h3>
            <p>
              If a gaming café cancels your booking or is unable to provide the booked service:
            </p>
            <ul className="pl-4 sm:pl-5 mt-3 space-y-1.5 sm:space-y-2">
              <li><strong>Full refund (100%)</strong> regardless of timing</li>
              <li>Refund processed within 3-5 business days</li>
              <li>We'll help you find an alternative café if needed</li>
            </ul>

            <h3 className="text-base sm:text-lg font-semibold mt-4 sm:mt-5 mb-2 sm:mb-3" style={{ color: colors.textPrimary }}>
              5.2 Technical Issues
            </h3>
            <p>
              If you experience technical issues at the café (equipment malfunction, internet outage):
            </p>
            <ul className="pl-4 sm:pl-5 mt-3 space-y-1.5 sm:space-y-2">
              <li>Report the issue to café staff immediately</li>
              <li>Contact BookMyGame support within 24 hours</li>
              <li>We'll investigate and issue a partial or full refund if appropriate</li>
            </ul>

            <h3 className="text-base sm:text-lg font-semibold mt-4 sm:mt-5 mb-2 sm:mb-3" style={{ color: colors.textPrimary }}>
              5.3 Medical Emergencies
            </h3>
            <p>
              In case of genuine medical emergencies with valid documentation:
            </p>
            <ul className="pl-4 sm:pl-5 mt-3 space-y-1.5 sm:space-y-2">
              <li>Contact support within 48 hours with medical proof</li>
              <li>We may offer a full refund or reschedule option</li>
              <li>Each case is reviewed individually</li>
            </ul>

            <h3 className="text-base sm:text-lg font-semibold mt-4 sm:mt-5 mb-2 sm:mb-3" style={{ color: colors.textPrimary }}>
              5.4 Natural Disasters / Force Majeure
            </h3>
            <p>
              For cancellations due to natural disasters, severe weather, or other force majeure events:
            </p>
            <ul className="pl-4 sm:pl-5 mt-3 space-y-1.5 sm:space-y-2">
              <li>Full refund or free rescheduling option</li>
              <li>Applies to both user and café-initiated cancellations</li>
            </ul>
          </Section>

          <Section title="6. Rescheduling Policy">
            <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3" style={{ color: colors.textPrimary }}>
              6.1 Free Rescheduling
            </h3>
            <p>
              You can reschedule your booking <strong>once for free</strong> if done at least{" "}
              <strong>12 hours before</strong> your scheduled session.
            </p>

            <h3 className="text-base sm:text-lg font-semibold mt-4 sm:mt-5 mb-2 sm:mb-3" style={{ color: colors.textPrimary }}>
              6.2 How to Reschedule
            </h3>
            <ol className="pl-4 sm:pl-5 mt-3 space-y-1.5 sm:space-y-2">
              <li>Go to "My Bookings" in your dashboard</li>
              <li>Select the booking you want to reschedule</li>
              <li>Click "Reschedule" and choose a new date/time</li>
              <li>Subject to availability at the gaming café</li>
            </ol>
            <p className="mt-3 text-xs sm:text-sm" style={{ color: colors.textMuted }}>
              Multiple rescheduling attempts may be subject to cancellation fees.
            </p>
          </Section>

          <Section title="7. Non-Refundable Scenarios">
            <p>The following situations are <strong>not eligible for refunds</strong>:</p>
            <ul className="pl-4 sm:pl-5 mt-3 space-y-1.5 sm:space-y-2">
              <li>
                <strong>No-shows:</strong> Failing to show up for your booking without cancellation
              </li>
              <li>
                <strong>Late arrivals:</strong> Arriving significantly late (gaming time cannot be extended)
              </li>
              <li>
                <strong>Violations:</strong> Cancellations due to policy violations or inappropriate behavior
              </li>
              <li>
                <strong>Partial usage:</strong> Leaving early after your session has started
              </li>
              <li>
                <strong>Personal preferences:</strong> Dissatisfaction with game selection, café ambiance, etc.
              </li>
              <li>
                <strong>Special promotions:</strong> Some promotional bookings may have different refund terms
              </li>
            </ul>
          </Section>

          <Section title="8. Dispute Resolution">
            <p>
              If you disagree with a refund decision or have concerns:
            </p>
            <ol className="pl-4 sm:pl-5 mt-3 space-y-1.5 sm:space-y-2">
              <li>
                Contact our support team at{" "}
                <a href="mailto:bookmygame169@gmail.com" style={{ color: colors.cyan }}>
                  bookmygame169@gmail.com
                </a>
              </li>
              <li>Provide your booking ID and detailed explanation</li>
              <li>We'll review your case within 2-3 business days</li>
              <li>Our decision will be communicated via email</li>
            </ol>
            <p className="mt-3">
              For unresolved disputes, refer to our{" "}
              <a href="/terms" style={{ color: colors.cyan }}>
                Terms of Service
              </a>{" "}
              for arbitration procedures.
            </p>
          </Section>

          <Section title="9. Payment Gateway Charges">
            <p>
              Please note that payment gateway processing fees (if any) are non-refundable. Only the
              booking amount is refunded according to the cancellation window.
            </p>
          </Section>

          <Section title="10. Policy Changes">
            <p>
              We may update this Refund Policy from time to time. Changes will be effective
              immediately upon posting. Bookings made before policy changes remain subject to the
              policy in effect at the time of booking.
            </p>
          </Section>

          <Section title="11. Contact Information">
            <p>For questions about refunds or cancellations, reach out to us:</p>
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
                <strong>Support Hours:</strong> Monday-Sunday, 10:00 AM - 10:00 PM IST
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
            <p className="text-xs sm:text-sm m-0 mb-2" style={{ color: colors.textSecondary }}>
              <strong>Pro Tip:</strong> To avoid cancellation fees, we recommend:
            </p>
            <ul className="pl-4 sm:pl-5 mt-2 space-y-1 text-xs sm:text-sm" style={{ color: colors.textSecondary }}>
              <li>Book only when you're certain about your plans</li>
              <li>Cancel as early as possible if plans change</li>
              <li>Use the free rescheduling option if you need flexibility</li>
              <li>Set reminders for your gaming sessions</li>
            </ul>
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
