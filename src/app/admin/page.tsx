// src/app/admin/page.tsx
"use client";

import { useEffect, useState, FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";

type CafeRow = {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  ps5_count?: number | null;
  ps4_count?: number | null;
  xbox_count?: number | null;
  pc_count?: number | null;
  pool_count?: number | null;
  arcade_count?: number | null;
  hourly_price?: number | null;
  total_seats?: number | null;
};

type AdminState = "checking" | "denied" | "ok";
type FormMode = "create" | "edit";

export default function AdminPage() {
  const [adminState, setAdminState] = useState<AdminState>("checking");
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  const [cafes, setCafes] = useState<CafeRow[]>([]);
  const [loadingCafes, setLoadingCafes] = useState(false);
  const [cafesError, setCafesError] = useState<string | null>(null);

  // form + mode (create vs edit)
  const [mode, setMode] = useState<FormMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    ps5_count: "0",
    ps4_count: "0",
    xbox_count: "0",
    pc_count: "0",
    pool_count: "0",
    arcade_count: "0",
    hourly_price: "0",
  });

  // ---------- HELPERS ----------
  function handleChange(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toInt(value: string): number {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.floor(n);
  }

  // central fetch function used by effect + manual refresh
  async function reloadCafes() {
    try {
      setLoadingCafes(true);
      setCafesError(null);

      const { data, error } = await supabase
        .from("cafes")
        .select(
          "id, name, address, city, ps5_count, ps4_count, xbox_count, pc_count, pool_count, arcade_count, hourly_price, total_seats"
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[Admin] cafes load error:", error);
        setCafesError("Could not load cafés from database.");
        return;
      }

      setCafes((data as CafeRow[]) ?? []);
    } finally {
      setLoadingCafes(false);
    }
  }

  // ---------- ADMIN CHECK ----------
  useEffect(() => {
    async function checkAdmin() {
      try {
        setAdminState("checking");

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setAdminState("denied");
          return;
        }

        setAdminEmail(user.email ?? null);

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (error || !profile || profile.role !== "admin") {
          setAdminState("denied");
          return;
        }

        setAdminState("ok");
        await reloadCafes();
      } catch (err) {
        console.error("[Admin] unexpected error:", err);
        setAdminState("denied");
      }
    }

    checkAdmin();
  }, []);

  // ---------- SUBMIT (CREATE or EDIT) ----------
  async function handleSubmitCafe(e: FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(null);

    if (!form.name.trim()) {
      setSaveError("Please enter a café name.");
      return;
    }
    if (!form.address.trim()) {
      setSaveError("Please enter an address / area.");
      return;
    }
    if (!form.city.trim()) {
      setSaveError("Please enter a city.");
      return;
    }

    const payloadCounts = {
      ps5_count: toInt(form.ps5_count),
      ps4_count: toInt(form.ps4_count),
      xbox_count: toInt(form.xbox_count),
      pc_count: toInt(form.pc_count),
      pool_count: toInt(form.pool_count),
      arcade_count: toInt(form.arcade_count),
    };

    const totalSeats =
      payloadCounts.ps5_count +
      payloadCounts.ps4_count +
      payloadCounts.xbox_count +
      payloadCounts.pc_count +
      payloadCounts.pool_count +
      payloadCounts.arcade_count;

    const payload = {
      name: form.name.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      hourly_price: toInt(form.hourly_price),
      total_seats: totalSeats,
      ...payloadCounts,
    };

    try {
      setSaving(true);

      if (mode === "create") {
        const { error } = await supabase.from("cafes").insert(payload);

        if (error) {
          console.error("[Admin] insert cafe error:", error);
          setSaveError(error.message || "Could not create café.");
          return;
        }

        setSaveSuccess("New gaming café created.");
      } else if (mode === "edit" && editingId) {
        const { error } = await supabase
          .from("cafes")
          .update(payload)
          .eq("id", editingId);

        if (error) {
          console.error("[Admin] update cafe error:", error);
          setSaveError(error.message || "Could not update café.");
          return;
        }

        setSaveSuccess("Café details updated.");
      }

      // reset to create mode + reload
      setMode("create");
      setEditingId(null);
      setForm({
        name: "",
        address: "",
        city: "",
        ps5_count: "0",
        ps4_count: "0",
        xbox_count: "0",
        pc_count: "0",
        pool_count: "0",
        arcade_count: "0",
        hourly_price: "0",
      });

      await reloadCafes();
    } catch (err) {
      console.error("[Admin] unexpected save error:", err);
      setSaveError("Unexpected error while saving café.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(cafe: CafeRow) {
    setMode("edit");
    setEditingId(cafe.id);
    setSaveError(null);
    setSaveSuccess(null);

    setForm({
      name: cafe.name ?? "",
      address: cafe.address ?? "",
      city: cafe.city ?? "",
      ps5_count: String(cafe.ps5_count ?? 0),
      ps4_count: String(cafe.ps4_count ?? 0),
      xbox_count: String(cafe.xbox_count ?? 0),
      pc_count: String(cafe.pc_count ?? 0),
      pool_count: String(cafe.pool_count ?? 0),
      arcade_count: String(cafe.arcade_count ?? 0),
      hourly_price: String(cafe.hourly_price ?? 0),
    });

    // scroll to top so user sees the form
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function cancelEdit() {
    setMode("create");
    setEditingId(null);
    setSaveError(null);
    setSaveSuccess(null);
    setForm({
      name: "",
      address: "",
      city: "",
      ps5_count: "0",
      ps4_count: "0",
      xbox_count: "0",
      pc_count: "0",
      pool_count: "0",
      arcade_count: "0",
      hourly_price: "0",
    });
  }

  // ---------- RENDER STATES ----------
  if (adminState === "checking") {
    return (
      <div className="min-h-screen bg-[#0b0b0b] text-white">
        <div className="mx-auto max-w-xl px-4 py-8">
          <p className="text-sm text-gray-300">Checking admin access…</p>
        </div>
      </div>
    );
  }

  if (adminState === "denied") {
    return (
      <div className="min-h-screen bg-[#0b0b0b] text-white">
        <div className="mx-auto max-w-xl px-4 py-8">
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            You are not allowed to access the admin panel.
          </p>
        </div>
      </div>
    );
  }

  // ---------- MAIN ADMIN UI ----------
  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* Header */}
        <header className="mb-6">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">
            Admin
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">
            Admin panel
          </h1>
          {adminEmail && (
            <p className="mt-1 text-[12px] text-gray-400">
              Signed in as <span className="font-mono">{adminEmail}</span>
            </p>
          )}
        </header>

        {/* Create / Edit café */}
        <section className="mb-8 rounded-2xl bg-white px-4 py-4 text-[#111827] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="mb-1 text-sm font-semibold tracking-tight">
                {mode === "create"
                  ? "Add new gaming café"
                  : "Edit gaming café"}
              </h2>
              <p className="mb-2 text-[12px] text-gray-500">
                Use this form to onboard or update a café in your booking app.
              </p>
            </div>
            {mode === "edit" && (
              <button
                type="button"
                onClick={cancelEdit}
                className="text-[11px] font-medium text-gray-600 underline"
              >
                Cancel edit
              </button>
            )}
          </div>

          {mode === "edit" && editingId && (
            <p className="mb-3 rounded-lg bg-yellow-50 px-3 py-2 text-[11px] text-yellow-800">
              You are editing an existing café. Make changes and click{" "}
              <strong>Save changes</strong>, or click{" "}
              <strong>Cancel edit</strong> to go back to create mode.
            </p>
          )}

          <form className="space-y-3" onSubmit={handleSubmitCafe}>
            {/* Name */}
            <div>
              <label className="block text-[12px] font-medium text-gray-700">
                Café name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
                placeholder="Gaming Zone, PlayTime Gaming Café…"
              />
            </div>

            {/* Address + City */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[12px] font-medium text-gray-700">
                  Address / Area *
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
                  placeholder="Satya Niketan"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-700">
                  City *
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
                  placeholder="Delhi"
                />
              </div>
            </div>

            {/* Capacity */}
            <div>
              <p className="mb-1 text-[12px] font-medium text-gray-700">
                Console capacity per café
              </p>
              <div className="grid grid-cols-3 gap-2 text-[12px]">
                {[
                  { key: "ps5_count", label: "PS5" },
                  { key: "ps4_count", label: "PS4" },
                  { key: "xbox_count", label: "Xbox" },
                  { key: "pc_count", label: "PC" },
                  { key: "pool_count", label: "Pool" },
                  { key: "arcade_count", label: "Arcade" },
                ].map((f) => (
                  <div key={f.key} className="flex flex-col">
                    <span className="text-gray-600">{f.label}</span>
                    <input
                      type="number"
                      min={0}
                      value={form[f.key as keyof typeof form]}
                      onChange={(e) =>
                        handleChange(
                          f.key as keyof typeof form,
                          e.target.value
                        )
                      }
                      className="mt-1 rounded-lg border border-gray-300 px-2 py-1 text-sm outline-none focus:border-black"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Hourly price */}
            <div>
              <label className="block text-[12px] font-medium text-gray-700">
                Base hourly price (₹) *
              </label>
              <input
                type="number"
                min={0}
                value={form.hourly_price}
                onChange={(e) => handleChange("hourly_price", e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
                placeholder="100"
              />
            </div>

            {/* Messages */}
            {saveError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-[11px] text-red-700">
                {saveError}
              </p>
            )}
            {saveSuccess && (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700">
                {saveSuccess}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={saving}
              className="mt-1 inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:bg-gray-700"
            >
              {saving
                ? "Saving…"
                : mode === "create"
                ? "Create café"
                : "Save changes"}
            </button>
          </form>
        </section>

        {/* Cafés list */}
        <section className="rounded-2xl bg-white px-4 py-4 text-[#111827] shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight">
              Existing cafés
            </h2>
            <button
              onClick={reloadCafes}
              disabled={loadingCafes}
              className="text-[11px] font-medium text-gray-600 underline disabled:cursor-not-allowed disabled:text-gray-400"
            >
              {loadingCafes ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          {cafesError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-[11px] text-red-700">
              {cafesError}
            </p>
          )}

          {loadingCafes && cafes.length === 0 ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-xl bg-gray-200/70"
                />
              ))}
            </div>
          ) : cafes.length === 0 ? (
            <p className="text-[12px] text-gray-500">
              No cafés found yet. Use the form above to create the first one.
            </p>
          ) : (
            <div className="space-y-2 text-[12px]">
              {cafes.map((cafe) => {
                const totalCount =
                  (cafe.ps5_count ?? 0) +
                  (cafe.ps4_count ?? 0) +
                  (cafe.xbox_count ?? 0) +
                  (cafe.pc_count ?? 0) +
                  (cafe.pool_count ?? 0) +
                  (cafe.arcade_count ?? 0);

                return (
                  <div
                    key={cafe.id}
                    className="flex items-start justify-between gap-2 rounded-xl border border-gray-100 px-3 py-2 shadow-sm"
                  >
                    <div className="flex-1">
                      <div className="text-[13px] font-semibold">
                        {cafe.name}
                      </div>
                      <div className="mt-1 text-[11px] text-gray-500">
                        {[cafe.address, cafe.city]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                      <div className="mt-1 text-[11px] text-gray-500">
                        Base hourly price: ₹{cafe.hourly_price ?? 0}
                      </div>
                    </div>
                    <div className="text-right text-[11px] text-gray-600">
                      <div>Total setups: {totalCount}</div>
                      <div className="mt-1">
                        PS5 {cafe.ps5_count ?? 0} · PS4{" "}
                        {cafe.ps4_count ?? 0} · Xbox{" "}
                        {cafe.xbox_count ?? 0}
                      </div>
                      <div>
                        PC {cafe.pc_count ?? 0} · Pool{" "}
                        {cafe.pool_count ?? 0} · Arcade{" "}
                        {cafe.arcade_count ?? 0}
                      </div>
                      <button
                        type="button"
                        onClick={() => startEdit(cafe)}
                        className="mt-2 rounded-full border border-gray-300 px-2 py-0.5 text-[11px] font-medium text-gray-700 hover:border-black"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}