const INDIA_TIME_ZONE = "Asia/Kolkata";

type BookingSessionInput = {
  bookingDate?: string | null;
  duration?: number | null;
  now?: Date;
  startTime?: string | null;
};

type IndiaNowContext = {
  currentMinutes: number;
  todayStr: string;
  yesterdayStr: string;
};

export function getIndiaDateString(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: INDIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Failed to format India date");
  }

  return `${year}-${month}-${day}`;
}

export function getIndiaDateDaysAgo(daysAgo: number, baseDate: Date = new Date()): string {
  const date = new Date(baseDate);
  date.setDate(date.getDate() - daysAgo);
  return getIndiaDateString(date);
}

export function getIndiaTimeString(date: Date, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: INDIA_TIME_ZONE,
    ...(options || {}),
  }).format(date);
}

export function getIndiaCurrentMinutes(now: Date = new Date()): number {
  const timeParts = new Intl.DateTimeFormat("en-US", {
    timeZone: INDIA_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const hours = Number(timeParts.find((part) => part.type === "hour")?.value ?? "0");
  const minutes = Number(timeParts.find((part) => part.type === "minute")?.value ?? "0");
  return hours * 60 + minutes;
}

export function parseFlexibleTimeToMinutes(timeStr?: string | null): number | null {
  if (!timeStr) return null;

  const match = timeStr.trim().match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
  if (!match) return null;

  let hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  const period = match[3]?.toLowerCase();

  if (period === "pm" && hours !== 12) {
    hours += 12;
  } else if (period === "am" && hours === 12) {
    hours = 0;
  }

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
}

function getIndiaNowContext(now: Date = new Date()): IndiaNowContext {
  return {
    todayStr: getIndiaDateString(now),
    yesterdayStr: getIndiaDateDaysAgo(1, now),
    currentMinutes: getIndiaCurrentMinutes(now),
  };
}

export function getBookingSessionState({
  bookingDate,
  duration,
  now = new Date(),
  startTime,
}: BookingSessionInput) {
  const { currentMinutes, todayStr, yesterdayStr } = getIndiaNowContext(now);
  const startMinutes = parseFlexibleTimeToMinutes(startTime);
  const safeDuration = Number(duration || 0);
  const endMinutes =
    startMinutes !== null && Number.isFinite(safeDuration) && safeDuration > 0
      ? startMinutes + safeDuration
      : null;
  const crossesMidnight = endMinutes !== null && endMinutes > 1440;

  let isActive = false;
  let hasEnded = false;
  let hasStarted = false;

  if (bookingDate) {
    if (bookingDate < yesterdayStr) {
      hasStarted = true;
      hasEnded = true;
    } else if (startMinutes !== null && endMinutes !== null && bookingDate === todayStr) {
      hasStarted = currentMinutes >= startMinutes;
      isActive = currentMinutes >= startMinutes && currentMinutes < endMinutes;
      hasEnded = hasStarted && currentMinutes >= endMinutes;
    } else if (startMinutes !== null && endMinutes !== null && bookingDate === yesterdayStr) {
      hasStarted = true;

      if (crossesMidnight) {
        const carryoverEnd = endMinutes - 1440;
        isActive = currentMinutes < carryoverEnd;
        hasEnded = currentMinutes >= carryoverEnd;
      } else {
        hasEnded = true;
      }
    } else if (bookingDate === yesterdayStr) {
      hasStarted = true;
      hasEnded = true;
    }
  }

  return {
    crossesMidnight,
    currentMinutes,
    endMinutes,
    hasEnded,
    hasStarted,
    isActive,
    startMinutes,
    todayStr,
    yesterdayStr,
  };
}

export function isBookingSessionActiveNow(input: BookingSessionInput): boolean {
  return getBookingSessionState(input).isActive;
}

export function hasBookingSessionEnded(input: BookingSessionInput): boolean {
  return getBookingSessionState(input).hasEnded;
}
