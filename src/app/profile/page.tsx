// src/app/profile/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useUser from "@/hooks/useUser";
import { supabase } from "@/lib/supabaseClient";
import { colors, fonts } from "@/lib/constants";

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  date_of_birth: string | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useUser();

  // Editable fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");

  // UI states
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [bookingStats, setBookingStats] = useState({ total: 0, upcoming: 0 });

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  // Load profile from Supabase
  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      try {
        setProfileLoading(true);
        setSaveError(null);

        // Load profile
        const { data, error } = await supabase
          .from("profiles")
          .select("first_name, last_name, phone, date_of_birth")
          .eq("id", user.id)
          .maybeSingle<ProfileRow>();

        if (error) {
          console.error("Error loading profile:", error);
        }

        if (data) {
          setFirstName(data.first_name ?? "");
          setLastName(data.last_name ?? "");
          setPhone(data.phone ?? "");
          setDob(data.date_of_birth ?? "");
        }

        // Load booking stats
        const todayStr = new Date().toISOString().slice(0, 10);
        
        const { data: bookings, error: bookingError } = await supabase
          .from("bookings")
          .select("id, booking_date, status")
          .eq("user_id", user.id);

        if (!bookingError && bookings) {
          const total = bookings.length;
          const upcoming = bookings.filter(b => 
            (b.booking_date ?? "") >= todayStr && 
            (b.status || "").toLowerCase() !== "cancelled"
          ).length;
          setBookingStats({ total, upcoming });
        }
      } catch (err) {
        console.error("Unexpected error loading profile:", err);
      } finally {
        setProfileLoading(false);
      }
    }

    if (user) loadProfile();
  }, [user]);

  // Get display name
  const displayName = useMemo(() => {
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    return user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Gamer";
  }, [firstName, lastName, user]);

  // Get initials for avatar
  const initials = useMemo(() => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) return firstName.slice(0, 2).toUpperCase();
    if (user?.email) return user.email.slice(0, 2).toUpperCase();
    return "GG";
  }, [firstName, lastName, user]);

  // Get member since date
  const memberSince = useMemo(() => {
    if (!user?.created_at) return "Recently";
    const date = new Date(user.created_at);
    return date.toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
  }, [user]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setSaveMessage(null);
    setSaveError(null);

    try {
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        phone: phone.trim() || null,
        date_of_birth: dob || null,
      });

      if (error) {
        console.error("Error saving profile:", error);
        setSaveError("Could not save changes. Please try again.");
        return;
      }

      setSaveMessage("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      console.error("Unexpected error saving profile:", err);
      setSaveError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (err) {
      console.error("Logout error:", err);
      router.push("/");
    }
  }

  // Loading state
  if (loading || !user || profileLoading) {
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
            Loading your profile...
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    );
  }

  const email = user.email ?? "No email";

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
        maxWidth: "500px",
        margin: "0 auto",
        padding: "20px 16px 40px",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "none",
            border: "none",
            color: colors.textSecondary,
            fontSize: "14px",
            cursor: "pointer",
            padding: "0",
            marginBottom: "20px",
          }}
        >
          <span style={{ fontSize: "18px" }}>←</span>
          Back
        </button>

        {/* Profile Header Card */}
        <section style={{
          background: `linear-gradient(135deg, rgba(255, 7, 58, 0.1) 0%, ${colors.darkCard} 50%, rgba(0, 240, 255, 0.1) 100%)`,
          border: `1px solid ${colors.border}`,
          borderRadius: "24px",
          padding: "32px 24px",
          marginBottom: "20px",
          position: "relative",
          overflow: "hidden",
          textAlign: "center",
        }}>
          {/* Decorative elements */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: `linear-gradient(90deg, ${colors.red}, ${colors.purple}, ${colors.cyan})`,
          }} />

          {/* Avatar */}
          <div style={{
            width: "100px",
            height: "100px",
            margin: "0 auto 16px",
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${colors.red} 0%, ${colors.purple} 50%, ${colors.cyan} 100%)`,
            padding: "3px",
          }}>
            <div style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              background: colors.darkCard,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <span style={{
                fontFamily: fonts.heading,
                fontSize: "32px",
                fontWeight: 700,
                background: `linear-gradient(135deg, ${colors.red} 0%, ${colors.cyan} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                {initials}
              </span>
            </div>
          </div>

          {/* Name */}
          <h1 style={{
            fontFamily: fonts.heading,
            fontSize: "24px",
            fontWeight: 700,
            color: colors.textPrimary,
            marginBottom: "8px",
          }}>
            {displayName}
          </h1>

          {/* Email */}
          <p style={{
            fontSize: "14px",
            color: colors.textSecondary,
            marginBottom: "16px",
          }}>
            {email}
          </p>

          {/* Member badge */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: "20px",
            border: `1px solid ${colors.border}`,
          }}>
            <span style={{ fontSize: "14px" }}>🎮</span>
            <span style={{
              fontSize: "12px",
              color: colors.textSecondary,
            }}>
              Member since {memberSince}
            </span>
          </div>
        </section>

        {/* Stats Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginBottom: "20px",
        }}>
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <div style={{
              background: colors.darkCard,
              border: `1px solid ${colors.border}`,
              borderRadius: "16px",
              padding: "20px",
              textAlign: "center",
              transition: "all 0.2s ease",
              cursor: "pointer",
            }}>
              <p style={{
                fontFamily: fonts.heading,
                fontSize: "32px",
                fontWeight: 700,
                color: colors.cyan,
                marginBottom: "4px",
              }}>
                {bookingStats.total}
              </p>
              <p style={{
                fontSize: "12px",
                color: colors.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}>
                Total Bookings
              </p>
            </div>
          </Link>

          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <div style={{
              background: colors.darkCard,
              border: `1px solid ${colors.border}`,
              borderRadius: "16px",
              padding: "20px",
              textAlign: "center",
              transition: "all 0.2s ease",
              cursor: "pointer",
            }}>
              <p style={{
                fontFamily: fonts.heading,
                fontSize: "32px",
                fontWeight: 700,
                color: colors.green,
                marginBottom: "4px",
              }}>
                {bookingStats.upcoming}
              </p>
              <p style={{
                fontSize: "12px",
                color: colors.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}>
                Upcoming
              </p>
            </div>
          </Link>
        </div>

        {/* Success/Error Messages */}
        {saveMessage && (
          <div style={{
            padding: "14px 16px",
            background: "rgba(34, 197, 94, 0.15)",
            border: "1px solid rgba(34, 197, 94, 0.3)",
            borderRadius: "12px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}>
            <span style={{ fontSize: "18px" }}>✓</span>
            <p style={{ fontSize: "13px", color: colors.green, margin: 0 }}>
              {saveMessage}
            </p>
          </div>
        )}

        {saveError && (
          <div style={{
            padding: "14px 16px",
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "12px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}>
            <span style={{ fontSize: "18px" }}>⚠️</span>
            <p style={{ fontSize: "13px", color: "#ef4444", margin: 0 }}>
              {saveError}
            </p>
          </div>
        )}

        {/* Personal Details Section */}
        <section style={{
          background: colors.darkCard,
          border: `1px solid ${colors.border}`,
          borderRadius: "20px",
          padding: "20px",
          marginBottom: "16px",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}>
            <h2 style={{
              fontSize: "14px",
              fontWeight: 600,
              color: colors.textPrimary,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              margin: 0,
            }}>
              <span>👤</span> Personal Details
            </h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  padding: "6px 14px",
                  background: "rgba(0, 240, 255, 0.1)",
                  border: `1px solid rgba(0, 240, 255, 0.3)`,
                  borderRadius: "8px",
                  color: colors.cyan,
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Edit
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSaveProfile}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                marginBottom: "12px",
              }}>
                <div>
                  <label style={{
                    display: "block",
                    fontSize: "11px",
                    color: colors.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "6px",
                  }}>
                    First Name
                  </label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: `1px solid ${colors.border}`,
                      borderRadius: "10px",
                      color: colors.textPrimary,
                      fontSize: "14px",
                      fontFamily: fonts.body,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: "block",
                    fontSize: "11px",
                    color: colors.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "6px",
                  }}>
                    Last Name
                  </label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: `1px solid ${colors.border}`,
                      borderRadius: "10px",
                      color: colors.textPrimary,
                      fontSize: "14px",
                      fontFamily: fonts.body,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{
                  display: "block",
                  fontSize: "11px",
                  color: colors.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "6px",
                }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: `1px solid ${colors.border}`,
                    borderRadius: "10px",
                    color: colors.textPrimary,
                    fontSize: "14px",
                    fontFamily: fonts.body,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{
                  display: "block",
                  fontSize: "11px",
                  color: colors.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "6px",
                }}>
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: `1px solid ${colors.border}`,
                    borderRadius: "10px",
                    color: colors.textPrimary,
                    fontSize: "14px",
                    fontFamily: fonts.body,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{
                display: "flex",
                gap: "10px",
              }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: `1px solid ${colors.border}`,
                    borderRadius: "10px",
                    color: colors.textSecondary,
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: `linear-gradient(135deg, ${colors.cyan} 0%, #0891b2 100%)`,
                    border: "none",
                    borderRadius: "10px",
                    color: colors.dark,
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <span style={{ fontSize: "13px", color: colors.textMuted }}>Name</span>
                <span style={{ fontSize: "14px", color: colors.textPrimary, fontWeight: 500 }}>
                  {displayName || "Not set"}
                </span>
              </div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <span style={{ fontSize: "13px", color: colors.textMuted }}>Email</span>
                <span style={{ fontSize: "14px", color: colors.cyan, fontWeight: 500 }}>
                  {email}
                </span>
              </div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <span style={{ fontSize: "13px", color: colors.textMuted }}>Phone</span>
                <span style={{ fontSize: "14px", color: colors.textPrimary, fontWeight: 500 }}>
                  {phone || "Not set"}
                </span>
              </div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <span style={{ fontSize: "13px", color: colors.textMuted }}>Birthday</span>
                <span style={{ fontSize: "14px", color: colors.textPrimary, fontWeight: 500 }}>
                  {dob ? new Date(dob + "T00:00:00").toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }) : "Not set"}
                </span>
              </div>
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section style={{
          background: colors.darkCard,
          border: `1px solid ${colors.border}`,
          borderRadius: "20px",
          padding: "20px",
          marginBottom: "16px",
        }}>
          <h2 style={{
            fontSize: "14px",
            fontWeight: 600,
            color: colors.textPrimary,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "16px",
          }}>
            <span>⚡</span> Quick Actions
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <Link href="/dashboard" style={{ textDecoration: "none" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "14px 16px",
                background: "rgba(255, 255, 255, 0.03)",
                border: `1px solid ${colors.border}`,
                borderRadius: "12px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  background: `linear-gradient(135deg, ${colors.cyan}20 0%, ${colors.cyan}10 100%)`,
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                }}>
                  📊
                </div>
                <div>
                  <p style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: colors.textPrimary,
                    marginBottom: "2px",
                  }}>
                    View All Bookings
                  </p>
                  <p style={{
                    fontSize: "12px",
                    color: colors.textMuted,
                  }}>
                    See your upcoming and past sessions
                  </p>
                </div>
                <span style={{
                  marginLeft: "auto",
                  color: colors.textMuted,
                  fontSize: "18px",
                }}>
                  →
                </span>
              </div>
            </Link>

            <Link href="/" style={{ textDecoration: "none" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "14px 16px",
                background: "rgba(255, 255, 255, 0.03)",
                border: `1px solid ${colors.border}`,
                borderRadius: "12px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  background: `linear-gradient(135deg, ${colors.red}20 0%, ${colors.red}10 100%)`,
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                }}>
                  🎮
                </div>
                <div>
                  <p style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: colors.textPrimary,
                    marginBottom: "2px",
                  }}>
                    Book a Café
                  </p>
                  <p style={{
                    fontSize: "12px",
                    color: colors.textMuted,
                  }}>
                    Find and book gaming cafés near you
                  </p>
                </div>
                <span style={{
                  marginLeft: "auto",
                  color: colors.textMuted,
                  fontSize: "18px",
                }}>
                  →
                </span>
              </div>
            </Link>
          </div>
        </section>

        {/* Logout Section */}
        <section style={{
          background: "rgba(239, 68, 68, 0.08)",
          border: `1px solid rgba(239, 68, 68, 0.2)`,
          borderRadius: "20px",
          padding: "20px",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}>
            <div style={{
              width: "48px",
              height: "48px",
              background: "rgba(239, 68, 68, 0.15)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
            }}>
              🚪
            </div>
            <div style={{ flex: 1 }}>
              <p style={{
                fontSize: "14px",
                fontWeight: 600,
                color: colors.textPrimary,
                marginBottom: "4px",
              }}>
                Log Out
              </p>
              <p style={{
                fontSize: "12px",
                color: colors.textMuted,
              }}>
                Sign out of your account
              </p>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: "10px 20px",
                background: "rgba(239, 68, 68, 0.2)",
                border: `1px solid rgba(239, 68, 68, 0.4)`,
                borderRadius: "10px",
                color: "#ef4444",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Log Out
            </button>
          </div>
        </section>
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