// src/components/Footer.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { colors, fonts } from "@/lib/constants";

// Social media links - update with your actual links
const socialLinks = [
  {
    name: "Instagram",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
    url: "https://instagram.com/bookmygame",
    color: "#E4405F"
  },
];

// Footer links configuration
const footerLinks = {
  account: [
    { label: "My Bookings", href: "/dashboard" },
    { label: "Profile", href: "/profile" },
    { label: "Favorites", href: "/favorites" },
  ],
  support: [
    { label: "Help Center", href: "/help" },
    { label: "Contact Us", href: "/contact" },
    { label: "FAQs", href: "/faqs" },
  ],
  legal: [
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Refund Policy", href: "/refund" },
  ],
};

export default function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  // Only show footer on homepage
  if (pathname !== '/') {
    return null;
  }

  return (
    <footer
      style={{
        background: colors.dark,
        borderTop: `1px solid ${colors.border}`,
        fontFamily: fonts.body,
        color: colors.textSecondary,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow effects */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(ellipse at 0% 0%, rgba(255, 7, 58, 0.05) 0%, transparent 50%),
            radial-gradient(ellipse at 100% 100%, rgba(0, 240, 255, 0.05) 0%, transparent 50%)
          `,
          pointerEvents: "none",
        }}
      />

      {/* Main Footer Content */}
      <div
        className="px-3 py-5 sm:px-6 sm:py-10 md:px-8 md:py-12 lg:px-10 relative z-10"
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* Top Section - Logo & Newsletter */}
        <div
          className="grid gap-4 sm:gap-8 md:gap-10 mb-4 sm:mb-8 md:mb-10 pb-4 sm:pb-8 md:pb-10"
          style={{
            gridTemplateColumns: "1fr",
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          {/* Brand Section */}
          <div>
            <Link href="/" style={{ textDecoration: "none" }}>
              <h2
                className="text-lg sm:text-2xl font-extrabold tracking-wide mb-1.5 sm:mb-3 inline-block"
                style={{
                  fontFamily: fonts.heading,
                  background: `linear-gradient(135deg, ${colors.red} 0%, ${colors.cyan} 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                BOOKMYGAME
              </h2>
            </Link>
            <p
              className="text-[10px] sm:text-sm leading-relaxed mb-3 sm:mb-5 max-w-xs"
              style={{
                color: colors.textMuted,
              }}
            >
              India's premier gaming café booking platform.
            </p>
          </div>

          {/* Links Sections */}
          <div
            className="grid grid-cols-3 gap-4 sm:gap-5"
          >

            {/* Account */}
            <div>
              <h3
                className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-2 sm:mb-4"
                style={{
                  color: colors.textPrimary,
                }}
              >
                Account
              </h3>
              <ul className="list-none p-0 m-0 space-y-1.5 sm:space-y-2.5">
                {footerLinks.account.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[10px] sm:text-sm transition-colors hover:text-[#00f0ff]"
                      style={{
                        color: colors.textMuted,
                        textDecoration: "none",
                      }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3
                className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-2 sm:mb-4"
                style={{
                  color: colors.textPrimary,
                }}
              >
                Support
              </h3>
              <ul className="list-none p-0 m-0 space-y-1.5 sm:space-y-2.5">
                {footerLinks.support.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[10px] sm:text-sm transition-colors hover:text-[#00f0ff]"
                      style={{
                        color: colors.textMuted,
                        textDecoration: "none",
                      }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3
                className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-2 sm:mb-4"
                style={{
                  color: colors.textPrimary,
                }}
              >
                Legal
              </h3>
              <ul className="list-none p-0 m-0 space-y-1.5 sm:space-y-2.5">
                {footerLinks.legal.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[10px] sm:text-sm transition-colors hover:text-[#00f0ff]"
                      style={{
                        color: colors.textMuted,
                        textDecoration: "none",
                      }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Contact & Social Section */}
        <div
          className="flex flex-col sm:flex-row flex-wrap justify-between items-start sm:items-center gap-3 sm:gap-6 mb-4 sm:mb-8 pb-4 sm:pb-8"
          style={{
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          {/* Contact Info */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-5 md:gap-6 w-full sm:w-auto">
            <a
              href="mailto:bookmygame169@gmail.com"
              className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-sm transition-colors hover:text-[#00f0ff]"
              style={{
                color: colors.textSecondary,
                textDecoration: "none",
              }}
            >
              <span className="text-xs sm:text-base">📧</span>
              <span className="truncate">bookmygame169@gmail.com</span>
            </a>
            <a
              href="tel:+919910457855"
              className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-sm transition-colors hover:text-[#00f0ff]"
              style={{
                color: colors.textSecondary,
                textDecoration: "none",
              }}
            >
              <span className="text-xs sm:text-base">📞</span>
              +91 99104 57855
            </a>
            <span
              className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-sm"
              style={{
                color: colors.textSecondary,
              }}
            >
              <span className="text-xs sm:text-base">📍</span>
              Delhi, India
            </span>
          </div>

          {/* Social Links */}
          <div className="flex gap-2 sm:gap-3">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.name}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-all hover:-translate-y-0.5"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${colors.border}`,
                  color: colors.textMuted,
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${social.color}20`;
                  e.currentTarget.style.borderColor = social.color;
                  e.currentTarget.style.color = social.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                  e.currentTarget.style.borderColor = colors.border;
                  e.currentTarget.style.color = colors.textMuted;
                }}
              >
                <div className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full">
                  {social.icon}
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className="flex flex-col sm:flex-row flex-wrap justify-between items-start sm:items-center gap-2 sm:gap-4"
        >
          {/* Copyright */}
          <p
            className="text-[10px] sm:text-xs m-0"
            style={{
              color: colors.textMuted,
            }}
          >
            © {currentYear} BOOKMYGAME. All rights reserved.
          </p>

          {/* Made with love */}
          <p
            className="text-[10px] sm:text-xs m-0 flex items-center gap-1"
            style={{
              color: colors.textMuted,
            }}
          >
            Made with{" "}
            <span
              style={{
                color: colors.red,
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            >
              ❤️
            </span>{" "}
            for Gamers 🇮🇳
          </p>
        </div>
      </div>

      {/* Decorative top border gradient */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: `linear-gradient(90deg, transparent, ${colors.red}, ${colors.cyan}, transparent)`,
        }}
      />

      {/* Animation styles */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
      `}</style>
    </footer>
  );
}