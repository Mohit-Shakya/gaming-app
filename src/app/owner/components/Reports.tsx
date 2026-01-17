'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, Button, Select, StatCard } from './ui';
import { supabase } from '@/lib/supabaseClient';
import {
    TrendingUp,
    TrendingDown,
    Clock,
    Download,
    ArrowUpRight,
    CreditCard,
    Banknote,
    Gamepad2,
    Calendar,
    X,
} from 'lucide-react';

interface ReportsProps {
    cafeId: string;
    isMobile: boolean;
}

interface BookingItem {
    console: string;
    quantity: number;
}

interface BookingData {
    id: string;
    total_amount: number;
    created_at: string;
    booking_date: string;
    status: string;
    payment_mode: string;
    start_time?: string;
    booking_items?: BookingItem[];
    customer_name?: string;
}

interface PreviousBookingData {
    id: string;
    total_amount: number;
    booking_date: string;
    status: string;
    payment_mode: string;
}

export function Reports({ cafeId, isMobile }: ReportsProps) {
    const [dateRange, setDateRange] = useState('7d');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [showCustomPicker, setShowCustomPicker] = useState(false);
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState<BookingData[]>([]);
    const [previousBookings, setPreviousBookings] = useState<PreviousBookingData[]>([]);

    // Fetch data based on range
    useEffect(() => {
        fetchReportsData();
    }, [dateRange, cafeId, customStart, customEnd]);

    const getDateRange = (range: string) => {
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);
        let startDate = todayStr;
        let endDate = todayStr;
        let prevStartDate = todayStr;
        let prevEndDate = todayStr;

        if (range === 'today') {
            startDate = todayStr;
            endDate = todayStr;
            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);
            prevStartDate = yesterday.toISOString().slice(0, 10);
            prevEndDate = prevStartDate;
        } else if (range === 'yesterday') {
            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);
            startDate = yesterday.toISOString().slice(0, 10);
            endDate = startDate;
            const dayBefore = new Date(now);
            dayBefore.setDate(now.getDate() - 2);
            prevStartDate = dayBefore.toISOString().slice(0, 10);
            prevEndDate = prevStartDate;
        } else if (range === '7d') {
            const sevenDaysAgo = new Date(now);
            sevenDaysAgo.setDate(now.getDate() - 6);
            startDate = sevenDaysAgo.toISOString().slice(0, 10);
            endDate = todayStr;
            const fourteenDaysAgo = new Date(now);
            fourteenDaysAgo.setDate(now.getDate() - 13);
            prevStartDate = fourteenDaysAgo.toISOString().slice(0, 10);
            const eightDaysAgo = new Date(now);
            eightDaysAgo.setDate(now.getDate() - 7);
            prevEndDate = eightDaysAgo.toISOString().slice(0, 10);
        } else if (range === '30d') {
            const thirtyDaysAgo = new Date(now);
            thirtyDaysAgo.setDate(now.getDate() - 29);
            startDate = thirtyDaysAgo.toISOString().slice(0, 10);
            endDate = todayStr;
            const sixtyDaysAgo = new Date(now);
            sixtyDaysAgo.setDate(now.getDate() - 59);
            prevStartDate = sixtyDaysAgo.toISOString().slice(0, 10);
            const thirtyOneDaysAgo = new Date(now);
            thirtyOneDaysAgo.setDate(now.getDate() - 30);
            prevEndDate = thirtyOneDaysAgo.toISOString().slice(0, 10);
        } else if (range === 'month') {
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            startDate = firstDay.toISOString().slice(0, 10);
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            endDate = lastDay.toISOString().slice(0, 10);
            const prevFirstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            prevStartDate = prevFirstDay.toISOString().slice(0, 10);
            const prevLastDay = new Date(now.getFullYear(), now.getMonth(), 0);
            prevEndDate = prevLastDay.toISOString().slice(0, 10);
        } else if (range === 'custom' && customStart) {
            startDate = customStart;
            endDate = customEnd || customStart;
            // For custom, calculate same duration previous period
            const start = new Date(customStart);
            const end = new Date(customEnd || customStart);
            const duration = end.getTime() - start.getTime();
            const prevEnd = new Date(start.getTime() - 1);
            const prevStart = new Date(prevEnd.getTime() - duration);
            prevStartDate = prevStart.toISOString().slice(0, 10);
            prevEndDate = prevEnd.toISOString().slice(0, 10);
        }

        return { startDate, endDate, prevStartDate, prevEndDate };
    };

    const fetchReportsData = async () => {
        setLoading(true);
        try {
            const { startDate, endDate, prevStartDate, prevEndDate } = getDateRange(dateRange);

            console.log('[Reports] Fetching data:', { cafeId, startDate, endDate });

            // Fetch current period - booking_items is a relation, use proper syntax
            const { data: currentData, error: currentError } = await supabase
                .from('bookings')
                .select(`
                    id, 
                    total_amount, 
                    created_at, 
                    booking_date, 
                    status, 
                    payment_mode, 
                    start_time, 
                    customer_name,
                    booking_items (
                        console,
                        quantity
                    )
                `)
                .eq('cafe_id', cafeId)
                .neq('status', 'cancelled')
                .gte('booking_date', startDate)
                .lte('booking_date', endDate)
                .order('booking_date', { ascending: true });

            if (currentError) {
                console.error('[Reports] Query error:', currentError);
                throw currentError;
            }

            console.log('[Reports] Fetched', currentData?.length || 0, 'bookings');
            setBookings(currentData || []);

            // Fetch previous period for comparison
            const { data: prevData } = await supabase
                .from('bookings')
                .select('id, total_amount, booking_date, status, payment_mode')
                .eq('cafe_id', cafeId)
                .neq('status', 'cancelled')
                .gte('booking_date', prevStartDate)
                .lte('booking_date', prevEndDate);

            setPreviousBookings(prevData || []);

        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    // --- Analytics Calculations ---
    const stats = useMemo(() => {
        const totalRevenue = bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
        const totalBookings = bookings.length;
        const avgOrderValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

        // Previous period stats
        const prevRevenue = previousBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
        const prevBookings = previousBookings.length;
        const prevAov = prevBookings > 0 ? prevRevenue / prevBookings : 0;

        // Calculate percentage changes
        const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
        const bookingsChange = prevBookings > 0 ? ((totalBookings - prevBookings) / prevBookings) * 100 : 0;
        const aovChange = prevAov > 0 ? ((avgOrderValue - prevAov) / prevAov) * 100 : 0;

        return {
            revenue: totalRevenue,
            count: totalBookings,
            aov: avgOrderValue,
            revenueChange,
            bookingsChange,
            aovChange,
        };
    }, [bookings, previousBookings]);

    // --- Chart Data Preparation ---

    // 1. Revenue over time
    const revenueTrendData = useMemo(() => {
        const daily: Record<string, number> = {};
        bookings.forEach(b => {
            const dateObj = new Date(b.booking_date);
            const date = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            daily[date] = (daily[date] || 0) + (b.total_amount || 0);
        });
        return Object.entries(daily).map(([date, amount]) => ({ date, amount }));
    }, [bookings]);

    const maxRevenue = Math.max(...revenueTrendData.map(d => d.amount), 100);

    // 2. Peak Hours
    const peakHoursData = useMemo(() => {
        const hourly = new Array(24).fill(0);
        bookings.forEach(b => {
            if (b.start_time) {
                const parts = b.start_time.split(':');
                if (parts.length >= 1) {
                    const hour = parseInt(parts[0], 10);
                    if (!isNaN(hour) && hour >= 0 && hour < 24) {
                        hourly[hour]++;
                    }
                }
            } else {
                const hour = new Date(b.created_at).getHours();
                hourly[hour]++;
            }
        });
        return hourly;
    }, [bookings]);

    const maxHourly = Math.max(...peakHoursData, 5);

    // 3. Payment Method Breakdown
    const paymentData = useMemo(() => {
        const methods: Record<string, { count: number; amount: number }> = {
            cash: { count: 0, amount: 0 },
            online: { count: 0, amount: 0 },
            upi: { count: 0, amount: 0 },
            card: { count: 0, amount: 0 },
        };

        bookings.forEach(b => {
            const mode = (b.payment_mode || 'cash').toLowerCase();
            if (mode === 'cash') {
                methods.cash.count++;
                methods.cash.amount += b.total_amount || 0;
            } else if (mode === 'upi') {
                methods.upi.count++;
                methods.upi.amount += b.total_amount || 0;
            } else if (mode === 'card') {
                methods.card.count++;
                methods.card.amount += b.total_amount || 0;
            } else {
                methods.online.count++;
                methods.online.amount += b.total_amount || 0;
            }
        });

        const total = bookings.length || 1;
        return {
            cash: { ...methods.cash, percent: (methods.cash.count / total) * 100 },
            online: { ...methods.online, percent: (methods.online.count / total) * 100 },
            upi: { ...methods.upi, percent: (methods.upi.count / total) * 100 },
            card: { ...methods.card, percent: (methods.card.count / total) * 100 },
        };
    }, [bookings]);

    // 4. Console Popularity
    const consoleData = useMemo(() => {
        const consoles: Record<string, { count: number; revenue: number }> = {};

        bookings.forEach(b => {
            if (b.booking_items && Array.isArray(b.booking_items)) {
                b.booking_items.forEach((item: BookingItem) => {
                    const consoleName = item.console || 'Unknown';
                    const qty = item.quantity || 1;
                    if (!consoles[consoleName]) {
                        consoles[consoleName] = { count: 0, revenue: 0 };
                    }
                    consoles[consoleName].count += qty;
                    // Approximate revenue per item (split evenly)
                    const itemRevenue = (b.total_amount || 0) / (b.booking_items?.length || 1);
                    consoles[consoleName].revenue += itemRevenue;
                });
            }
        });

        return Object.entries(consoles)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5); // Top 5
    }, [bookings]);

    const maxConsoleCount = Math.max(...consoleData.map(c => c.count), 1);

    // Export to CSV
    const exportToCSV = () => {
        const headers = ['Date', 'Time', 'Customer', 'Amount', 'Payment Mode', 'Status', 'Consoles'];
        const rows = bookings.map(b => [
            b.booking_date,
            b.start_time || 'N/A',
            b.customer_name || 'Walk-in',
            b.total_amount,
            b.payment_mode || 'Cash',
            b.status,
            b.booking_items?.map(i => `${i.quantity}x ${i.console}`).join(', ') || 'N/A'
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `reports_${dateRange}_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Format console names
    const formatConsoleName = (name: string) => {
        const nameMap: Record<string, string> = {
            'ps5': 'PlayStation 5',
            'ps4': 'PlayStation 4',
            'xbox': 'Xbox Series',
            'pc': 'Gaming PC',
            'vr': 'VR Headset',
            'steering': 'Racing Sim',
            'steering_wheel': 'Racing Sim',
        };
        return nameMap[name.toLowerCase()] || name.charAt(0).toUpperCase() + name.slice(1);
    };

    // Growth indicator component
    const GrowthIndicator = ({ value, suffix = '%' }: { value: number; suffix?: string }) => {
        if (value === 0) return <span className="text-slate-500 text-xs">No change</span>;
        const isPositive = value > 0;
        return (
            <span className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {isPositive ? '+' : ''}{value.toFixed(1)}{suffix}
            </span>
        );
    };

    // Apply custom date range
    const applyCustomRange = () => {
        if (customStart) {
            setDateRange('custom');
            setShowCustomPicker(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Reports & Analytics</h1>
                    <p className="text-slate-400 mt-1">Insights into your venue's performance</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-xl border border-slate-800">
                        <Select
                            value={dateRange}
                            onChange={(val) => {
                                if (val === 'custom') {
                                    setShowCustomPicker(true);
                                } else {
                                    setDateRange(val);
                                }
                            }}
                            options={[
                                { label: 'Today', value: 'today' },
                                { label: 'Yesterday', value: 'yesterday' },
                                { label: 'Last 7 Days', value: '7d' },
                                { label: 'Last 30 Days', value: '30d' },
                                { label: 'This Month', value: 'month' },
                                { label: 'Custom Range', value: 'custom' },
                            ]}
                            className="w-40 border-none bg-transparent"
                        />
                        <Button
                            variant="ghost"
                            className="h-9 w-9 p-0 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                            onClick={exportToCSV}
                            title="Export to CSV"
                        >
                            <Download size={18} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Custom Date Range Picker Modal */}
            {showCustomPicker && (
                <Card className="relative animate-in slide-in-from-top-2 duration-200">
                    <button
                        onClick={() => setShowCustomPicker(false)}
                        className="absolute top-4 right-4 p-1 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X size={18} className="text-slate-400" />
                    </button>
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar size={20} className="text-emerald-500" />
                        <h3 className="text-lg font-semibold text-white">Custom Date Range</h3>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <label className="block text-sm text-slate-400 mb-2">Start Date</label>
                            <input
                                type="date"
                                value={customStart}
                                onChange={(e) => setCustomStart(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm text-slate-400 mb-2">End Date</label>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={(e) => setCustomEnd(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                            />
                        </div>
                        <div className="flex items-end">
                            <Button variant="primary" onClick={applyCustomRange} disabled={!customStart}>
                                Apply Range
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Key Metrics Grid with Growth Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card padding="lg" className="bg-gradient-to-br from-slate-900 to-slate-900/50 border-slate-800">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-400 mb-1">Total Revenue</p>
                            <p className="text-3xl font-bold text-white">₹{stats.revenue.toLocaleString()}</p>
                            <p className="text-xs text-slate-500 mt-1">{bookings.length} transactions</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                                <TrendingUp size={20} />
                            </div>
                            <GrowthIndicator value={stats.revenueChange} />
                        </div>
                    </div>
                </Card>

                <Card padding="lg" className="bg-gradient-to-br from-slate-900 to-slate-900/50 border-slate-800">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-400 mb-1">Total Bookings</p>
                            <p className="text-3xl font-bold text-white">{stats.count}</p>
                            <p className="text-xs text-slate-500 mt-1">Confirmed sessions</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                                <Calendar size={20} />
                            </div>
                            <GrowthIndicator value={stats.bookingsChange} />
                        </div>
                    </div>
                </Card>

                <Card padding="lg" className="bg-gradient-to-br from-slate-900 to-slate-900/50 border-slate-800">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-400 mb-1">Avg. Order Value</p>
                            <p className="text-3xl font-bold text-white">₹{Math.round(stats.aov)}</p>
                            <p className="text-xs text-slate-500 mt-1">Per booking</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                                <Banknote size={20} />
                            </div>
                            <GrowthIndicator value={stats.aovChange} />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Charts Section - Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Trend Chart */}
                <Card className="min-h-[300px] flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <TrendingUp size={20} className="text-emerald-500" />
                                Revenue Trend
                            </h3>
                            <p className="text-sm text-slate-400">Daily earnings based on service date</p>
                        </div>
                    </div>

                    <div className="flex-1 w-full h-full relative flex items-end justify-between gap-2 px-2 pb-2">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-500">Loading chart...</div>
                        ) : revenueTrendData.length === 0 ? (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-500">No data available</div>
                        ) : (
                            revenueTrendData.map((d, i) => {
                                const heightPercent = (d.amount / maxRevenue) * 100;
                                return (
                                    <div key={i} className="flex flex-col items-center gap-2 group flex-1">
                                        <div
                                            className="w-full bg-emerald-500/20 border-t-2 border-emerald-500 rounded-t-sm hover:bg-emerald-500/40 transition-all relative"
                                            style={{ height: `${Math.max(heightPercent, 2)}%` }}
                                        >
                                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-slate-700 pointer-events-none z-10">
                                                ₹{d.amount.toLocaleString()}
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-slate-500 rotate-0 truncate w-full text-center">{d.date}</span>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </Card>

                {/* Peak Hours Chart */}
                <Card className="min-h-[300px] flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Clock size={20} className="text-blue-500" />
                                Peak Hours
                            </h3>
                            <p className="text-sm text-slate-400">Based on booking start times</p>
                        </div>
                    </div>

                    <div className="flex-1 w-full relative flex items-end gap-1 px-2 pb-6">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-500">Loading chart...</div>
                        ) : (
                            peakHoursData.map((count, hour) => {
                                const heightPercent = (count / maxHourly) * 100;
                                const isBusy = heightPercent > 50;
                                return (
                                    <div key={hour} className="flex-1 flex flex-col items-center group h-full justify-end">
                                        <div
                                            className={`w-full rounded-t-sm transition-all relative ${isBusy ? 'bg-blue-500' : 'bg-slate-700'}`}
                                            style={{ height: `${Math.max(heightPercent, 5)}%`, opacity: isBusy ? 0.8 : 0.3 }}
                                        >
                                            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 text-[10px] text-white opacity-0 group-hover:opacity-100">
                                                {count}
                                            </div>
                                        </div>
                                        {hour % 3 === 0 && (
                                            <div className="absolute bottom-0 text-[10px] text-slate-500 transform translate-y-full">
                                                {hour}
                                            </div>
                                        )}
                                    </div>
                                )
                            })
                        )}
                        <div className="absolute bottom-0 w-full border-t border-slate-800"></div>
                    </div>
                    <p className="text-center text-xs text-slate-500 mt-4">24-Hour Distribution (00:00 - 23:00)</p>
                </Card>
            </div>

            {/* Charts Section - Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Payment Methods Breakdown */}
                <Card className="min-h-[280px]">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <CreditCard size={20} className="text-purple-500" />
                                Payment Methods
                            </h3>
                            <p className="text-sm text-slate-400">Breakdown by payment type</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-40 text-slate-500">Loading...</div>
                    ) : (
                        <div className="space-y-4">
                            {/* Cash */}
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                                    <Banknote size={18} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium text-white">Cash</span>
                                        <span className="text-sm text-slate-400">
                                            {paymentData.cash.count} ({paymentData.cash.percent.toFixed(0)}%)
                                        </span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-green-500 rounded-full transition-all duration-500"
                                            style={{ width: `${paymentData.cash.percent}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">₹{paymentData.cash.amount.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* UPI */}
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                                    <CreditCard size={18} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium text-white">UPI</span>
                                        <span className="text-sm text-slate-400">
                                            {paymentData.upi.count} ({paymentData.upi.percent.toFixed(0)}%)
                                        </span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-purple-500 rounded-full transition-all duration-500"
                                            style={{ width: `${paymentData.upi.percent}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">₹{paymentData.upi.amount.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Card */}
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                    <CreditCard size={18} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium text-white">Card</span>
                                        <span className="text-sm text-slate-400">
                                            {paymentData.card.count} ({paymentData.card.percent.toFixed(0)}%)
                                        </span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                            style={{ width: `${paymentData.card.percent}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">₹{paymentData.card.amount.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Online (Other) */}
                            {paymentData.online.count > 0 && (
                                <div className="flex items-center gap-4">
                                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                                        <CreditCard size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-medium text-white">Online</span>
                                            <span className="text-sm text-slate-400">
                                                {paymentData.online.count} ({paymentData.online.percent.toFixed(0)}%)
                                            </span>
                                        </div>
                                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                                                style={{ width: `${paymentData.online.percent}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">₹{paymentData.online.amount.toLocaleString()}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Card>

                {/* Console Popularity */}
                <Card className="min-h-[280px]">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Gamepad2 size={20} className="text-pink-500" />
                                Console Popularity
                            </h3>
                            <p className="text-sm text-slate-400">Most booked gaming stations</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-40 text-slate-500">Loading...</div>
                    ) : consoleData.length === 0 ? (
                        <div className="flex items-center justify-center h-40 text-slate-500">No console data available</div>
                    ) : (
                        <div className="space-y-4">
                            {consoleData.map((console, index) => {
                                const colors = ['bg-pink-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500'];
                                const bgColors = ['bg-pink-500/10', 'bg-blue-500/10', 'bg-emerald-500/10', 'bg-amber-500/10', 'bg-purple-500/10'];
                                const textColors = ['text-pink-500', 'text-blue-500', 'text-emerald-500', 'text-amber-500', 'text-purple-500'];
                                const widthPercent = (console.count / maxConsoleCount) * 100;

                                return (
                                    <div key={console.name} className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${bgColors[index]} ${textColors[index]}`}>
                                            <Gamepad2 size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm font-medium text-white">{formatConsoleName(console.name)}</span>
                                                <span className="text-sm text-slate-400">{console.count} bookings</span>
                                            </div>
                                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${colors[index]} rounded-full transition-all duration-500`}
                                                    style={{ width: `${widthPercent}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">₹{Math.round(console.revenue).toLocaleString()} revenue</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>
            </div>

            {/* Recent Transactions Table */}
            <Card padding="none" className="overflow-hidden">
                <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-400 hover:text-white"
                        onClick={exportToCSV}
                    >
                        <Download size={16} className="mr-2" />
                        Export All
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                                <th className="px-6 py-4 font-medium">Date & Time</th>
                                <th className="px-6 py-4 font-medium">Customer</th>
                                <th className="px-6 py-4 font-medium">Amount</th>
                                <th className="px-6 py-4 font-medium">Payment</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {bookings.slice(-10).reverse().map((booking) => (
                                <tr key={booking.id} className="hover:bg-slate-800/20 transition-colors">
                                    <td className="px-6 py-4 text-white">
                                        <div className="font-medium">
                                            {new Date(booking.booking_date).toLocaleDateString()}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {booking.start_time || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-300">
                                        {booking.customer_name || 'Walk-in'}
                                    </td>
                                    <td className="px-6 py-4 text-white font-mono">
                                        ₹{booking.total_amount?.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-slate-300 capitalize">
                                        {booking.payment_mode || 'Cash'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${booking.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                booking.status === 'completed' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                    'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                            }`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                            <ArrowUpRight size={16} className="text-slate-500" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {bookings.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        No transactions found for this period.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
