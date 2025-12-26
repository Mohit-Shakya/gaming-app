// src/components/booking/ConsoleGrid.tsx
/**
 * Grid of console selection cards
 */

import { ConsoleId } from "@/lib/constants";
import { ConsoleAvailability, ConsolePricingTier } from "@/types/booking";
import { ConsoleCard, ConsoleCardData } from "./ConsoleCard";

interface ConsoleGridProps {
  consoles: ConsoleCardData[];
  availableConsoleIds: ConsoleId[];
  selectedConsole: ConsoleId;
  liveAvailability: Partial<Record<ConsoleId, ConsoleAvailability>>;
  consoleLimits: Partial<Record<ConsoleId, number>>;
  consolePricing: Partial<Record<ConsoleId, ConsolePricingTier>>;
  selectedDuration: 30 | 60 | 90;
  fallbackPrice: number;
  usedPerConsole: Partial<Record<ConsoleId, number>>;
  onSelectConsole: (consoleId: ConsoleId) => void;
}

export function ConsoleGrid({
  consoles,
  availableConsoleIds,
  selectedConsole,
  liveAvailability,
  consoleLimits,
  consolePricing,
  selectedDuration,
  fallbackPrice,
  usedPerConsole,
  onSelectConsole,
}: ConsoleGridProps) {
  return (
    <section style={{ marginBottom: "24px" }}>
      <h2
        style={{
          fontSize: "14px",
          fontWeight: 700,
          color: "#e0e0e0",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "12px",
          textTransform: "uppercase",
          letterSpacing: "1px",
        }}
        className="section-heading"
      >
        <span style={{ fontSize: "18px" }}>🎮</span>
        <span>Select Console</span>
      </h2>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          justifyContent: "flex-start",
        }}
        className="console-grid-container"
      >
        {availableConsoleIds.map((consoleId) => {
          const console = consoles.find((c) => c.id === consoleId);
          if (!console) return null;

          const isActive = consoleId === selectedConsole;
          const availability = liveAvailability[consoleId];
          const totalSlots = availability?.total ?? consoleLimits[consoleId] ?? 0;
          const availableSlots = availability?.available ?? totalSlots;
          const mySelection = usedPerConsole[consoleId] ?? 0;
          const isSoldOut = availableSlots <= 0 && mySelection === 0;
          const isLowStock = availableSlots <= 2 && availableSlots > 0;

          // Calculate price
          let price: number;
          if (selectedDuration === 90) {
            price =
              (consolePricing[consoleId]?.qty1_60min ?? fallbackPrice) +
              (consolePricing[consoleId]?.qty1_30min ?? fallbackPrice * 0.5);
          } else {
            price =
              consolePricing[consoleId]?.[
                `qty1_${selectedDuration}min` as keyof ConsolePricingTier
              ] ?? (selectedDuration === 30 ? fallbackPrice * 0.5 : fallbackPrice);
          }

          return (
            <ConsoleCard
              key={consoleId}
              console={console}
              isActive={isActive}
              isSoldOut={isSoldOut}
              isLowStock={isLowStock}
              availableSlots={availableSlots}
              totalSlots={totalSlots}
              mySelection={mySelection}
              price={price}
              onClick={() => !isSoldOut && onSelectConsole(consoleId)}
            />
          );
        })}
      </div>
    </section>
  );
}
