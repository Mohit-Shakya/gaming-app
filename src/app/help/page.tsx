"use client";

import { useState } from "react";
import Link from "next/link";

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      category: "Booking",
      questions: [
        {
          q: "How do I book a gaming session?",
          a: "Browse cafés on our homepage, select your preferred café, choose your console and time slot, then complete the payment to confirm your booking.",
        },
        {
          q: "Can I cancel or modify my booking?",
          a: "Yes, you can cancel bookings up to 2 hours before your session starts for a full refund. To modify, cancel and create a new booking.",
        },
        {
          q: "What payment methods do you accept?",
          a: "We accept UPI, credit/debit cards, net banking, and digital wallets through our secure payment gateway.",
        },
        {
          q: "Do I need to create an account to book?",
          a: "Yes, you'll need to create a free account to make bookings and track your gaming history.",
        },
      ],
    },
    {
      category: "Gaming Cafés",
      questions: [
        {
          q: "How do I find cafés near me?",
          a: "Use the search and filter options on the homepage. You can filter by location, console type, and pricing.",
        },
        {
          q: "What consoles are available?",
          a: "Our partner cafés offer PC gaming, PS4, PS5, Xbox Series X, Xbox One, Nintendo Switch, VR setups, and more.",
        },
        {
          q: "Are the cafés verified?",
          a: "Yes, all cafés on our platform are verified partners that meet our quality and service standards.",
        },
      ],
    },
    {
      category: "Pricing & Payments",
      questions: [
        {
          q: "How is pricing determined?",
          a: "Each café sets its own hourly rates based on console type and location. Prices are clearly displayed before booking.",
        },
        {
          q: "Are there any booking fees?",
          a: "No, we don't charge any additional booking fees. You only pay the café's hourly rate.",
        },
        {
          q: "Can I get a refund?",
          a: "Yes, cancellations made at least 2 hours before your session are eligible for a full refund within 5-7 business days.",
        },
      ],
    },
    {
      category: "Café Owners",
      questions: [
        {
          q: "How can I list my café?",
          a: "Visit our café owner portal and complete the registration process. Our team will verify your café and help you get started.",
        },
        {
          q: "What are the benefits of listing?",
          a: "Get more bookings, manage your café digitally, accept online payments, and reach thousands of gamers across India.",
        },
        {
          q: "Is there a commission or fee?",
          a: "We charge a small commission on each booking. Contact us for detailed pricing information.",
        },
      ],
    },
    {
      category: "Account & Profile",
      questions: [
        {
          q: "How do I update my profile?",
          a: "Log in to your account and go to Profile settings to update your personal information, phone number, and preferences.",
        },
        {
          q: "I forgot my password. What should I do?",
          a: "Click 'Forgot Password' on the login page and follow the instructions sent to your registered email.",
        },
        {
          q: "How do I view my booking history?",
          a: "Go to your Dashboard after logging in to see all your past and upcoming bookings.",
        },
      ],
    },
  ];

  const filteredFaqs = faqs.map((category) => ({
    ...category,
    questions: category.questions.filter(
      (item) =>
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((category) => category.questions.length > 0);

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff", paddingTop: "80px" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 20px" }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            color: "#888",
            textDecoration: "none",
            marginBottom: "32px",
            fontSize: "14px",
          }}
        >
          ← Back to Home
        </Link>

        <h1 style={{ fontSize: "48px", fontWeight: 700, marginBottom: "16px" }}>
          Help Center
        </h1>
        <p style={{ fontSize: "18px", color: "#888", marginBottom: "48px" }}>
          Find answers to common questions about BookMyGame
        </p>

        {/* Search Bar */}
        <div style={{ marginBottom: "48px" }}>
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "16px 20px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              color: "#fff",
              fontSize: "16px",
            }}
          />
        </div>

        {/* Quick Links */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "16px",
            marginBottom: "48px",
          }}
        >
          <Link
            href="/contact"
            style={{
              padding: "24px",
              background: "rgba(255, 7, 58, 0.1)",
              border: "1px solid rgba(255, 7, 58, 0.3)",
              borderRadius: "12px",
              textDecoration: "none",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div style={{ fontSize: "32px" }}>📧</div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>Contact Support</div>
              <div style={{ fontSize: "14px", color: "#888" }}>Get help from our team</div>
            </div>
          </Link>
          <Link
            href="/owner/login"
            style={{
              padding: "24px",
              background: "rgba(59, 130, 246, 0.1)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              borderRadius: "12px",
              textDecoration: "none",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div style={{ fontSize: "32px" }}>🏪</div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>Café Owner Portal</div>
              <div style={{ fontSize: "14px", color: "#888" }}>Manage your café</div>
            </div>
          </Link>
        </div>

        {/* FAQs */}
        <h2 style={{ fontSize: "32px", fontWeight: 600, marginBottom: "32px" }}>
          Frequently Asked Questions
        </h2>

        {filteredFaqs.length === 0 && (
          <div
            style={{
              padding: "48px",
              textAlign: "center",
              background: "rgba(255, 255, 255, 0.03)",
              borderRadius: "12px",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
            <p style={{ color: "#888" }}>No results found for "{searchQuery}"</p>
          </div>
        )}

        {filteredFaqs.map((category, categoryIndex) => (
          <div key={categoryIndex} style={{ marginBottom: "48px" }}>
            <h3 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "24px", color: "#ff073a" }}>
              {category.category}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {category.questions.map((item, index) => {
                const globalIndex = categoryIndex * 100 + index;
                const isExpanded = expandedFaq === globalIndex;

                return (
                  <div
                    key={index}
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "12px",
                      overflow: "hidden",
                    }}
                  >
                    <button
                      onClick={() => setExpandedFaq(isExpanded ? null : globalIndex)}
                      style={{
                        width: "100%",
                        padding: "20px 24px",
                        background: "transparent",
                        border: "none",
                        color: "#fff",
                        fontSize: "16px",
                        fontWeight: 600,
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      {item.q}
                      <span style={{ fontSize: "20px" }}>{isExpanded ? "−" : "+"}</span>
                    </button>
                    {isExpanded && (
                      <div
                        style={{
                          padding: "0 24px 20px 24px",
                          color: "#888",
                          fontSize: "15px",
                          lineHeight: 1.6,
                        }}
                      >
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Still Need Help */}
        <div
          style={{
            marginTop: "64px",
            padding: "32px",
            background: "rgba(255, 255, 255, 0.03)",
            borderRadius: "12px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            textAlign: "center",
          }}
        >
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "12px" }}>
            Still need help?
          </h2>
          <p style={{ color: "#888", marginBottom: "24px" }}>
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <Link
            href="/contact"
            style={{
              display: "inline-block",
              background: "#ff073a",
              color: "#fff",
              padding: "12px 32px",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
