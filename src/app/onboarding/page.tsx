// src/app/onboarding/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import useUser from "@/hooks/useUser";
import { colors, fonts } from "@/lib/constants";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");

  // UI states
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      router.replace("/login");
    }
  }, [userLoading, user, router]);

  // Check if profile is already complete
  useEffect(() => {
    async function checkProfile() {
      if (!user) return;

      try {
        setCheckingProfile(true);

        const { data, error } = await supabase
          .from("profiles")
          .select("first_name, last_name, phone, date_of_birth, onboarding_complete")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error checking profile:", error);
          setCheckingProfile(false);
          return;
        }

        // If profile is complete, redirect to home or intended destination
        if (data?.onboarding_complete) {
          const redirectTo = sessionStorage.getItem("redirectAfterOnboarding") || "/";
          sessionStorage.removeItem("redirectAfterOnboarding");
          router.replace(redirectTo);
          return;
        }

        // Pre-fill with existing data if any
        if (data) {
          setFirstName(data.first_name || "");
          setLastName(data.last_name || "");
          setPhone(data.phone || "");
          setDob(data.date_of_birth || "");
        }

        // Pre-fill from Google auth metadata if available
        if (user.user_metadata?.full_name && !data?.first_name) {
          const nameParts = user.user_metadata.full_name.split(" ");
          setFirstName(nameParts[0] || "");
          setLastName(nameParts.slice(1).join(" ") || "");
        }

      } catch (err) {
        console.error("Error:", err);
      } finally {
        setCheckingProfile(false);
      }
    }

    if (user) checkProfile();
  }, [user, router]);

  // Form validation
  function validateForm() {
    if (!firstName.trim()) {
      setError("Please enter your first name");
      return false;
    }
    if (!lastName.trim()) {
      setError("Please enter your last name");
      return false;
    }
    if (!phone.trim()) {
      setError("Please enter your phone number");
      return false;
    }
    if (phone.trim().length < 10) {
      setError("Please enter a valid phone number");
      return false;
    }
    if (!dob) {
      setError("Please enter your date of birth");
      return false;
    }
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setError(null);

    if (!validateForm()) return;

    setSaving(true);

    try {
      const { error: upsertError } = await supabase.from("profiles").upsert({
        id: user.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        date_of_birth: dob,
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
      });

      if (upsertError) {
        console.error("Error saving profile:", upsertError);
        setError("Could not save your details. Please try again.");
        return;
      }

      // Redirect to intended destination or home
      const redirectTo = sessionStorage.getItem("redirectAfterOnboarding") || "/";
      sessionStorage.removeItem("redirectAfterOnboarding");
      router.replace(redirectTo);

    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // Loading state
  if (userLoading || checkingProfile) {
    return (
      <main style={{
        minHeight: "100vh",
        background: `linear-gradient(180deg, ${colors.dark} 0%, #0a0a10 100%)`,
        fontFamily: fonts.body,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "48px",
            height: "48px",
            border: `3px solid ${colors.border}`,
            borderTopColor: colors.cyan,
            borderRadius: "50%",
            margin: "0 auto 16px",
            animation: "spin 1s linear infinite",
          }} />
          <p style={{ color: colors.textSecondary, fontSize: "14px" }}>
            Setting up your account...
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main style={{
      minHeight: "100vh",
      background: `linear-gradient(180deg, ${colors.dark} 0%, #0a0a10 100%)`,
      fontFamily: fonts.body,
      color: colors.textPrimary,
      position: "relative",
    }}>
      {/* Background glow */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(ellipse at 50% 0%, rgba(255, 7, 58, 0.1) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 100%, rgba(0, 240, 255, 0.08) 0%, transparent 50%)
        `,
        pointerEvents: "none",
        zIndex: 0,
      }} />

      <div style={{
        maxWidth: "480px",
        margin: "0 auto",
        padding: "40px 20px",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Header */}
        <header style={{ textAlign: "center", marginBottom: "32px" }}>
          {/* Logo */}
          <div style={{
            width: "80px",
            height: "80px",
            margin: "0 auto 20px",
            background: `linear-gradient(135deg, ${colors.red}20 0%, ${colors.cyan}20 100%)`,
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "40px",
          }}>
            🎮
          </div>

          <h1 style={{
            fontFamily: fonts.heading,
            fontSize: "24px",
            fontWeight: 700,
            color: colors.textPrimary,
            marginBottom: "8px",
          }}>
            Welcome to BOOKMYGAME
          </h1>

          <p style={{
            fontSize: "15px",
            color: colors.textSecondary,
            lineHeight: 1.5,
          }}>
            Let's set up your profile to get started with booking gaming sessions!
          </p>
        </header>

        {/* Progress indicator */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          marginBottom: "32px",
        }}>
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: colors.green,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            fontWeight: 600,
            color: "white",
          }}>
            ✓
          </div>
          <div style={{
            width: "60px",
            height: "2px",
            background: colors.green,
          }} />
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${colors.red} 0%, #ff3366 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            fontWeight: 600,
            color: "white",
          }}>
            2
          </div>
          <div style={{
            width: "60px",
            height: "2px",
            background: colors.border,
          }} />
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: colors.border,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            fontWeight: 600,
            color: colors.textMuted,
          }}>
            3
          </div>
        </div>

        {/* Form Card */}
        <section style={{
          background: colors.darkCard,
          border: `1px solid ${colors.border}`,
          borderRadius: "24px",
          padding: "28px 24px",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Top accent */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: `linear-gradient(90deg, ${colors.red}, ${colors.cyan})`,
          }} />

          <h2 style={{
            fontSize: "16px",
            fontWeight: 600,
            color: colors.textPrimary,
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}>
            <span>👤</span> Complete Your Profile
          </h2>

          {/* Error message */}
          {error && (
            <div style={{
              padding: "12px 16px",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "10px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}>
              <span style={{ fontSize: "16px" }}>⚠️</span>
              <p style={{ fontSize: "13px", color: "#ef4444", margin: 0 }}>
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Name fields */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "14px",
              marginBottom: "16px",
            }}>
              <div>
                <label style={{
                  display: "block",
                  fontSize: "12px",
                  color: colors.textMuted,
                  marginBottom: "8px",
                  fontWeight: 500,
                }}>
                  First Name <span style={{ color: colors.red }}>*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: `1px solid ${colors.border}`,
                    borderRadius: "12px",
                    color: colors.textPrimary,
                    fontSize: "15px",
                    fontFamily: fonts.body,
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s ease",
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: "block",
                  fontSize: "12px",
                  color: colors.textMuted,
                  marginBottom: "8px",
                  fontWeight: 500,
                }}>
                  Last Name <span style={{ color: colors.red }}>*</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: `1px solid ${colors.border}`,
                    borderRadius: "12px",
                    color: colors.textPrimary,
                    fontSize: "15px",
                    fontFamily: fonts.body,
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s ease",
                  }}
                />
              </div>
            </div>

            {/* Phone */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{
                display: "block",
                fontSize: "12px",
                color: colors.textMuted,
                marginBottom: "8px",
                fontWeight: 500,
              }}>
                Phone Number <span style={{ color: colors.red }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute",
                  left: "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: colors.textMuted,
                  fontSize: "15px",
                }}>
                  +91
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="98765 43210"
                  style={{
                    width: "100%",
                    padding: "14px 16px 14px 52px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: `1px solid ${colors.border}`,
                    borderRadius: "12px",
                    color: colors.textPrimary,
                    fontSize: "15px",
                    fontFamily: fonts.body,
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s ease",
                  }}
                />
              </div>
            </div>

            {/* DOB */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{
                display: "block",
                fontSize: "12px",
                color: colors.textMuted,
                marginBottom: "8px",
                fontWeight: 500,
              }}>
                Date of Birth <span style={{ color: colors.red }}>*</span>
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${colors.border}`,
                  borderRadius: "12px",
                  color: colors.textPrimary,
                  fontSize: "15px",
                  fontFamily: fonts.body,
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s ease",
                }}
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={saving}
              style={{
                width: "100%",
                padding: "16px 24px",
                background: saving
                  ? "rgba(255, 255, 255, 0.1)"
                  : `linear-gradient(135deg, ${colors.red} 0%, #ff3366 100%)`,
                border: "none",
                borderRadius: "14px",
                color: "white",
                fontFamily: fonts.heading,
                fontSize: "14px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "1px",
                cursor: saving ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                boxShadow: saving ? "none" : `0 8px 32px ${colors.red}40`,
                transition: "all 0.2s ease",
              }}
            >
              {saving ? (
                <>
                  <span style={{
                    width: "18px",
                    height: "18px",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "white",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }} />
                  Saving...
                </>
              ) : (
                <>
                  🎮 Start Gaming
                </>
              )}
            </button>
          </form>
        </section>

        {/* Info note */}
        <p style={{
          textAlign: "center",
          fontSize: "12px",
          color: colors.textMuted,
          marginTop: "20px",
          lineHeight: 1.5,
        }}>
          Your details help us provide a better booking experience.<br />
          You can update them anytime from your profile.
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        input::placeholder {
          color: ${colors.textMuted};
        }
        input:focus {
          border-color: ${colors.cyan} !important;
        }
      `}</style>
    </main>
  );
}