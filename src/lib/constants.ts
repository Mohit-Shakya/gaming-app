// Shared constants across the application

export type ConsoleId =
  | "ps5"
  | "ps4"
  | "xbox"
  | "pc"
  | "pool"
  | "arcade"
  | "snooker"
  | "vr"
  | "steering";

export const colors = {
  red: "#ff073a",
  cyan: "#00f0ff",
  dark: "#08080c",
  darkCard: "#0f0f14",
  darkerCard: "#07070c",
  border: "rgba(255, 255, 255, 0.08)",
  textPrimary: "#ffffff",
  textSecondary: "#9ca3af",
  textMuted: "#6b7280",
  green: "#22c55e",
  greenDark: "#16a34a",
  orange: "#f59e0b",
  purple: "#a855f7",
} as const;

export const fonts = {
  heading: "var(--font-orbitron)",
  body: "var(--font-rajdhani)",
} as const;

export const CONSOLE_DB_KEYS: Record<ConsoleId, string> = {
  ps5: "ps5_count",
  ps4: "ps4_count",
  xbox: "xbox_count",
  pc: "pc_count",
  pool: "pool_count",
  arcade: "arcade_count",
  snooker: "snooker_count",
  vr: "vr_count",
  steering: "steering_wheel_count",
} as const;

export const CONSOLE_LABELS: Record<ConsoleId, string> = {
  ps5: "PS5",
  ps4: "PS4",
  xbox: "Xbox",
  pc: "PC",
  pool: "Pool Table",
  arcade: "Arcade Machine",
  snooker: "Snooker",
  vr: "VR",
  steering: "Racing Setup",
} as const;

export const CONSOLE_ICONS: Record<ConsoleId, string> = {
  ps5: "🎮",
  ps4: "🎮",
  xbox: "🎮",
  pc: "💻",
  pool: "🎱",
  arcade: "🕹️",
  snooker: "🎱",
  vr: "🥽",
  steering: "🏎️",
} as const;

export const CONSOLE_COLORS: Record<ConsoleId, string> = {
  ps5: "#0070d1",
  ps4: "#003791",
  xbox: "#107c10",
  pc: "#ff073a",
  pool: "#8b4513",
  arcade: "#ff6b00",
  snooker: "#228b22",
  vr: "#9945ff",
  steering: "#e10600",
} as const;

// Booking constants
export const BOOKING_DURATION_MINUTES = 60;
export const OPEN_HOUR = 10;
export const CLOSE_HOUR = 24;
export const PEAK_START = 18;
export const PEAK_END = 22;
export const TIME_INTERVAL = 15;
