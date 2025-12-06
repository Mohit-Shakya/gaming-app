// src/components/Footer.tsx
"use client";

import Link from "next/link";
import { colors, fonts } from "@/lib/constants";

// Social media links - update with your actual links
const socialLinks = [
  { 
    name: "Instagram", 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
    url: "https://instagram.com/bookmygame",
    color: "#E4405F"
  },
  { 
    name: "Twitter", 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    url: "https://twitter.com/bookmygame",
    color: "#ffffff"
  },
  { 
    name: "YouTube", 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
    url: "https://youtube.com/@bookmygame",
    color: "#FF0000"
  },
  { 
    name: "Discord", 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
      </svg>
    ),
    url: "https://discord.gg/bookmygame",
    color: "#5865F2"
  },
];

// Footer links configuration
const footerLinks = {
  explore: [
    { label: "Find Cafés", href: "/" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Popular Games", href: "/#games" },
    { label: "Offers", href: "/#offers" },
  ],
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
  const currentYear = new Date().getFullYear();

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
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "48px 20px 24px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Top Section - Logo & Newsletter */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "40px",
            marginBottom: "40px",
            paddingBottom: "40px",
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          {/* Brand Section */}
          <div>
            <Link href="/" style={{ textDecoration: "none" }}>
              <h2
                style={{
                  fontFamily: fonts.heading,
                  fontSize: "24px",
                  fontWeight: 800,
                  letterSpacing: "1px",
                  marginBottom: "12px",
                  background: `linear-gradient(135deg, ${colors.red} 0%, ${colors.cyan} 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  display: "inline-block",
                }}
              >
                BOOKMYGAME
              </h2>
            </Link>
            <p
              style={{
                fontSize: "14px",
                color: colors.textMuted,
                lineHeight: 1.6,
                marginBottom: "20px",
                maxWidth: "300px",
              }}
            >
              India's premier gaming café booking platform. Find, book, and play at the best gaming cafés near you.
            </p>

            {/* App Download Badges - Placeholder */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div
                style={{
                  padding: "8px 16px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${colors.border}`,
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <span style={{ fontSize: "20px" }}>🍎</span>
                <div>
                  <p style={{ fontSize: "9px", color: colors.textMuted, margin: 0 }}>Coming soon on</p>
                  <p style={{ fontSize: "12px", color: colors.textPrimary, margin: 0, fontWeight: 600 }}>App Store</p>
                </div>
              </div>
              <div
                style={{
                  padding: "8px 16px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${colors.border}`,
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <span style={{ fontSize: "20px" }}>🤖</span>
                <div>
                  <p style={{ fontSize: "9px", color: colors.textMuted, margin: 0 }}>Coming soon on</p>
                  <p style={{ fontSize: "12px", color: colors.textPrimary, margin: 0, fontWeight: 600 }}>Play Store</p>
                </div>
              </div>
            </div>
          </div>

          {/* Links Sections */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: "24px",
            }}
          >
            {/* Explore */}
            <div>
              <h3
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: colors.textPrimary,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "16px",
                }}
              >
                Explore
              </h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {footerLinks.explore.map((link) => (
                  <li key={link.href} style={{ marginBottom: "10px" }}>
                    <Link
                      href={link.href}
                      style={{
                        fontSize: "14px",
                        color: colors.textMuted,
                        textDecoration: "none",
                        transition: "color 0.2s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = colors.cyan)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = colors.textMuted)}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account */}
            <div>
              <h3
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: colors.textPrimary,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "16px",
                }}
              >
                Account
              </h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {footerLinks.account.map((link) => (
                  <li key={link.href} style={{ marginBottom: "10px" }}>
                    <Link
                      href={link.href}
                      style={{
                        fontSize: "14px",
                        color: colors.textMuted,
                        textDecoration: "none",
                        transition: "color 0.2s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = colors.cyan)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = colors.textMuted)}
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
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: colors.textPrimary,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "16px",
                }}
              >
                Support
              </h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {footerLinks.support.map((link) => (
                  <li key={link.href} style={{ marginBottom: "10px" }}>
                    <Link
                      href={link.href}
                      style={{
                        fontSize: "14px",
                        color: colors.textMuted,
                        textDecoration: "none",
                        transition: "color 0.2s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = colors.cyan)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = colors.textMuted)}
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
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "24px",
            marginBottom: "32px",
            paddingBottom: "32px",
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          {/* Contact Info */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
            <a
              href="mailto:bookmygame169@gmail.com"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                color: colors.textSecondary,
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = colors.cyan)}
              onMouseLeave={(e) => (e.currentTarget.style.color = colors.textSecondary)}
            >
              <span style={{ fontSize: "16px" }}>📧</span>
              bookmygame169@gmail.com
            </a>
            <a
              href="tel:+919910457855"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                color: colors.textSecondary,
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = colors.cyan)}
              onMouseLeave={(e) => (e.currentTarget.style.color = colors.textSecondary)}
            >
              <span style={{ fontSize: "16px" }}>📞</span>
              +91 99104 57855
            </a>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                color: colors.textSecondary,
              }}
            >
              <span style={{ fontSize: "16px" }}>📍</span>
              Delhi, India
            </span>
          </div>

          {/* Social Links */}
          <div style={{ display: "flex", gap: "12px" }}>
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.name}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${colors.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: colors.textMuted,
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${social.color}20`;
                  e.currentTarget.style.borderColor = social.color;
                  e.currentTarget.style.color = social.color;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                  e.currentTarget.style.borderColor = colors.border;
                  e.currentTarget.style.color = colors.textMuted;
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
          }}
        >
          {/* Copyright */}
          <p
            style={{
              fontSize: "13px",
              color: colors.textMuted,
              margin: 0,
            }}
          >
            © {currentYear} BOOKMYGAME. All rights reserved.
          </p>

          {/* Made with love */}
          <p
            style={{
              fontSize: "13px",
              color: colors.textMuted,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "6px",
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
            for Gamers in India 🇮🇳
          </p>

          {/* Payment Methods */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "12px", color: colors.textMuted }}>We accept:</span>
            <div
              style={{
                display: "flex",
                gap: "6px",
                padding: "4px 8px",
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: "6px",
              }}
            >
              <span style={{ fontSize: "16px" }} title="UPI">💳</span>
              <span style={{ fontSize: "16px" }} title="Cards">💰</span>
              <span style={{ fontSize: "16px" }} title="Wallet">📱</span>
            </div>
          </div>
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