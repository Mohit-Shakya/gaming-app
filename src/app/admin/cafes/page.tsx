"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type CafeRow = {
  id: string;
  name: string;
  address: string | null;
  is_active: boolean;
};

export default function AdminCafesPage() {
  const [cafes, setCafes] = useState<CafeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function loadCafes() {
    setLoading(true);
    setErrorMsg(null);

    const { data, error } = await supabase
      .from("cafes")
      .select("id, name, address, is_active")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setErrorMsg(error.message);
    } else {
      setCafes(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadCafes();
  }, []);

  async function toggleActive(cafe: CafeRow) {
    setBusyId(cafe.id);
    setErrorMsg(null);

    const { error } = await supabase
      .from("cafes")
      .update({ is_active: !cafe.is_active })
      .eq("id", cafe.id);

    if (error) {
      console.error(error);
      setErrorMsg(error.message);
    } else {
      setCafes((prev) =>
        prev.map((c) =>
          c.id === cafe.id ? { ...c, is_active: !c.is_active } : c
        )
      );
    }

    setBusyId(null);
  }

  async function deleteCafe(cafe: CafeRow) {
    const sure = window.confirm(
      `Delete "${cafe.name}" permanently?\n\nThis removes the row from the database.`
    );
    if (!sure) return;

    setBusyId(cafe.id);
    setErrorMsg(null);

    // NOTE: this only deletes the DB row, not the files in Storage.
    const { error } = await supabase.from("cafes").delete().eq("id", cafe.id);

    if (error) {
      console.error(error);
      setErrorMsg(error.message);
    } else {
      setCafes((prev) => prev.filter((c) => c.id !== cafe.id));
    }

    setBusyId(null);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-xl">Cafés (admin)</h1>
        <Link
          href="/admin/cafes/new"
          className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-black"
        >
          + Create café
        </Link>
      </div>

      {errorMsg && (
        <p className="rounded-xl bg-red-900/40 px-3 py-2 text-xs text-red-200">
          {errorMsg}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Loading cafés…</p>
      ) : cafes.length === 0 ? (
        <p className="text-sm text-gray-400">No cafés yet.</p>
      ) : (
        <div className="space-y-3">
          {cafes.map((cafe) => (
            <div
              key={cafe.id}
              className="flex flex-col gap-2 rounded-2xl border border-neutral-800 bg-neutral-900 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-white">{cafe.name}</p>
                <p className="text-xs text-gray-400">
                  {cafe.address || "Address not set"}
                </p>
                <p className="mt-1 text-[11px]">
                  <span
                    className={
                      cafe.is_active
                        ? "rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400"
                        : "rounded-full bg-yellow-500/10 px-2 py-0.5 text-[11px] font-medium text-yellow-400"
                    }
                  >
                    {cafe.is_active ? "Active" : "Hidden / inactive"}
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/admin/cafes/${cafe.id}`}
                  className="rounded-xl border border-neutral-700 px-3 py-1.5 text-xs font-medium text-gray-100"
                >
                  Edit
                </Link>

                <button
                  type="button"
                  disabled={busyId === cafe.id}
                  onClick={() => toggleActive(cafe)}
                  className="rounded-xl border border-neutral-700 px-3 py-1.5 text-xs font-medium text-gray-100 disabled:opacity-50"
                >
                  {cafe.is_active ? "Deactivate" : "Activate"}
                </button>

                <button
                  type="button"
                  disabled={busyId === cafe.id}
                  onClick={() => deleteCafe(cafe)}
                  className="rounded-xl border border-red-700 px-3 py-1.5 text-xs font-medium text-red-200 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}