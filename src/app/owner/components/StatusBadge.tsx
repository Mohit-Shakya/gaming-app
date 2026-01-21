import React from 'react';

type StatusBadgeProps = {
    status: string;
};

export default function StatusBadge({ status }: StatusBadgeProps) {
    const statusLower = status?.toLowerCase() || '';
    let background = "rgba(245, 158, 11, 0.15)";
    let color = "#f59e0b";

    if (statusLower === "confirmed") {
        background = "rgba(34, 197, 94, 0.15)";
        color = "#22c55e";
    } else if (statusLower === "cancelled") {
        background = "rgba(239, 68, 68, 0.15)";
        color = "#ef4444";
    } else if (statusLower === "completed") {
        background = "rgba(59, 130, 246, 0.15)";
        color = "#3b82f6";
    }

    return (
        <span
            style={{
                padding: "4px 10px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 500,
                background,
                color,
                textTransform: "uppercase",
            }}
        >
            {status}
        </span>
    );
}
