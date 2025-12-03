// src/app/cafes/[id]/book/tickets/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import useUser from "@/hooks/useUser";

type ConsoleId = "ps5" | "ps4" | "xbox" | "pc" | "pool" | "arcade";

type ConsoleOption = {
  id: ConsoleId;
  label: string;
};

type TicketOption = {
  id: string;
  console: ConsoleId;
  title: string;
  price: number;
  description: string;
  note?: string;
};

const CONSOLES: ConsoleOption[] = [
  { id: "ps5", label: "PlayStation 5" },
  { id: "ps4", label: "PlayStation 4" },
  { id: "xbox", label: "Xbox" },
  { id: "pc", label: "PC" },
  { id: "pool", label: "Pool" },
  { id: "arcade", label: "Arcade" },
];

const TICKETS: TicketOption[] = [
  {
    id: "ps5_1",
    console: "ps5",
    title: "Play Station 5 | 1 Player",
    price: 150,
    description: "This ticket grants access to one individual for 60 minutes.",
    note: "A 60-minute time extension is available for an added fee of INR 100, payable directly at the venue.",
  },
  {
    id: "ps5_2",
    console: "ps5",
    title: "Play Station 5 | 2 Player",
    price: 250,
    description: "This ticket grants access to two individuals for 60 minutes.",
    note: "A 60-minute time extension is available for an added fee of INR 200, payable directly at the venue.",
  },
  {
    id: "ps5_3",
    console: "ps5",
    title: "Play Station 5 | 3 Player",
    price: 350,
    description: "This ticket grants access to three individuals for 60 minutes.",
    note: "A 60-minute time extension is available for an added fee of INR 300, payable directly at the venue.",
  },
  {
    id: "ps5_4",
    console: "ps5",
    title: "Play Station 5 | 4 Player",
    price: 400,
    description: "This ticket grants access to four individuals for 60 minutes.",
    note: "A 60-minute time extension is available for an added fee of INR 300, payable directly at the venue.",
  },
  {
    id: "ps4_1",
    console: "ps4",
    title: "Play Station 4 | 1 Player",
    price: 120,
    description: "Access for one player for 60 minutes.",
  },
  {
    id: "xbox_1",
    console: "xbox",
    title: "Xbox | 1 Player",
    price: 120,
    description: "Access for one player for 60 minutes.",
  },
  {
    id: "pc_1",
    console: "pc",
    title: "Gaming PC | 1 Player",
    price: 100,
    description: "High-end gaming PC for one player for 60 minutes.",
  },
  {
    id: "pool_1",
    console: "pool",
    title: "Pool Table | 2 Players",
    price: 200,
    description: "Pool table access for up to two players for 60 minutes.",
  },
  {
    id: "arcade_1",
    console: "arcade",
    title: "Arcade Zone | 1 Player",
    price: 150,
    description: "Arcade games access for one player for 60 minutes.",
  },
];

