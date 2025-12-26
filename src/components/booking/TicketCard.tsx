// src/components/booking/TicketCard.tsx
/**
 * Ticket selection card with quantity controls
 */

import { colors, fonts } from "@/lib/constants";
import { TicketOption } from "@/types/booking";

interface TicketCardProps {
  ticket: TicketOption;
  quantity: number;
  canAdd: boolean;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}

export function TicketCard({
  ticket,
  quantity,
  canAdd,
  onAdd,
  onIncrement,
  onDecrement,
}: TicketCardProps) {
  const hasQuantity = quantity > 0;

  return (
    <div
      style={{
        padding: "16px",
        background: hasQuantity
          ? `linear-gradient(135deg, rgba(255, 7, 58, 0.1) 0%, ${colors.darkCard} 100%)`
          : colors.darkCard,
        borderRadius: "14px",
        border: hasQuantity
          ? `1px solid rgba(255, 7, 58, 0.3)`
          : `1px solid ${colors.border}`,
        transition: "all 0.2s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "15px",
              fontWeight: 600,
              color: colors.textPrimary,
              marginBottom: "6px",
            }}
          >
            {ticket.title}
          </div>
          <div
            style={{
              fontFamily: fonts.heading,
              fontSize: "22px",
              fontWeight: 700,
              color: colors.cyan,
              marginBottom: "8px",
            }}
          >
            ₹{ticket.price}
            <span
              style={{
                fontSize: "12px",
                color: colors.textMuted,
                fontFamily: fonts.body,
                fontWeight: 400,
              }}
            >
              {" "}
              /hr
            </span>
          </div>
          <p
            style={{
              fontSize: "13px",
              color: colors.textSecondary,
              lineHeight: 1.4,
            }}
          >
            {ticket.description}
          </p>
        </div>

        {!hasQuantity ? (
          <button
            disabled={!canAdd}
            onClick={onAdd}
            style={{
              padding: "10px 20px",
              minHeight: "44px",
              background: canAdd
                ? `linear-gradient(135deg, ${colors.red} 0%, #ff3366 100%)`
                : "rgba(255, 255, 255, 0.05)",
              border: "none",
              borderRadius: "10px",
              color: canAdd ? "white" : colors.textMuted,
              fontSize: "13px",
              fontWeight: 600,
              cursor: canAdd ? "pointer" : "not-allowed",
              transition: "all 0.2s ease",
            }}
            className="add-button"
          >
            Add
          </button>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0",
              background: colors.red,
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            <button
              onClick={onDecrement}
              style={{
                width: "36px",
                height: "36px",
                background: "transparent",
                border: "none",
                color: "white",
                fontSize: "18px",
                cursor: "pointer",
              }}
            >
              −
            </button>
            <span
              style={{
                width: "32px",
                textAlign: "center",
                fontFamily: fonts.heading,
                fontSize: "16px",
                fontWeight: 700,
                color: "white",
              }}
            >
              {quantity}
            </span>
            <button
              onClick={onIncrement}
              disabled={!canAdd}
              style={{
                width: "36px",
                height: "36px",
                background: "transparent",
                border: "none",
                color: "white",
                fontSize: "18px",
                cursor: canAdd ? "pointer" : "not-allowed",
                opacity: canAdd ? 1 : 0.5,
              }}
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
