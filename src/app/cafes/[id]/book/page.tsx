// src/app/cafes/[id]/book/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";

type DayOption = {
  key: string; // yyyy-mm-dd
  label: string;
};

type TimeSlot = {
  label: string; // "10:00 am"
};

const OPEN_HOUR = 10; // 10am
const CLOSE_HOUR = 22; // 10pm

function buildNext3Days(): DayOption[] {
  const days: DayOption[] = [];
  const today = new Date();

  for (let i = 0; i < 3; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const key = d.toISOString().slice(0, 10); // yyyy-mm-dd
    const label = d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });

    days.push({ key, label });
  }
  return days;
}

function buildTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let hour = OPEN_HOUR; hour < CLOSE_HOUR; hour++) {
    for (let minutes of [0, 30]) {
      const d = new Date();
      d.setHours(hour, minutes, 0, 0);
      const label = d.toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      slots.push({ label });
    }
  }
  return slots;
}

const DAY_OPTIONS = buildNext3Days();
const TIME_SLOTS = buildTimeSlots();

export default function BookPage() {
  const router = useRouter();
  const params = useParams();

  // ✅ café id from URL /cafes/[id]/book
  const rawId = params?.id;
  const cafeId =
    typeof rawId === "string" && rawId !== "undefined" ? rawId : null;

  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(
    DAY_OPTIONS[0]?.key ?? null,
  );
  const [selectedTimeLabel, setSelectedTimeLabel] = useState<string | null>(
    TIME_SLOTS[0]?.label ?? null,
  );

  const dateLabel = useMemo(() => {
    if (!selectedDateKey) return "";
    const d = new Date(`${selectedDateKey}T00:00:00`);
    return d.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }, [selectedDateKey]);

  function goToTicketsPage() {
    if (!cafeId) {
      console.error(
        "BookPage: cafeId is missing or 'undefined', cannot go to tickets page",
      );
      return;
    }
    if (!selectedDateKey || !selectedTimeLabel) {
      console.error("BookPage: date or time not selected");
      return;
    }

    const url = `/cafes/${cafeId}/book/tickets?date=${encodeURIComponent(
      selectedDateKey,
    )}&time=${encodeURIComponent(selectedTimeLabel)}`;

    router.push(url);
  }

  return (
    <div className="min-h-screen bg-[#f4f5fb] text-[#111827]">
      <div className="max-w-xl mx-auto px-4 pb-28 pt-6">
        <header className="mb-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-[0.18em]">
            Choose Ticket
          </p>
          <h1 className="mt-1 text-lg font-semibold tracking-tight">
            Select date &amp; time
          </h1>
        </header>

        {/* Date selector */}
        <section className="mb-4">
          <h2 className="text-sm font-medium mb-2">Select Date</h2>
          <div className="flex gap-2">
            {DAY_OPTIONS.map((day) => {
              const active = day.key === selectedDateKey;
              return (
                <button
                  key={day.key}
                  onClick={() => setSelectedDateKey(day.key)}
                  className={`flex-1 rounded-xl border px-3 py-2 text-xs font-medium ${
                    active
                      ? "bg-[#111827] text-white border-[#111827]"
                      : "bg-white text-[#111827] border-gray-300"
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Time selector */}
        <section className="mb-4">
          <h2 className="text-sm font-medium mb-2">Select Time</h2>
          <div className="space-y-2">
            {TIME_SLOTS.map((slot) => {
              const active = slot.label === selectedTimeLabel;
              return (
                <button
                  key={slot.label}
                  onClick={() => setSelectedTimeLabel(slot.label)}
                  className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${
                    active
                      ? "bg-[#111827] text-white border-[#111827]"
                      : "bg-white text-[#111827] border-gray-200"
                  }`}
                >
                  <span>{slot.label}</span>
                  {active && <span className="text-[11px]">Selected</span>}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Bottom bar */}
      <div className="fixed inset-x-0 bottom-0 border-t border-gray-300 bg-white/95 backdrop-blur-sm">
        <div className="max-w-xl mx-auto flex items-center justify-between px-4 py-3 gap-3">
          <div className="text-xs">
            <div className="font-semibold">{dateLabel || "Select a date"}</div>
            <div className="text-gray-500">
              {selectedTimeLabel || "Select a time"}
            </div>
          </div>
          <button
            onClick={goToTicketsPage}
            disabled={!cafeId || !selectedDateKey || !selectedTimeLabel}
            className={`rounded-xl px-5 py-2 text-xs font-semibold uppercase tracking-wide ${
              cafeId && selectedDateKey && selectedTimeLabel
                ? "bg-[#111827] text-white"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