export default function TicketsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const { user, loading: userLoading } = useUser();

  const cafeId = (params as { id?: string }).id;
  const dateKey = searchParams.get("date"); // "2025-11-28"
  const time = searchParams.get("time");    // "10:00 am"

  // If no cafe id at all, something is really wrong
  if (!cafeId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f5fb] text-sm text-red-500">
        Missing café id in URL.
      </div>
    );
  }

  // If user opens this page directly without selecting date/time – send back
  if (!dateKey || !time) {
    if (typeof window !== "undefined") {
      router.replace(`/cafes/${cafeId}/book`);
    }
    return null;
  }

  // If user not logged in, push to login
  if (!user && !userLoading) {
    router.replace("/login");
    return null;
  }

  const dateLabel = useMemo(() => {
    const d = new Date(`${dateKey}T00:00:00`);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      weekday: "short",
    });
  }, [dateKey]);

  const [selectedConsole, setSelectedConsole] = useState<ConsoleId>("ps5");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [cafeName, setCafeName] = useState<string>("Selected Gaming Café");

  // console limits from DB
  const [consoleLimits, setConsoleLimits] = useState<
    Partial<Record<ConsoleId, number>>
  >({});
  const [limitsLoading, setLimitsLoading] = useState(true);
  const [limitsError, setLimitsError] = useState<string | null>(null);

  useEffect(() => {
    async function loadConsoleLimits() {
      try {
        setLimitsLoading(true);
        setLimitsError(null);

        const { data, error } = await supabase
          .from("cafes")
          .select(
            "name, ps5_count, ps4_count, xbox_count, pc_count, pool_count, arcade_count"
          )
          .eq("id", cafeId)
          .maybeSingle();

        if (error) {
          console.error("Supabase error while loading console limits:", error);
          setLimitsError("Could not load console capacity from database.");
          setConsoleLimits({});
          return;
        }

        if (!data) {
          setLimitsError("Could not find this café in the database.");
          setConsoleLimits({});
          return;
        }

        // Save café name
        if ((data as any).name) {
          setCafeName((data as any).name);
        }

        const parse = (value: unknown): number | undefined => {
          if (value === null || value === undefined) return undefined;
          const n = Number(value);
          return Number.isFinite(n) && n >= 0 ? n : undefined;
        };

        const limits: Partial<Record<ConsoleId, number>> = {
          ps5: parse((data as any).ps5_count),
          ps4: parse((data as any).ps4_count),
          xbox: parse((data as any).xbox_count),
          pc: parse((data as any).pc_count),
          pool: parse((data as any).pool_count),
          arcade: parse((data as any).arcade_count),
        };

        setConsoleLimits(limits);
      } catch (err) {
        console.error("Unexpected error loading console limits:", err);
        setLimitsError("Could not load console capacity from database.");
        setConsoleLimits({});
      } finally {
        setLimitsLoading(false);
      }
    }

    loadConsoleLimits();
  }, [cafeId]);

  const ticketsForConsole = useMemo(
    () => TICKETS.filter((t) => t.console === selectedConsole),
    [selectedConsole]
  );

  function getQty(ticketId: string) {
    return quantities[ticketId] ?? 0;
  }

  // Clamp quantity respecting console limits
  function setQty(ticketId: string, value: number) {
    const ticket = TICKETS.find((t) => t.id === ticketId);
    if (!ticket) return;

    setQuantities((prev) => {
      const next = { ...prev };

      if (value <= 0) {
        delete next[ticketId];
      } else {
        next[ticketId] = value;
      }

      const limit = consoleLimits[ticket.console];

      if (limit !== undefined) {
        let used = 0;
        for (const t of TICKETS) {
          if (t.console !== ticket.console) continue;
          used += next[t.id] ?? 0;
        }

        if (used > limit) {
          const overflow = used - limit;
          const newQty = (next[ticketId] ?? 0) - overflow;
          if (newQty <= 0) {
            delete next[ticketId];
          } else {
            next[ticketId] = newQty;
          }
        }
      }

      return next;
    });
  }

  const usedPerConsole = useMemo(() => {
    const map: Partial<Record<ConsoleId, number>> = {};
    for (const t of TICKETS) {
      const qty = quantities[t.id] ?? 0;
      if (!qty) continue;
      map[t.console] = (map[t.console] ?? 0) + qty;
    }
    return map as Record<ConsoleId, number>;
  }, [quantities]);

  const summary = useMemo(() => {
    let totalTickets = 0;
    let totalAmount = 0;

    for (const t of TICKETS) {
      const qty = quantities[t.id] ?? 0;
      if (!qty) continue;
      totalTickets += qty;
      totalAmount += qty * t.price;
    }

    return { totalTickets, totalAmount };
  }, [quantities]);

  const hasSelection = summary.totalTickets > 0;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const maxForSelected =
    consoleLimits[selectedConsole] !== undefined
      ? consoleLimits[selectedConsole]!
      : Infinity;
  const usedForSelected = usedPerConsole[selectedConsole] ?? 0;
  const atLimitForSelected =
    Number.isFinite(maxForSelected) && usedForSelected >= maxForSelected;

  // Main “Confirm” -> build draft + go to checkout
  async function handleConfirm() {
    if (!hasSelection || !cafeId) return;
    setIsSubmitting(true);

    try {
      const selectedTickets = TICKETS.filter((t) => quantities[t.id]).map(
        (t) => ({
          ticketId: t.id,
          console: t.console,
          title: t.title,
          price: t.price,
          quantity: quantities[t.id],
        })
      );

      const payload = {
        cafeId,
        cafeName,
        bookingDate: dateKey!,
        timeSlot: time!,
        tickets: selectedTickets,
        totalAmount: summary.totalAmount,
      };

      if (typeof window !== "undefined") {
        sessionStorage.setItem("checkoutDraft", JSON.stringify(payload));
      }

      router.push("/checkout");
    } catch (err) {
      console.error("Failed to prepare checkout:", err);
      alert("Could not prepare checkout. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ---------- UI ----------
  return (
    <div className="min-h-screen bg-[#f4f5fb] text-[#111827]">
      <div className="max-w-xl mx-auto px-4 pb-28 pt-6">
        {/* Header & chosen slot */}
        <header className="mb-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-[0.18em]">
            Choose Ticket
          </p>
          <h1 className="mt-1 text-lg font-semibold tracking-tight">
            Select console &amp; ticket
          </h1>

          <div className="mt-3 flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm border border-gray-100">
            <div className="text-xs">
              <div className="font-semibold">{dateLabel}</div>
              <div className="text-gray-500">{time}</div>
            </div>
            <button
              onClick={() => router.push(`/cafes/${cafeId}/book`)}
              className="text-xs font-semibold uppercase tracking-wide text-[#111827] border border-gray-300 rounded-lg px-3 py-1 bg-gray-50"
            >
              Change
            </button>
          </div>

          {limitsLoading && (
            <p className="mt-2 text-[11px] text-gray-500">
              Checking console availability…
            </p>
          )}
          {limitsError && (
            <p className="mt-2 text-[11px] text-red-500">{limitsError}</p>
          )}
        </header>

        {/* Console chips */}
        <section className="mb-3">
          <h2 className="text-sm font-medium mb-2">Select Console</h2>
          <div className="flex flex-wrap gap-2">
            {CONSOLES.map((c) => {
              const active = c.id === selectedConsole;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedConsole(c.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                    active
                      ? "bg-[#111827] text-white border-[#111827]"
                      : "bg-white text-[#111827] border-gray-300"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          {Number.isFinite(maxForSelected) && (
            <p className="mt-2 text-[11px] text-gray-500">
              Max {maxForSelected}{" "}
              {CONSOLES.find((c) => c.id === selectedConsole)?.label} setups per
              time slot. You&apos;ve selected {usedForSelected}.
            </p>
          )}
        </section>

        {/* Ticket cards */}
        <section className="space-y-3">
          {ticketsForConsole.map((ticket) => {
            const qty = getQty(ticket.id);
            const hasQty = qty > 0;
            const plusDisabled = atLimitForSelected;

            return (
              <div
                key={ticket.id}
                className="rounded-2xl bg-white px-4 py-3 shadow-sm border border-gray-100"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-[15px] font-semibold">
                      {ticket.title}
                    </div>
                    <div className="mt-1 text-lg font-bold text-[#111827]">
                      ₹{ticket.price}
                    </div>
                    <p className="mt-2 text-[13px] text-gray-600 leading-snug">
                      {ticket.description}
                    </p>
                    {ticket.note && (
                      <p className="mt-1 text-[12px] text-gray-500 leading-snug">
                        {ticket.note}
                      </p>
                    )}
                  </div>

                  {!hasQty ? (
                    <button
                      disabled={plusDisabled}
                      onClick={() => !plusDisabled && setQty(ticket.id, 1)}
                      className={`mt-1 h-9 min-w-[70px] rounded-lg text-xs font-semibold uppercase tracking-wide ${
                        plusDisabled
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-[#111827] text-white"
                      }`}
                    >
                      Add
                    </button>
                  ) : (
                    <div className="mt-1 flex items-center rounded-full bg-[#111827] text-white px-3 py-1.5 text-sm font-medium min-w-[96px] justify-between">
                      <button
                        onClick={() => setQty(ticket.id, qty - 1)}
                        className="px-1"
                      >
                        –
                      </button>
                      <span>{qty}</span>
                      <button
                        disabled={plusDisabled}
                        onClick={() => setQty(ticket.id, qty + 1)}
                        className={`px-1 ${
                          plusDisabled
                            ? "opacity-40 cursor-not-allowed"
                            : "opacity-100"
                        }`}
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      </div>

      {/* Bottom summary bar */}
      <div className="fixed inset-x-0 bottom-0 border-t border-gray-300 bg-white/95 backdrop-blur-sm">
        <div className="max-w-xl mx-auto flex items-center justify-between px-4 py-3 gap-3">
          <div className="flex-1 text-xs">
            {hasSelection ? (
              <>
                <div className="font-semibold">
                  {summary.totalTickets} ticket
                  {summary.totalTickets > 1 ? "s" : ""} selected
                </div>
                <div className="text-gray-500">
                  {dateLabel} • {time}
                </div>
              </>
            ) : (
              <div className="text-gray-500">
                Add one or more tickets to continue
              </div>
            )}
          </div>
          <button
            disabled={!hasSelection || isSubmitting}
            onClick={handleConfirm}
            className={`rounded-xl px-5 py-2 text-xs font-semibold uppercase tracking-wide ${
              hasSelection && !isSubmitting
                ? "bg-[#111827] text-white"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isSubmitting
              ? "Booking..."
              : hasSelection
              ? `Pay ₹${summary.totalAmount}`
              : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}