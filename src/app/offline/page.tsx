// src/app/offline/page.tsx
import Link from "next/link";
import { colors, fonts } from "@/lib/constants";

export const metadata = {
  title: "Offline - BookMyGame",
  description: "You are currently offline",
};

export default function OfflinePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `radial-gradient(circle at top, #1e1b4b 0%, #050509 45%)`,
        fontFamily: fonts.body,
        color: colors.textPrimary,
        padding: "20px",
      }}
    >
      <div
        className="text-center max-w-md mx-auto p-6 sm:p-8 rounded-2xl"
        style={{
          background: colors.darkCard,
          border: `1px solid ${colors.border}`,
        }}
      >
        {/* Offline Icon */}
        <div
          className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, rgba(255, 7, 58, 0.2) 0%, rgba(255, 7, 58, 0.1) 100%)`,
            border: `2px solid ${colors.red}`,
          }}
        >
          <span className="text-4xl sm:text-5xl">📡</span>
        </div>

        {/* Title */}
        <h1
          className="text-2xl sm:text-3xl font-extrabold mb-3 sm:mb-4"
          style={{
            fontFamily: fonts.heading,
            background: `linear-gradient(135deg, ${colors.red} 0%, ${colors.cyan} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          You're Offline
        </h1>

        {/* Description */}
        <p
          className="text-sm sm:text-base mb-6 leading-relaxed"
          style={{ color: colors.textSecondary }}
        >
          Looks like you've lost your internet connection.
          Some features may not be available until you're back online.
        </p>

        {/* Features Available Offline */}
        <div
          className="text-left mb-6 p-4 rounded-lg"
          style={{
            background: colors.darkerCard,
            border: `1px solid ${colors.border}`,
          }}
        >
          <p
            className="text-xs sm:text-sm font-semibold mb-3 uppercase tracking-wide"
            style={{ color: colors.cyan }}
          >
            ✓ Available Offline
          </p>
          <ul className="text-xs sm:text-sm space-y-2" style={{ color: colors.textMuted }}>
            <li>• View cached cafés</li>
            <li>• Check your bookings</li>
            <li>• Browse saved favorites</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 px-6 rounded-xl text-sm font-bold transition-all"
            style={{
              background: `linear-gradient(135deg, ${colors.red} 0%, #ff3366 100%)`,
              color: "white",
              fontFamily: fonts.heading,
            }}
          >
            🔄 Try Again
          </button>

          <Link
            href="/"
            className="w-full py-3 px-6 rounded-xl text-sm font-semibold transition-all text-center"
            style={{
              background: colors.darkCard,
              border: `1px solid ${colors.border}`,
              color: colors.textPrimary,
              textDecoration: "none",
            }}
          >
            ← Back to Home
          </Link>
        </div>

        {/* Tips */}
        <p
          className="text-xs mt-6 leading-relaxed"
          style={{ color: colors.textMuted }}
        >
          💡 Tip: Check your WiFi or mobile data connection and try refreshing the page.
        </p>
      </div>
    </div>
  );
}
