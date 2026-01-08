"use client";

import { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement contact form submission to Supabase or email service
    console.log("Contact form submitted:", formData);
    setSubmitted(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff", paddingTop: "80px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>
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
          Contact Us
        </h1>
        <p style={{ fontSize: "18px", color: "#888", marginBottom: "48px" }}>
          Have a question or feedback? We&apos;d love to hear from you.
        </p>

        {submitted ? (
          <div
            style={{
              background: "rgba(34, 197, 94, 0.1)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              borderRadius: "12px",
              padding: "32px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
            <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "8px" }}>
              Message Sent!
            </h2>
            <p style={{ color: "#888", marginBottom: "24px" }}>
              Thank you for contacting us. We&apos;ll get back to you soon.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              style={{
                background: "#ff073a",
                color: "#fff",
                border: "none",
                padding: "12px 24px",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Send Another Message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "16px",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "16px",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "16px",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>
                  Subject *
                </label>
                <select
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "16px",
                  }}
                >
                  <option value="">Select a subject</option>
                  <option value="general">General Inquiry</option>
                  <option value="booking">Booking Issue</option>
                  <option value="cafe-owner">Café Owner Inquiry</option>
                  <option value="partnership">Partnership Opportunity</option>
                  <option value="feedback">Feedback</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>
                Message *
              </label>
              <textarea
                name="message"
                required
                rows={6}
                value={formData.message}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "16px",
                  resize: "vertical",
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                background: "#ff073a",
                color: "#fff",
                border: "none",
                padding: "16px 32px",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: 600,
                cursor: "pointer",
                width: "100%",
              }}
            >
              Send Message
            </button>
          </form>
        )}

        <div
          style={{
            marginTop: "64px",
            padding: "32px",
            background: "rgba(255, 255, 255, 0.03)",
            borderRadius: "12px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "24px" }}>
            Other Ways to Reach Us
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px" }}>
            <div>
              <div style={{ fontSize: "24px", marginBottom: "8px" }}>📧</div>
              <div style={{ fontSize: "14px", color: "#888", marginBottom: "4px" }}>Email</div>
              <div style={{ fontSize: "16px", fontWeight: 500 }}>support@bookmygame.co.in</div>
            </div>
            <div>
              <div style={{ fontSize: "24px", marginBottom: "8px" }}>📱</div>
              <div style={{ fontSize: "14px", color: "#888", marginBottom: "4px" }}>Phone</div>
              <div style={{ fontSize: "16px", fontWeight: 500 }}>+91 XXX XXX XXXX</div>
            </div>
            <div>
              <div style={{ fontSize: "24px", marginBottom: "8px" }}>⏰</div>
              <div style={{ fontSize: "14px", color: "#888", marginBottom: "4px" }}>Hours</div>
              <div style={{ fontSize: "16px", fontWeight: 500 }}>Mon-Sun, 9 AM - 9 PM</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
