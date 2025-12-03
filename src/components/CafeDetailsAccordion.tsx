// src/components/CafeDetailsAccordion.tsx
"use client";

import { useState } from "react";

type CafeDetailsAccordionProps = {
  opening_hours?: string | null;
  peak_hours?: string | null;
  popular_games?: string | null;
  offers?: string | null;
  monitor_details?: string | null;
  processor_details?: string | null;
  gpu_details?: string | null;
  ram_details?: string | null;
  ssd_details?: string | null;
  accessories_details?: string | null;
  screen_size?: string | null;
};

type SectionId = "highlights" | "device" | null;

export default function CafeDetailsAccordion(props: CafeDetailsAccordionProps) {
  const [openSection, setOpenSection] = useState<SectionId>("highlights");

  const toggle = (id: SectionId) =>
    setOpenSection((current) => (current === id ? null : id));

  const hasHighlights =
    props.opening_hours ||
    props.peak_hours ||
    props.popular_games ||
    props.offers;

  const hasDeviceSpecs =
    props.monitor_details ||
    props.processor_details ||
    props.gpu_details ||
    props.ram_details ||
    props.ssd_details ||
    props.accessories_details ||
    props.screen_size;

  if (!hasHighlights && !hasDeviceSpecs) return null;

  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900">
      <div className="flex items-center justify-between px-4 py-3 sm:px-5">
        <h2 className="text-base font-semibold md:text-lg">Café details</h2>
      </div>

      {/* Top highlights */}
      {hasHighlights && (
        <div className="border-t border-neutral-800">
          <button
            type="button"
            onClick={() => toggle("highlights")}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm sm:px-5"
          >
            <span className="font-medium text-gray-100">Top highlights</span>
            <span className="text-xs text-gray-400">
              {openSection === "highlights" ? "▲" : "▼"}
            </span>
          </button>

          {openSection === "highlights" && (
            <div className="space-y-2 px-4 pb-4 text-xs text-gray-300 sm:px-5 sm:text-sm">
              {props.opening_hours && (
                <p>
                  <span className="font-semibold">⏰ Opening hours: </span>
                  {props.opening_hours}
                </p>
              )}
              {props.peak_hours && (
                <p>
                  <span className="font-semibold">🔥 Peak hours: </span>
                  {props.peak_hours}
                </p>
              )}
              {props.popular_games && (
                <p>
                  <span className="font-semibold">🎮 Popular games: </span>
                  {props.popular_games}
                </p>
              )}
              {props.offers && (
                <p>
                  <span className="font-semibold">🏷️ Offers: </span>
                  {props.offers}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Device specifications */}
      {hasDeviceSpecs && (
        <div className="border-t border-neutral-800">
          <button
            type="button"
            onClick={() => toggle("device")}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm sm:px-5"
          >
            <span className="font-medium text-gray-100">
              Device specifications
            </span>
            <span className="text-xs text-gray-400">
              {openSection === "device" ? "▲" : "▼"}
            </span>
          </button>

          {openSection === "device" && (
            <div className="grid grid-cols-1 gap-x-6 gap-y-2 px-4 pb-4 text-xs text-gray-300 sm:grid-cols-2 sm:px-5 sm:text-sm">
              {props.monitor_details && (
                <SpecRow label="Monitor" value={props.monitor_details} />
              )}
              {props.processor_details && (
                <SpecRow label="Processor" value={props.processor_details} />
              )}
              {props.gpu_details && (
                <SpecRow label="Graphic card" value={props.gpu_details} />
              )}
              {props.ram_details && (
                <SpecRow label="RAM" value={props.ram_details} />
              )}
              {props.ssd_details && (
                <SpecRow label="SSD" value={props.ssd_details} />
              )}
              {props.accessories_details && (
                <SpecRow label="Accessories" value={props.accessories_details} />
              )}
              {props.screen_size && (
                <SpecRow label="Screen size" value={props.screen_size} />
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-400">{label}</span>
      <span className="flex-1 text-right text-gray-200">{value}</span>
    </div>
  );
}