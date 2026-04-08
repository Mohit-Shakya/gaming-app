'use client';

import { useEffect, useRef } from 'react';
import { ConsoleId, CONSOLE_ICONS } from '@/lib/constants';
import { isWalkInSource } from '@/lib/bookingFields';
import { getBookingSessionState, hasBookingSessionEnded, isBookingSessionActiveNow } from '@/lib/ownerBookingTiming';
import { Plus, MessageCircle, Banknote, Smartphone } from 'lucide-react';

interface SessionEndedInfo {
    customerName: string;
    stationName: string;
    duration: number;
}

interface ActiveSessionsProps {
    bookings: any[];
    subscriptions: any[];
    activeTimers: Map<string, any>;
    timerElapsed: Map<string, number>;
    currentTime: Date;
    isMobile: boolean;
    onAddItems?: (bookingId: string, customerName: string) => void;
    onSessionEnded?: (info: SessionEndedInfo) => void;
}

export function ActiveSessions({
    bookings,
    subscriptions,
    activeTimers,
    timerElapsed,
    currentTime,
    isMobile,
    onAddItems,
    onSessionEnded,
}: ActiveSessionsProps) {
    // Track sessions that have already triggered the ended callback
    const endedSessionsRef = useRef<Set<string>>(new Set());

    const getItemDuration = (booking: any) => {
        const item = booking.booking_items?.[0];
        const parsedDuration = Number.parseInt(item?.title || '', 10);
        return Number.isFinite(parsedDuration) && parsedDuration > 0 ? parsedDuration : booking.duration;
    };

    const getAssignedStation = (booking: any) => {
        const title = booking.booking_items?.[0]?.title;
        const stationPart = title?.split('|')[1]?.trim();
        if (!stationPart) return null;
        return stationPart.split(',')[0]?.trim().toUpperCase() || null;
    };

    const activeMemberships = subscriptions.filter((sub) =>
        activeTimers.has(sub.id)
    );

    // Flatten bookings so each booking_item appears as a separate session
    const flattenedBookings = bookings
        .filter((booking) => booking.status === 'in-progress')
        .flatMap((booking) => {
        const items = booking.booking_items || [];
        if (items.length <= 1) {
            return [booking];
        }
        // Multiple items - create a separate entry for each
        return items.map((item: any, itemIndex: number) => ({
            ...booking,
            id: `${booking.id}-item-${itemIndex}`,
            originalBookingId: booking.id,
            booking_items: [item],
        }));
    });

    const activeSessionBookings = flattenedBookings.filter((booking) =>
        isBookingSessionActiveNow({
            bookingDate: booking.booking_date,
            duration: getItemDuration(booking),
            now: currentTime,
            startTime: booking.start_time,
        })
    );

    // 2. Sort Active Bookings by Time Remaining
    const sortedActiveBookings = [...activeSessionBookings].sort((a, b) => {
        const getTimeRemaining = (booking: typeof a) => {
            const duration = getItemDuration(booking);
            const sessionState = getBookingSessionState({
                bookingDate: booking.booking_date,
                duration,
                now: currentTime,
                startTime: booking.start_time,
            });

            if (!sessionState.endMinutes) return 999;

            const currentPosition =
                booking.booking_date === sessionState.yesterdayStr && sessionState.crossesMidnight
                    ? sessionState.currentMinutes + 1440
                    : sessionState.currentMinutes;

            return Math.max(0, sessionState.endMinutes - currentPosition);
        };


        const timeA = getTimeRemaining(a);
        const timeB = getTimeRemaining(b);
        return timeA - timeB;
    });

    // Helper
    const getConsoleIcon = (consoleName: string) => {
        const key = consoleName?.toLowerCase() as ConsoleId;
        return CONSOLE_ICONS[key] || '🎮';
    };

    // Detect ended sessions — fires once per session when time runs out
    useEffect(() => {
        if (!onSessionEnded) return;

        flattenedBookings.forEach((booking) => {
            if (endedSessionsRef.current.has(booking.id)) return;

            const duration = getItemDuration(booking);
            if (!duration) return;

            if (hasBookingSessionEnded({
                bookingDate: booking.booking_date,
                duration,
                now: currentTime,
                startTime: booking.start_time,
            })) {
                const consoleInfo = booking.booking_items?.[0];
                const stationName = getAssignedStation(booking) || consoleInfo?.console?.toUpperCase() || 'UNKNOWN';
                const isWalkIn = isWalkInSource(booking.source);
                const customerName = isWalkIn ? booking.customer_name : (booking.user_name || 'Guest');
                endedSessionsRef.current.add(booking.id);
                onSessionEnded({ customerName, stationName, duration });
            }
        });
    }, [currentTime, flattenedBookings, onSessionEnded]);

    if (sortedActiveBookings.length === 0 && activeMemberships.length === 0) {
        return (
            <div className="bg-[#0f0f14] border border-[#ffffff14] rounded-2xl p-16 text-center">
                <div className="text-5xl opacity-30 mb-3">🎮</div>
                <p className="text-base text-[#9ca3af] mb-1 font-medium">No active sessions</p>
                <p className="text-sm text-[#6b7280]">Sessions in progress will appear here</p>
            </div>
        );
    }

    return (
        <div className={`grid grid-cols-1 ${isMobile ? '' : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'} gap-4 md:gap-5`}>
            {/* Active Membership Sessions */}
            {activeMemberships.map((sub: any) => {
                const planDetails = sub.membership_plans || {};
                const elapsedSeconds = timerElapsed.get(sub.id) || 0;
                const consoleType = planDetails.console_type?.toUpperCase() || 'UNKNOWN';
                const stationName = sub.assigned_console_station?.toUpperCase() || `${consoleType}-??`;

                const hours = Math.floor(elapsedSeconds / 3600);
                const minutes = Math.floor((elapsedSeconds % 3600) / 60);
                const seconds = elapsedSeconds % 60;
                const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

                return (
                    <div
                        key={sub.id}
                        className="flex flex-col justify-between bg-emerald-500/5 border-2 border-emerald-500/40 rounded-2xl p-5 min-h-[160px]"
                    >
                        <div>
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="text-xs text-[#6b7280] mb-1 font-semibold uppercase tracking-wide">
                                        {stationName}
                                    </p>
                                    <p className="text-base font-bold text-white mb-0">
                                        {sub.customer_name}
                                    </p>
                                    <p className="text-xs text-[#6b7280] mt-0.5">
                                        {planDetails.name || 'Membership'}
                                    </p>
                                </div>
                                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-500 rounded-xl text-xs font-semibold whitespace-nowrap">
                                    MEMBERSHIP
                                </span>
                            </div>
                        </div>

                        <div>
                            <div className="mb-3">
                                <p className="text-xs text-[#6b7280] mb-1">Session Time</p>
                                <p className="text-2xl font-bold text-emerald-500 m-0 font-mono">
                                    {timeString}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Regular Booking Sessions */}
            {sortedActiveBookings.map((booking, index) => {
                const consoleInfo = booking.booking_items?.[0];
                const isWalkIn = isWalkInSource(booking.source);

                // Calculate Time Remaining
                let timeRemaining = 0;
                let endTime = '';

                const itemDuration = getItemDuration(booking);

                if (booking.start_time && itemDuration) {
                    const sessionState = getBookingSessionState({
                        bookingDate: booking.booking_date,
                        duration: itemDuration,
                        now: currentTime,
                        startTime: booking.start_time,
                    });
                    const startMinutes = sessionState.startMinutes;
                    if (startMinutes !== null && sessionState.endMinutes !== null) {
                        const currentPosition =
                            booking.booking_date === sessionState.yesterdayStr && sessionState.crossesMidnight
                                ? sessionState.currentMinutes + 1440
                                : sessionState.currentMinutes;
                        timeRemaining = Math.max(0, sessionState.endMinutes - currentPosition);
                        const endTotalMinutes = (startMinutes + itemDuration) % 1440;
                        const endHours = Math.floor(endTotalMinutes / 60);
                        const endMins = endTotalMinutes % 60;
                        const endPeriod = endHours >= 12 ? 'pm' : 'am';
                        const endHours12 = endHours === 0 ? 12 : endHours > 12 ? endHours - 12 : endHours;
                        endTime = `${endHours12}:${endMins.toString().padStart(2, '0')} ${endPeriod}`;
                    }
                }

                // Station Name Logic — prefer assigned station from title (format: "60|PS5-02")
                const consoleType = consoleInfo?.console?.toUpperCase() || 'UNKNOWN';
                const assignedStation = getAssignedStation(booking);
                const sameTypeBookings = sortedActiveBookings.filter(
                    (b, i) => i <= index && b.booking_items?.[0]?.console === consoleInfo?.console
                );
                const stationNumber = sameTypeBookings.length;
                const stationName = assignedStation || `${consoleType}-${String(stationNumber).padStart(2, '0')}`;

                // Status Colors
                const isWarning = timeRemaining >= 15 && timeRemaining <= 30;
                const isHealthy = timeRemaining > 30;

                const bgColor = isHealthy ? 'bg-emerald-500/5' : isWarning ? 'bg-amber-500/5' : 'bg-red-500/5';
                const borderColor = isHealthy ? 'border-emerald-500/40' : isWarning ? 'border-amber-500/40' : 'border-red-500/40';
                const hoverShadow = isHealthy ? 'group-hover:shadow-[0_8px_24px_rgba(34,197,94,0.2)]' : isWarning ? 'group-hover:shadow-[0_8px_24px_rgba(251,191,36,0.2)]' : 'group-hover:shadow-[0_8px_24px_rgba(239,68,68,0.2)]';
                const badgeBg = isHealthy ? 'bg-emerald-500/20' : isWarning ? 'bg-amber-500/20' : 'bg-red-500/20';
                const badgeText = isHealthy ? 'text-emerald-500' : isWarning ? 'text-amber-500' : 'text-red-500';
                const badgeBorder = isHealthy ? 'border-emerald-500' : isWarning ? 'border-amber-500' : 'border-red-500';
                const timerColor = isHealthy ? 'text-emerald-500' : isWarning ? 'text-amber-500' : 'text-red-500';

                return (
                    <div
                        key={booking.id}
                        className={`group relative flex flex-col justify-between ${bgColor} border-2 ${borderColor} rounded-2xl p-5 min-h-[160px] transition-all duration-300 hover:-translate-y-1 ${hoverShadow} cursor-default overflow-hidden`}
                    >
                        {/* Badge */}
                        <div className={`absolute top-3 right-3 ${badgeBg} border ${badgeBorder} rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${badgeText}`}>
                            {isHealthy ? "ACTIVE" : isWarning ? "ENDING SOON" : "URGENT"}
                        </div>

                        {/* Header */}
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="text-3xl">
                                {getConsoleIcon(consoleInfo?.console || '')}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs text-[#6b7280] font-semibold uppercase tracking-wide">
                                    {stationName}
                                </div>
                                <div className="text-base font-bold text-white truncate">
                                    {isWalkIn ? booking.customer_name : (booking.user_name || 'Guest')}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    {/* Payment mode badge */}
                                    {booking.payment_mode && (
                                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#ffffff08] text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wide">
                                            {booking.payment_mode.toLowerCase() === 'cash'
                                                ? <Banknote size={10} />
                                                : <Smartphone size={10} />}
                                            {booking.payment_mode}
                                        </span>
                                    )}
                                    {/* WhatsApp button */}
                                    {(isWalkIn ? booking.customer_phone : booking.user_phone) && (
                                        <a
                                            href={`https://wa.me/${(isWalkIn ? booking.customer_phone : booking.user_phone)?.replace(/\D/g, '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-500/10 text-[10px] font-semibold text-green-400 hover:bg-green-500/20 transition-colors"
                                            title="Open WhatsApp"
                                        >
                                            <MessageCircle size={10} />
                                            WA
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Timer */}
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-xs text-[#6b7280] mb-0.5">Time Remaining</p>
                                <p className={`text-2xl font-bold font-mono ${timerColor}`}>
                                    {Math.floor(timeRemaining / 60)}h {timeRemaining % 60}m
                                </p>
                            </div>
                            <div className="flex items-end gap-3">
                                {onAddItems && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const originalId = booking.originalBookingId || booking.id;
                                            const customerName = isWalkIn ? booking.customer_name : (booking.user_name || 'Guest');
                                            onAddItems(originalId, customerName);
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-xs font-semibold transition-colors"
                                        title="Add F&B items"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Add Items
                                    </button>
                                )}
                                <div className="text-right">
                                    <p className="text-xs text-[#6b7280] mb-0.5">Ends At</p>
                                    <p className="text-sm font-semibold text-white">
                                        {endTime}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-[#ffffff10]">
                            <div
                                className={`h-full ${isHealthy ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ width: `${Math.min(100, (timeRemaining / (itemDuration || booking.duration || 60)) * 100)}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
