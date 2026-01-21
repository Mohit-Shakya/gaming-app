'use client';

import { BookingRow } from '@/types/database';
import { StatCard } from './ui';
import { Card } from './ui';
import { TrendingUp, Users, Clock, Calendar, DollarSign } from 'lucide-react';

interface DashboardStatsProps {
    bookings: any[];
    subscriptions: any[];
    activeTimers: Map<string, any>;
    loadingData: boolean;
    isMobile: boolean;
}

export function DashboardStats({
    bookings,
    subscriptions,
    activeTimers,
    loadingData,
    isMobile,
}: DashboardStatsProps) {
    // Logic for Active Now
    const activeBookingsCount = bookings.filter(
        (b) =>
            b.status === 'in-progress' &&
            b.booking_date === new Date().toISOString().split('T')[0]
    ).length;

    const activeSubscriptionsCount = subscriptions.filter((sub) =>
        activeTimers.has(sub.id)
    ).length;

    const activeNow = activeBookingsCount + activeSubscriptionsCount;

    // Logic for Today's Revenue - Exclude cancelled bookings
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayBookings = bookings.filter((b) =>
        b.booking_date === todayStr && b.status !== 'cancelled'
    );
    const todaySubscriptions = subscriptions.filter((sub) => {
        const purchaseDate = sub.purchase_date
            ? new Date(sub.purchase_date).toISOString().slice(0, 10)
            : null;
        return purchaseDate === todayStr;
    });

    const cashRevenue = todayBookings
        .filter((b) => b.payment_mode?.toLowerCase() === 'cash')
        .reduce((sum, b) => sum + (b.total_amount || 0), 0);

    const onlineRevenue = todayBookings
        .filter((b) => {
            const mode = b.payment_mode?.toLowerCase();
            return mode === 'online' || mode === 'upi';
        })
        .reduce((sum, b) => sum + (b.total_amount || 0), 0);

    const membershipRevenue = todaySubscriptions.reduce(
        (sum, sub) => sum + (parseFloat(sub.amount_paid) || 0),
        0
    );

    const totalRevenue = cashRevenue + onlineRevenue + membershipRevenue;

    // Logic for Today's Sessions - Count all including cancelled for reference
    const todaySessions = bookings.filter((b) =>
        b.booking_date === todayStr && b.status !== 'cancelled'
    ).length;

    return (
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8`}>
            {/* Active Now Card */}
            <StatCard
                title="Active Now"
                value={loadingData ? '...' : activeNow}
                icon="▶️"
                gradient="radial-gradient(circle at top right, rgba(239, 68, 68, 0.15), transparent 70%), linear-gradient(135deg, rgba(30, 41, 59, 0.4), rgba(15, 23, 42, 0.6))"
                color="#ef4444"
                isMobile={isMobile}
            />

            {/* Today's Revenue Card */}
            <StatCard
                title="Today's Revenue"
                value={`₹${loadingData ? '...' : totalRevenue}`}
                subtitle={`Cash: ₹${cashRevenue} • Online: ₹${onlineRevenue} • Memberships: ₹${membershipRevenue}`}
                icon="₹"
                gradient="radial-gradient(circle at top right, rgba(34, 197, 94, 0.15), transparent 70%), linear-gradient(135deg, rgba(30, 41, 59, 0.4), rgba(15, 23, 42, 0.6))"
                color="#22c55e"
                isMobile={isMobile}
            />

            {/* Today's Sessions Card */}
            <StatCard
                title="Today's Sessions"
                value={loadingData ? '...' : todaySessions}
                icon="🕐"
                gradient="radial-gradient(circle at top right, rgba(249, 115, 22, 0.15), transparent 70%), linear-gradient(135deg, rgba(30, 41, 59, 0.4), rgba(15, 23, 42, 0.6))"
                color="#f97316"
                isMobile={isMobile}
            />
        </div>
    );
}
