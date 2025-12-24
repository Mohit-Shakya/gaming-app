// src/app/admin/_components/CafesTable.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { colors, fonts } from "@/lib/constants";

type CafeRow = {
  id: string;
  name: string | null;
  slug?: string | null;
  city?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
};

export default function CafesTable() {
  const router = useRouter();

  const [cafes, setCafes] = useState<CafeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">(
    "all"
  );
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from("cafes")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("[CafesTable] Supabase error:", error);
          if (!cancelled) {
            setError(error.message || "Could not load cafés.");
          }
          return;
        }

        if (!cancelled) {
          setCafes((data as CafeRow[]) ?? []);
        }
      } catch (err) {
        console.error("[CafesTable] Unexpected error:", err);
        if (!cancelled) {
          setError("Could not load cafés. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Toggle café status (active/inactive)
  const handleToggleStatus = async (cafeId: string, currentIsActive: boolean | null) => {
    const newIsActive = !(currentIsActive ?? true);

    try {
      setActionLoading(cafeId);

      const { error } = await supabase
        .from("cafes")
        .update({ is_active: newIsActive })
        .eq("id", cafeId);

      if (error) throw error;

      // Verify the update by fetching the updated cafe
      const { data: updatedCafe, error: fetchError } = await supabase
        .from("cafes")
        .select("*")
        .eq("id", cafeId)
        .single();

      if (fetchError) throw fetchError;

      // Update local state with verified data
      setCafes(prev =>
        prev.map(cafe =>
          cafe.id === cafeId ? (updatedCafe as CafeRow) : cafe
        )
      );

      alert(`Café ${newIsActive ? "activated" : "deactivated"} successfully!`);
    } catch (err) {
      console.error("Error toggling status:", err);
      alert(`Failed to ${newIsActive ? "activate" : "deactivate"} café: ${err instanceof Error ? err.message : String(err)}`);

      // Reload cafes on error to ensure UI matches database
      window.location.reload();
    } finally {
      setActionLoading(null);
    }
  };

  // Delete café - Actually just deactivates it to avoid FK constraint issues
  const handleDelete = async (cafeId: string, cafeName: string | null) => {
    const confirmed = confirm(
      `Are you sure you want to delete "${cafeName || "this café"}"?\n\n` +
      `Note: Due to database constraints, this will deactivate the café instead of permanently deleting it.\n` +
      `The café will be hidden from users but all data will be preserved.`
    );

    if (!confirmed) return;

    try {
      setActionLoading(cafeId);

      console.log("Deactivating cafe (soft delete):", cafeId);

      // Instead of deleting, mark as inactive and hide from users
      const { error } = await supabase
        .from("cafes")
        .update({
          is_active: false,
          name: `[DELETED] ${cafeName || 'Untitled'}` // Mark as deleted
        })
        .eq("id", cafeId);

      if (error) {
        console.error("Error deactivating cafe:", error);
        throw new Error(`Failed to deactivate café: ${error.message}`);
      }

      // Remove from local state
      setCafes(prev => prev.filter(cafe => cafe.id !== cafeId));

      alert("Café has been deactivated and hidden from users!");
    } catch (err) {
      console.error("Error deactivating café:", err);
      alert(`Failed to deactivate café: ${(err instanceof Error ? err.message : String(err)) || "Unknown error"}`);

      // Reload to ensure UI matches database state
      window.location.reload();
    } finally {
      setActionLoading(null);
    }
  };

  // ===== UI STATES =====

  if (loading) {
    return (
      <div
        style={{
          marginTop: 16,
          padding: "14px 16px",
          borderRadius: 16,
          background: colors.darkerCard,
          border: `1px solid ${colors.border}`,
          color: colors.textSecondary,
          fontFamily: fonts.body,
          fontSize: 13,
        }}
      >
        Loading cafés…
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          marginTop: 16,
          padding: "14px 16px",
          borderRadius: 16,
          border: "1px solid rgba(248,113,113,0.6)",
          background: "rgba(248,113,113,0.08)",
          color: "#fecaca",
          fontSize: 13,
          fontFamily: fonts.body,
        }}
      >
        {error}
      </div>
    );
  }

  // Filter cafes based on search and status
  const filteredCafes = cafes.filter((cafe) => {
    const matchesSearch =
      !searchQuery ||
      cafe.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cafe.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cafe.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && (cafe.is_active ?? true)) ||
      (filterStatus === "inactive" && !(cafe.is_active ?? true));

    return matchesSearch && matchesStatus;
  });

  if (!cafes.length) {
    return (
      <div
        style={{
          padding: "40px 20px",
          borderRadius: 16,
          background: colors.darkCard,
          border: `1px solid ${colors.border}`,
          color: colors.textSecondary,
          fontFamily: fonts.body,
          fontSize: 14,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>🏪</div>
        <p
          style={{
            margin: 0,
            color: colors.textPrimary,
            fontSize: 16,
            marginBottom: 8,
          }}
        >
          No cafés yet
        </p>
        <p style={{ margin: 0, fontSize: 13 }}>
          Once café owners sign up and add their cafés, you'll see them listed
          here.
        </p>
      </div>
    );
  }

  // ===== MAIN TABLE =====

  return (
    <section
      style={{
        padding: "24px",
        borderRadius: 16,
        background: colors.darkCard,
        border: `1px solid ${colors.border}`,
        fontFamily: fonts.body,
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 18,
              fontFamily: fonts.heading,
              color: colors.textPrimary,
              marginBottom: 6,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            🏪 All Cafés
            <span
              style={{
                fontSize: 12,
                fontWeight: 400,
                color: colors.textMuted,
                background: colors.darkerCard,
                padding: "4px 10px",
                borderRadius: 999,
              }}
            >
              {filteredCafes.length} total
            </span>
          </h2>
          <p
            style={{
              fontSize: 13,
              color: colors.textSecondary,
              margin: 0,
            }}
          >
            Manage and monitor all gaming cafés on the platform
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        {/* Search */}
        <div style={{ flex: "1 1 250px" }}>
          <input
            type="text"
            placeholder="🔍 Search by name, city, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 10,
              border: `1px solid ${colors.border}`,
              background: colors.darkerCard,
              color: colors.textPrimary,
              fontSize: 13,
              fontFamily: fonts.body,
              outline: "none",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = colors.cyan;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = colors.border;
            }}
          />
        </div>

        {/* Status Filter */}
        <div style={{ display: "flex", gap: 8 }}>
          {(["all", "active", "inactive"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              style={{
                padding: "10px 16px",
                borderRadius: 10,
                border: `1px solid ${
                  filterStatus === status ? colors.cyan : colors.border
                }`,
                background:
                  filterStatus === status
                    ? "rgba(0,240,255,0.1)"
                    : colors.darkerCard,
                color:
                  filterStatus === status ? colors.cyan : colors.textSecondary,
                fontSize: 13,
                fontWeight: filterStatus === status ? 600 : 400,
                cursor: "pointer",
                textTransform: "capitalize",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (filterStatus !== status) {
                  e.currentTarget.style.borderColor = colors.textMuted;
                }
              }}
              onMouseLeave={(e) => {
                if (filterStatus !== status) {
                  e.currentTarget.style.borderColor = colors.border;
                }
              }}
            >
              {status === "all" ? `All (${cafes.length})` : status}
            </button>
          ))}
        </div>
      </div>

      {/* No results message */}
      {filteredCafes.length === 0 && (
        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            color: colors.textSecondary,
            fontSize: 14,
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>🔍</div>
          <p style={{ margin: 0 }}>No cafés match your search criteria</p>
        </div>
      )}

      {filteredCafes.length > 0 && (
        <div
          style={{
            width: "100%",
            overflowX: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
            }}
          >
            <thead>
              <tr
                style={{
                  textAlign: "left",
                  color: colors.textMuted,
                  borderBottom: `2px solid ${colors.border}`,
                }}
              >
                <th
                  style={{
                    padding: "14px 12px",
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Café
                </th>
                <th
                  style={{
                    padding: "14px 12px",
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  City
                </th>
                <th
                  style={{
                    padding: "14px 12px",
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: "14px 12px",
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Created
                </th>
                <th
                  style={{
                    padding: "14px 12px",
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    textAlign: "right",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCafes.map((cafe) => (
                <tr
                  key={cafe.id}
                  onClick={() => router.push(`/admin/cafes/${cafe.id}`)}
                  style={{
                    borderBottom: `1px solid ${colors.border}`,
                    transition: "all 0.2s",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "rgba(148,163,184,0.03)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <td style={{ padding: "14px 12px" }}>
                    <div
                      style={{
                        fontSize: 14,
                        color: colors.textPrimary,
                        fontWeight: 600,
                        marginBottom: 4,
                      }}
                    >
                      {cafe.name || "Untitled café"}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: colors.textMuted,
                        fontFamily: "monospace",
                      }}
                    >
                      {cafe.id.slice(0, 8)}…
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "14px 12px",
                      color: colors.textSecondary,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span>📍</span>
                      {cafe.city || "-"}
                    </div>
                  </td>
                  <td style={{ padding: "14px 12px" }}>
                    <span
                      style={{
                        padding: "6px 12px",
                        borderRadius: 999,
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        fontWeight: 600,
                        background:
                          (cafe.is_active ?? true)
                            ? "rgba(34,197,94,0.15)"
                            : "rgba(148,163,184,0.15)",
                        color:
                          (cafe.is_active ?? true)
                            ? colors.green
                            : colors.textSecondary,
                        border: `1px solid ${
                          (cafe.is_active ?? true)
                            ? "rgba(34,197,94,0.3)"
                            : colors.border
                        }`,
                      }}
                    >
                      {(cafe.is_active ?? true) ? "✓ " : "• "}
                      {(cafe.is_active ?? true) ? "active" : "inactive"}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "14px 12px",
                      fontSize: 12,
                      color: colors.textSecondary,
                    }}
                  >
                    {cafe.created_at
                      ? new Date(cafe.created_at).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "-"}
                  </td>
                  <td
                    style={{
                      padding: "14px 12px",
                      textAlign: "right",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        justifyContent: "flex-end",
                        alignItems: "center",
                      }}
                    >
                      {/* Toggle Status Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(cafe.id, cafe.is_active ?? null);
                        }}
                        disabled={actionLoading === cafe.id}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 8,
                          border: `1px solid ${
                            (cafe.is_active ?? true)
                              ? "rgba(148,163,184,0.3)"
                              : "rgba(34,197,94,0.3)"
                          }`,
                          background:
                            (cafe.is_active ?? true)
                              ? "rgba(148,163,184,0.1)"
                              : "rgba(34,197,94,0.1)",
                          color:
                            (cafe.is_active ?? true)
                              ? colors.textSecondary
                              : colors.green,
                          fontSize: 11,
                          cursor: actionLoading === cafe.id ? "not-allowed" : "pointer",
                          opacity: actionLoading === cafe.id ? 0.6 : 1,
                          transition: "all 0.2s",
                          fontWeight: 500,
                        }}
                        onMouseEnter={(e) => {
                          if (actionLoading !== cafe.id) {
                            e.currentTarget.style.opacity = "0.8";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (actionLoading !== cafe.id) {
                            e.currentTarget.style.opacity = "1";
                          }
                        }}
                      >
                        {actionLoading === cafe.id
                          ? "..."
                          : (cafe.is_active ?? true)
                          ? "• Deactivate"
                          : "✓ Activate"}
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(cafe.id, cafe.name);
                        }}
                        disabled={actionLoading === cafe.id}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 8,
                          border: "1px solid rgba(248,113,113,0.3)",
                          background: "rgba(248,113,113,0.1)",
                          color: "#f87171",
                          fontSize: 11,
                          cursor: actionLoading === cafe.id ? "not-allowed" : "pointer",
                          opacity: actionLoading === cafe.id ? 0.6 : 1,
                          transition: "all 0.2s",
                          fontWeight: 500,
                        }}
                        onMouseEnter={(e) => {
                          if (actionLoading !== cafe.id) {
                            e.currentTarget.style.background = "rgba(248,113,113,0.2)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (actionLoading !== cafe.id) {
                            e.currentTarget.style.background = "rgba(248,113,113,0.1)";
                          }
                        }}
                      >
                        🗑️ Delete
                      </button>

                      {/* Copy ID Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(cafe.id);
                          alert("Café ID copied to clipboard!");
                        }}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 8,
                          border: `1px solid ${colors.border}`,
                          background: colors.darkerCard,
                          color: colors.textSecondary,
                          fontSize: 11,
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = colors.cyan;
                          e.currentTarget.style.color = colors.cyan;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = colors.border;
                          e.currentTarget.style.color = colors.textSecondary;
                        }}
                      >
                        📋 Copy
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}   