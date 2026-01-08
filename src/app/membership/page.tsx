// src/app/membership/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Star,
  Zap,
  Users,
  TrendingUp,
  Gift,
  Crown,
  Shield,
  Sparkles,
  Loader2,
} from "lucide-react";
import { colors, fonts } from "@/lib/constants";

type MembershipTier = {
  id: string;
  name: string;
  icon: string;
  color: string;
  monthly_price: number;
  yearly_price: number;
  description: string;
  badge: string;
  features: string[];
  discount_percentage: number;
};

const benefits = [
  {
    icon: Zap,
    title: "Instant Bookings",
    description: "Book your gaming session instantly with priority access",
  },
  {
    icon: Gift,
    title: "Exclusive Rewards",
    description: "Get special rewards, gifts, and member-only offers",
  },
  {
    icon: TrendingUp,
    title: "Level Up",
    description: "Track your gaming progress and climb the leaderboards",
  },
  {
    icon: Users,
    title: "Community",
    description: "Connect with gamers and join exclusive events",
  },
  {
    icon: Sparkles,
    title: "Premium Support",
    description: "Get dedicated support and personalized assistance",
  },
  {
    icon: Shield,
    title: "Protected Gear",
    description: "Insurance coverage for your gaming equipment",
  },
];

export default function MembershipPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [membershipTiers, setMembershipTiers] = useState<MembershipTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch membership tiers from API
  useEffect(() => {
    async function fetchTiers() {
      try {
        const response = await fetch("/api/memberships");
        if (!response.ok) {
          throw new Error("Failed to fetch membership tiers");
        }
        const data = await response.json();
        setMembershipTiers(data.tiers || []);
      } catch (err) {
        console.error("Error fetching tiers:", err);
        setError("Failed to load membership tiers");
      } finally {
        setLoading(false);
      }
    }
    fetchTiers();
  }, []);

  const handleSelectTier = async (tier: MembershipTier) => {
    // For now, show alert - in production, integrate with payment gateway
    alert(
      `Membership enrollment coming soon!\n\nSelected: ${tier.name}\nBilling: ${billingCycle}\nPrice: ₹${billingCycle === "monthly" ? tier.monthly_price : tier.yearly_price}`
    );
  };

  return (
    <>
      <style jsx global>{`
        .membership-page {
          min-height: 100vh;
          background: linear-gradient(180deg, ${colors.dark} 0%, #0a0a10 100%);
          font-family: ${fonts.body};
          color: ${colors.textPrimary};
        }

        .membership-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px 16px;
        }

        .page-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 40px;
          padding-top: 16px;
        }

        .back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid ${colors.border};
          color: ${colors.textSecondary};
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .back-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateX(-2px);
        }

        .header-content {
          flex: 1;
        }

        .header-title {
          font-family: ${fonts.heading};
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 8px 0;
          background: linear-gradient(135deg, ${colors.red} 0%, ${colors.cyan} 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .header-subtitle {
          color: ${colors.textSecondary};
          font-size: 14px;
          margin: 0;
        }

        /* Benefits Section */
        .benefits-section {
          margin-bottom: 60px;
        }

        .section-title {
          font-family: ${fonts.heading};
          font-size: 24px;
          font-weight: 700;
          text-align: center;
          margin-bottom: 32px;
          color: ${colors.textPrimary};
        }

        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .benefit-card {
          background: linear-gradient(135deg, rgba(255, 7, 58, 0.08) 0%, ${colors.darkCard} 100%);
          border: 1px solid ${colors.border};
          border-radius: 16px;
          padding: 24px;
          transition: all 0.3s ease;
          text-align: center;
        }

        .benefit-card:hover {
          transform: translateY(-4px);
          border-color: ${colors.red};
        }

        .benefit-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, ${colors.red} 0%, ${colors.cyan} 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          margin: 0 auto 16px;
        }

        .benefit-title {
          font-family: ${fonts.heading};
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 8px 0;
          color: ${colors.textPrimary};
        }

        .benefit-description {
          font-size: 13px;
          color: ${colors.textSecondary};
          margin: 0;
          line-height: 1.5;
        }

        /* Pricing Section */
        .pricing-section {
          margin-bottom: 60px;
        }

        .pricing-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .pricing-title {
          font-family: ${fonts.heading};
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 16px 0;
        }

        .cycle-toggle {
          display: inline-flex;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid ${colors.border};
          border-radius: 12px;
          padding: 4px;
          gap: 4px;
        }

        .cycle-btn {
          padding: 8px 16px;
          border: none;
          background: transparent;
          color: ${colors.textSecondary};
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .cycle-btn.active {
          background: linear-gradient(135deg, ${colors.red} 0%, ${colors.cyan} 100%);
          color: white;
        }

        .tiers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          margin-bottom: 60px;
        }

        .tier-card {
          background: linear-gradient(135deg, rgba(255, 7, 58, 0.08) 0%, ${colors.darkCard} 100%);
          border: 1px solid ${colors.border};
          border-radius: 16px;
          padding: 28px;
          position: relative;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          cursor: pointer;
          overflow: hidden;
        }

        .tier-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--tier-color);
        }

        .tier-card:hover {
          transform: translateY(-8px);
          border-color: var(--tier-color);
          box-shadow: 0 20px 60px rgba(255, 7, 58, 0.15);
        }

        .tier-card.featured {
          border: 2px solid var(--tier-color);
          box-shadow: 0 0 0 8px rgba(255, 7, 58, 0.1);
        }

        .tier-badge {
          position: absolute;
          top: -12px;
          right: 20px;
          background: linear-gradient(135deg, var(--tier-color) 0%, rgba(255, 7, 58, 0.5) 100%);
          color: white;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .tier-icon {
          font-size: 40px;
          margin-bottom: 16px;
        }

        .tier-name {
          font-family: ${fonts.heading};
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 8px 0;
          color: var(--tier-color);
        }

        .tier-description {
          font-size: 13px;
          color: ${colors.textSecondary};
          margin: 0 0 20px 0;
        }

        .tier-price {
          font-family: ${fonts.heading};
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 4px 0;
          color: ${colors.textPrimary};
        }

        .tier-period {
          font-size: 12px;
          color: ${colors.textSecondary};
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 1px solid ${colors.border};
        }

        .tier-features {
          list-style: none;
          margin: 0 0 24px 0;
          padding: 0;
          flex: 1;
        }

        .tier-feature {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
          font-size: 13px;
          color: ${colors.textPrimary};
        }

        .feature-check {
          color: ${colors.green};
          flex-shrink: 0;
          width: 16px;
          height: 16px;
        }

        .tier-cta {
          width: 100%;
          padding: 14px 20px;
          background: linear-gradient(135deg, var(--tier-color) 0%, rgba(255, 7, 58, 0.7) 100%);
          border: none;
          border-radius: 12px;
          color: white;
          font-family: ${fonts.heading};
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .tier-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(255, 7, 58, 0.3);
        }

        /* Testimonials */
        .testimonials-section {
          margin-bottom: 60px;
        }

        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .testimonial-card {
          background: linear-gradient(135deg, rgba(0, 240, 255, 0.08) 0%, ${colors.darkCard} 100%);
          border: 1px solid ${colors.border};
          border-radius: 16px;
          padding: 24px;
          position: relative;
        }

        .testimonial-stars {
          display: flex;
          gap: 4px;
          margin-bottom: 12px;
        }

        .testimonial-text {
          font-size: 13px;
          color: ${colors.textPrimary};
          margin: 0 0 16px 0;
          line-height: 1.6;
          font-style: italic;
        }

        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .testimonial-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, ${colors.red} 0%, ${colors.cyan} 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
        }

        .testimonial-info h4 {
          font-size: 13px;
          font-weight: 700;
          margin: 0;
          color: ${colors.textPrimary};
        }

        .testimonial-info p {
          font-size: 11px;
          color: ${colors.textSecondary};
          margin: 0;
        }

        /* CTA Section */
        .cta-section {
          background: linear-gradient(135deg, rgba(255, 7, 58, 0.2) 0%, rgba(0, 240, 255, 0.1) 100%);
          border: 1px solid ${colors.border};
          border-radius: 20px;
          padding: 40px;
          text-align: center;
          margin-bottom: 40px;
        }

        .cta-title {
          font-family: ${fonts.heading};
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 12px 0;
        }

        .cta-description {
          font-size: 14px;
          color: ${colors.textSecondary};
          margin: 0 0 24px 0;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 32px;
          background: linear-gradient(135deg, ${colors.red} 0%, ${colors.cyan} 100%);
          border: none;
          border-radius: 12px;
          color: white;
          font-family: ${fonts.heading};
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(255, 7, 58, 0.3);
        }

        @media (max-width: 768px) {
          .header-title {
            font-size: 24px;
          }

          .tiers-grid,
          .benefits-grid {
            grid-template-columns: 1fr;
          }

          .tier-card.featured {
            grid-column: 1;
          }

          .cta-section {
            padding: 24px;
          }
        }
      `}</style>

      <div className="membership-page">
        <div className="membership-container">
          {/* Header */}
          <header className="page-header">
            <button
              onClick={() => router.push("/")}
              className="back-btn"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="header-content">
              <h1 className="header-title">
                <Crown className="w-8 h-8 inline mr-2" />
                Membership Plans
              </h1>
              <p className="header-subtitle">Unlock premium gaming experiences</p>
            </div>
          </header>

          {/* Benefits Section */}
          <section className="benefits-section">
            <h2 className="section-title">Why Join?</h2>
            <div className="benefits-grid">
              {benefits.map((benefit, idx) => {
                const Icon = benefit.icon;
                return (
                  <div key={idx} className="benefit-card">
                    <div className="benefit-icon">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="benefit-title">{benefit.title}</h3>
                    <p className="benefit-description">{benefit.description}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Pricing Section */}
          <section className="pricing-section">
            <div className="pricing-header">
              <h2 className="pricing-title">Choose Your Plan</h2>
              <div className="cycle-toggle">
                <button
                  className={`cycle-btn ${billingCycle === "monthly" ? "active" : ""}`}
                  onClick={() => setBillingCycle("monthly")}
                >
                  Monthly
                </button>
                <button
                  className={`cycle-btn ${billingCycle === "yearly" ? "active" : ""}`}
                  onClick={() => setBillingCycle("yearly")}
                >
                  Yearly (Save 20%)
                </button>
              </div>
            </div>

            {/* Tier Cards */}
            {loading ? (
              <div className="tiers-grid">
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px" }}>
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: colors.cyan }} />
                  <p style={{ marginTop: "16px", color: colors.textSecondary }}>Loading membership tiers...</p>
                </div>
              </div>
            ) : error ? (
              <div className="tiers-grid">
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px" }}>
                  <p style={{ color: colors.red }}>{error}</p>
                </div>
              </div>
            ) : (
              <div className="tiers-grid">
                {membershipTiers.map((tier, idx) => (
                  <div
                    key={tier.id}
                    className={`tier-card ${idx === 2 ? "featured" : ""}`}
                    style={{ "--tier-color": tier.color } as React.CSSProperties}
                  >
                    {tier.badge && <div className="tier-badge">{tier.badge}</div>}

                    <div className="tier-icon">{tier.icon}</div>

                    <h3 className="tier-name">{tier.name}</h3>
                    <p className="tier-description">{tier.description}</p>

                    <div className="tier-price">
                      ₹{billingCycle === "monthly" ? tier.monthly_price : tier.yearly_price}
                      <span className="tier-period">/{billingCycle === "monthly" ? "month" : "year"}</span>
                    </div>

                    <ul className="tier-features">
                      {tier.features.map((feature, fidx) => (
                        <li key={fidx} className="tier-feature">
                          <Check className="feature-check" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <button
                      className="tier-cta"
                      onClick={() => handleSelectTier(tier)}
                    >
                      <Sparkles className="w-4 h-4" />
                      Get {tier.name}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Testimonials */}
          <section className="testimonials-section">
            <h2 className="section-title">What Members Say</h2>
            <div className="testimonials-grid">
              {[
                {
                  name: "Arjun Kumar",
                  role: "Gaming Enthusiast",
                  avatar: "A",
                  text: "Best decision ever! The exclusive tournaments and discount are amazing. Worth every penny!",
                  rating: 5,
                },
                {
                  name: "Priya Singh",
                  role: "Pro Gamer",
                  avatar: "P",
                  text: "The Gold tier gives me everything I need. Priority booking + private room access is insane!",
                  rating: 5,
                },
                {
                  name: "Rahul Desai",
                  role: "Casual Gamer",
                  avatar: "R",
                  text: "Bronze membership is perfect for casual players. Great value and friendly community!",
                  rating: 4,
                },
              ].map((testimonial, idx) => (
                <div key={idx} className="testimonial-card">
                  <div className="testimonial-stars">
                    {Array(testimonial.rating)
                      .fill(0)
                      .map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4"
                          style={{ fill: "#ffc107", color: "#ffc107" }}
                        />
                      ))}
                  </div>
                  <p className="testimonial-text">&quot;{testimonial.text}&quot;</p>
                  <div className="testimonial-author">
                    <div className="testimonial-avatar">{testimonial.avatar}</div>
                    <div className="testimonial-info">
                      <h4>{testimonial.name}</h4>
                      <p>{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="cta-section">
            <h2 className="cta-title">Ready to Level Up?</h2>
            <p className="cta-description">
              Join thousands of gamers enjoying premium benefits, exclusive events, and amazing discounts!
            </p>
            <button
              className="cta-btn"
              onClick={() => {
                alert("Membership enrollment coming soon!");
              }}
            >
              <Crown className="w-4 h-4" />
              Start Free Trial
            </button>
          </section>
        </div>
      </div>
    </>
  );
}
