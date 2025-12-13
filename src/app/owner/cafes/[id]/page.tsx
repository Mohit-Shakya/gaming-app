// src/app/owner/cafes/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import useUser from "@/hooks/useUser";
import { colors, fonts } from "@/lib/constants";

type CafeFormData = {
  name: string;
  address: string;
  description: string;
  hourly_price: number;
  google_maps_url: string;
  cover_url: string;
  ps5_count: number;
  ps4_count: number;
  xbox_count: number;
  pc_count: number;
  pool_count: number;
  arcade_count: number;
  snooker_count: number;
  steering_wheel_count: number;
  vr_count: number;
  opening_hours: string;
  peak_hours: string;
  popular_games: string;
  offers: string;
  monitor_details: string;
  processor_details: string;
  gpu_details: string;
  ram_details: string;
  accessories_details: string;
  show_tech_specs: boolean;
};

export default function OwnerCafeEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const cafeId = params?.id;

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<CafeFormData>({
    name: "",
    address: "",
    description: "",
    hourly_price: 150,
    google_maps_url: "",
    cover_url: "",
    ps5_count: 0,
    ps4_count: 0,
    xbox_count: 0,
    pc_count: 0,
    pool_count: 0,
    arcade_count: 0,
    snooker_count: 0,
    steering_wheel_count: 0,
    vr_count: 0,
    opening_hours: "10:00 AM - 11:00 PM",
    peak_hours: "6:00 PM - 10:00 PM",
    popular_games: "",
    offers: "",
    monitor_details: "",
    processor_details: "",
    gpu_details: "",
    ram_details: "",
    accessories_details: "",
    show_tech_specs: false,
  });

  // Check if user owns this cafe
  useEffect(() => {
    async function checkAccess() {
      if (userLoading || !cafeId) return;

      if (!user) {
        router.push("/login");
        return;
      }

      try {
        // Check if user owns this cafe
        const { data: cafe, error } = await supabase
          .from("cafes")
          .select("owner_id")
          .eq("id", cafeId)
          .single();

        if (error) throw error;

        if (cafe.owner_id !== user.id) {
          setError("You don't have permission to edit this café");
          setHasAccess(false);
        } else {
          setHasAccess(true);
        }
      } catch (err) {
        console.error("Error checking access:", err);
        setError("Could not verify café ownership");
        setHasAccess(false);
      } finally {
        setCheckingAccess(false);
      }
    }

    checkAccess();
  }, [user, userLoading, cafeId, router]);

  // Load cafe data
  useEffect(() => {
    if (!hasAccess || !cafeId) return;

    async function loadCafe() {
      try {
        setLoading(true);
        setError(null);

        const { data: cafe, error } = await supabase
          .from("cafes")
          .select("*")
          .eq("id", cafeId)
          .single();

        if (error) throw error;

        if (cafe) {
          setFormData({
            name: cafe.name || "",
            address: cafe.address || "",
            description: cafe.description || "",
            hourly_price: cafe.hourly_price || 150,
            google_maps_url: cafe.google_maps_url || "",
            cover_url: cafe.cover_url || "",
            ps5_count: cafe.ps5_count || 0,
            ps4_count: cafe.ps4_count || 0,
            xbox_count: cafe.xbox_count || 0,
            pc_count: cafe.pc_count || 0,
            pool_count: cafe.pool_count || 0,
            arcade_count: cafe.arcade_count || 0,
            snooker_count: cafe.snooker_count || 0,
            steering_wheel_count: cafe.steering_wheel_count || 0,
            vr_count: cafe.vr_count || 0,
            opening_hours: cafe.opening_hours || "10:00 AM - 11:00 PM",
            peak_hours: cafe.peak_hours || "6:00 PM - 10:00 PM",
            popular_games: cafe.popular_games || "",
            offers: cafe.offers || "",
            monitor_details: cafe.monitor_details || "",
            processor_details: cafe.processor_details || "",
            gpu_details: cafe.gpu_details || "",
            ram_details: cafe.ram_details || "",
            accessories_details: cafe.accessories_details || "",
            show_tech_specs: cafe.show_tech_specs || false,
          });
        }
      } catch (err: any) {
        console.error("Error loading cafe:", err);
        setError(err.message || "Could not load café details");
      } finally {
        setLoading(false);
      }
    }

    loadCafe();
  }, [hasAccess, cafeId]);

  // Handle form submission
  async function handleSave() {
    if (!cafeId) return;

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const { error } = await supabase
        .from("cafes")
        .update(formData)
        .eq("id", cafeId);

      if (error) throw error;

      setSuccessMessage("Café details updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("Error saving cafe:", err);
      setError(err.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  // Loading state
  if (checkingAccess || userLoading || loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#020617",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: colors.textPrimary,
        }}
      >
        Loading...
      </div>
    );
  }

  // Access denied
  if (!hasAccess) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#020617",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          padding: "20px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 64, marginBottom: 20 }}>🔒</div>
        <h1 style={{ fontSize: 24, marginBottom: 12, color: colors.textPrimary }}>
          Access Denied
        </h1>
        <p style={{ fontSize: 14, color: colors.textMuted, marginBottom: 24 }}>
          {error || "You don't have permission to edit this café"}
        </p>
        <button
          onClick={() => router.push("/owner")}
          style={{
            padding: "12px 24px",
            borderRadius: 10,
            border: "none",
            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        fontFamily: fonts.body,
        color: colors.textPrimary,
      }}
    >
      {/* Header */}
      <header
        style={{
          background: "linear-gradient(180deg, #0f172a 0%, #020617 100%)",
          borderBottom: `1px solid ${colors.border}`,
          padding: "24px 32px",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <button
            onClick={() => router.push("/owner")}
            style={{
              border: "none",
              background: "transparent",
              color: colors.textSecondary,
              fontSize: 13,
              marginBottom: 12,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            ← Back to Dashboard
          </button>
          <h1
            style={{
              fontFamily: fonts.heading,
              fontSize: 28,
              margin: 0,
              marginBottom: 8,
            }}
          >
            Edit Café Details
          </h1>
          <p style={{ fontSize: 14, color: colors.textMuted, margin: 0 }}>
            Update your gaming café information and settings
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px" }}>
        {/* Success Message */}
        {successMessage && (
          <div
            style={{
              padding: "16px 20px",
              borderRadius: 12,
              background: "rgba(34, 197, 94, 0.1)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              color: "#22c55e",
              marginBottom: 24,
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 20 }}>✓</span>
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: "16px 20px",
              borderRadius: 12,
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#ef4444",
              marginBottom: 24,
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Basic Information */}
          <Section title="Basic Information" icon="ℹ️">
            <FormField label="Café Name *" required>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter café name"
                style={inputStyle}
              />
            </FormField>

            <FormField label="Address *" required>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter full address"
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </FormField>

            <FormField label="Description">
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your gaming café"
                rows={4}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </FormField>

            <FormField label="Google Maps URL">
              <input
                type="url"
                value={formData.google_maps_url}
                onChange={(e) => setFormData({ ...formData, google_maps_url: e.target.value })}
                placeholder="https://maps.google.com/..."
                style={inputStyle}
              />
            </FormField>

            <FormField label="Cover Image URL">
              <input
                type="url"
                value={formData.cover_url}
                onChange={(e) => setFormData({ ...formData, cover_url: e.target.value })}
                placeholder="https://example.com/cover.jpg"
                style={inputStyle}
              />
            </FormField>
          </Section>

          {/* Pricing & Hours */}
          <Section title="Pricing & Operating Hours" icon="⏰">
            <FormField label="Hourly Price (₹) *" required>
              <input
                type="number"
                value={formData.hourly_price}
                onChange={(e) => setFormData({ ...formData, hourly_price: parseInt(e.target.value) || 0 })}
                min="0"
                step="10"
                style={inputStyle}
              />
            </FormField>

            <FormField label="Opening Hours">
              <input
                type="text"
                value={formData.opening_hours}
                onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })}
                placeholder="e.g., 10:00 AM - 11:00 PM"
                style={inputStyle}
              />
            </FormField>

            <FormField label="Peak Hours">
              <input
                type="text"
                value={formData.peak_hours}
                onChange={(e) => setFormData({ ...formData, peak_hours: e.target.value })}
                placeholder="e.g., 6:00 PM - 10:00 PM"
                style={inputStyle}
              />
            </FormField>
          </Section>

          {/* Gaming Equipment */}
          <Section title="Gaming Equipment" icon="🎮">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <FormField label="PS5 Consoles">
                <input
                  type="number"
                  value={formData.ps5_count}
                  onChange={(e) => setFormData({ ...formData, ps5_count: parseInt(e.target.value) || 0 })}
                  min="0"
                  style={inputStyle}
                />
              </FormField>

              <FormField label="PS4 Consoles">
                <input
                  type="number"
                  value={formData.ps4_count}
                  onChange={(e) => setFormData({ ...formData, ps4_count: parseInt(e.target.value) || 0 })}
                  min="0"
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Xbox Consoles">
                <input
                  type="number"
                  value={formData.xbox_count}
                  onChange={(e) => setFormData({ ...formData, xbox_count: parseInt(e.target.value) || 0 })}
                  min="0"
                  style={inputStyle}
                />
              </FormField>

              <FormField label="PC Gaming Stations">
                <input
                  type="number"
                  value={formData.pc_count}
                  onChange={(e) => setFormData({ ...formData, pc_count: parseInt(e.target.value) || 0 })}
                  min="0"
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Pool Tables">
                <input
                  type="number"
                  value={formData.pool_count}
                  onChange={(e) => setFormData({ ...formData, pool_count: parseInt(e.target.value) || 0 })}
                  min="0"
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Snooker Tables">
                <input
                  type="number"
                  value={formData.snooker_count}
                  onChange={(e) => setFormData({ ...formData, snooker_count: parseInt(e.target.value) || 0 })}
                  min="0"
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Arcade Machines">
                <input
                  type="number"
                  value={formData.arcade_count}
                  onChange={(e) => setFormData({ ...formData, arcade_count: parseInt(e.target.value) || 0 })}
                  min="0"
                  style={inputStyle}
                />
              </FormField>

              <FormField label="VR Stations">
                <input
                  type="number"
                  value={formData.vr_count}
                  onChange={(e) => setFormData({ ...formData, vr_count: parseInt(e.target.value) || 0 })}
                  min="0"
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Racing Simulators">
                <input
                  type="number"
                  value={formData.steering_wheel_count}
                  onChange={(e) => setFormData({ ...formData, steering_wheel_count: parseInt(e.target.value) || 0 })}
                  min="0"
                  style={inputStyle}
                />
              </FormField>
            </div>
          </Section>

          {/* Additional Details */}
          <Section title="Additional Details" icon="📝">
            <FormField label="Popular Games">
              <textarea
                value={formData.popular_games}
                onChange={(e) => setFormData({ ...formData, popular_games: e.target.value })}
                placeholder="List popular games available (comma-separated)"
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </FormField>

            <FormField label="Special Offers">
              <textarea
                value={formData.offers}
                onChange={(e) => setFormData({ ...formData, offers: e.target.value })}
                placeholder="Enter any special offers or promotions"
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </FormField>
          </Section>

          {/* Technical Specifications */}
          <Section title="Technical Specifications" icon="⚙️">
            <FormField label="Show Tech Specs on Café Page">
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.show_tech_specs}
                  onChange={(e) => setFormData({ ...formData, show_tech_specs: e.target.checked })}
                  style={{ width: 20, height: 20, cursor: "pointer" }}
                />
                <span style={{ fontSize: 14, color: colors.textSecondary }}>
                  Display technical specifications to customers
                </span>
              </label>
            </FormField>

            <FormField label="Monitor Details">
              <input
                type="text"
                value={formData.monitor_details}
                onChange={(e) => setFormData({ ...formData, monitor_details: e.target.value })}
                placeholder="e.g., 27-inch 144Hz Gaming Monitor"
                style={inputStyle}
              />
            </FormField>

            <FormField label="Processor Details">
              <input
                type="text"
                value={formData.processor_details}
                onChange={(e) => setFormData({ ...formData, processor_details: e.target.value })}
                placeholder="e.g., Intel Core i7-12700K"
                style={inputStyle}
              />
            </FormField>

            <FormField label="GPU Details">
              <input
                type="text"
                value={formData.gpu_details}
                onChange={(e) => setFormData({ ...formData, gpu_details: e.target.value })}
                placeholder="e.g., NVIDIA RTX 4070"
                style={inputStyle}
              />
            </FormField>

            <FormField label="RAM Details">
              <input
                type="text"
                value={formData.ram_details}
                onChange={(e) => setFormData({ ...formData, ram_details: e.target.value })}
                placeholder="e.g., 32GB DDR5"
                style={inputStyle}
              />
            </FormField>

            <FormField label="Accessories">
              <input
                type="text"
                value={formData.accessories_details}
                onChange={(e) => setFormData({ ...formData, accessories_details: e.target.value })}
                placeholder="e.g., Mechanical Keyboard, Gaming Mouse"
                style={inputStyle}
              />
            </FormField>
          </Section>

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              gap: 16,
              justifyContent: "flex-end",
              padding: "24px 0",
              borderTop: `1px solid ${colors.border}`,
            }}
          >
            <button
              onClick={() => router.push("/owner")}
              disabled={saving}
              style={{
                padding: "14px 28px",
                borderRadius: 10,
                border: `1px solid ${colors.border}`,
                background: "rgba(51,65,85,0.5)",
                color: colors.textSecondary,
                fontSize: 14,
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.5 : 1,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !formData.name || !formData.address}
              style={{
                padding: "14px 28px",
                borderRadius: 10,
                border: "none",
                background:
                  saving || !formData.name || !formData.address
                    ? "rgba(34, 197, 94, 0.3)"
                    : "linear-gradient(135deg, #22c55e, #16a34a)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: saving || !formData.name || !formData.address ? "not-allowed" : "pointer",
                boxShadow:
                  saving || !formData.name || !formData.address
                    ? "none"
                    : "0 4px 16px rgba(34, 197, 94, 0.3)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {saving ? (
                <>
                  <span style={{ animation: "spin 1s linear infinite" }}>⏳</span>
                  Saving...
                </>
              ) : (
                <>
                  <span>💾</span>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Helper Components
function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "rgba(15,23,42,0.6)",
        borderRadius: 16,
        border: `1px solid ${colors.border}`,
        padding: "24px",
      }}
    >
      <h2
        style={{
          fontSize: 18,
          fontWeight: 600,
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 10,
          color: colors.textPrimary,
        }}
      >
        <span style={{ fontSize: 24 }}>{icon}</span>
        {title}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>{children}</div>
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: colors.textSecondary,
        }}
      >
        {label}
        {required && <span style={{ color: "#ef4444", marginLeft: 4 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 8,
  border: `1px solid ${colors.border}`,
  background: "rgba(30,41,59,0.5)",
  color: colors.textPrimary,
  fontSize: 14,
  fontFamily: fonts.body,
};
