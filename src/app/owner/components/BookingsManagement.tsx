import { useState, useMemo } from 'react';
import { BookingsTable } from './BookingsTable';
import { Card, Button, Input, Select, StatusBadge } from './ui';
import { Download, Filter, RefreshCw, Calendar, Search, DollarSign, Hash, TrendingUp, CheckCircle } from 'lucide-react';
import { BookingRow } from '@/types/database';

interface BookingsManagementProps {
    bookings: any[]; // Using any[] to be safe with Supabase types, ideally BookingRow
    loading?: boolean;
    onUpdateStatus: (bookingId: string, status: string) => Promise<void>;
    onEdit?: (booking: any) => void;
    onRefresh?: () => void;
    isMobile?: boolean;
}

export function BookingsManagement({ bookings, loading, onUpdateStatus, onEdit, onRefresh, isMobile }: BookingsManagementProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sourceFilter, setSourceFilter] = useState('all');
    const [dateRange, setDateRange] = useState('all');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    // Filter Logic
    const filteredBookings = useMemo(() => {
        return bookings.filter(b => {
            // Search
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm ||
                (b.customer_name?.toLowerCase().includes(searchLower)) ||
                (b.customer_phone?.includes(searchTerm)) ||
                (b.id?.toLowerCase().includes(searchLower));

            // Status
            const matchesStatus = statusFilter === 'all' || b.status === statusFilter;

            // Source
            const matchesSource = sourceFilter === 'all' ||
                (sourceFilter === 'online' && (!b.source || b.source === 'online_booking')) ||
                (sourceFilter === 'walk-in' && b.source === 'walk_in');

            // Date Range
            let matchesDate = true;
            if (dateRange !== 'all') {
                const bookingDate = new Date(b.booking_date);
                bookingDate.setHours(0, 0, 0, 0);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (dateRange === 'today') {
                    matchesDate = bookingDate.getTime() === today.getTime();
                } else if (dateRange === 'tomorrow') {
                    const tomorrow = new Date(today);
                    tomorrow.setDate(today.getDate() + 1);
                    matchesDate = bookingDate.getTime() === tomorrow.getTime();
                } else if (dateRange === 'week') {
                    const weekEnd = new Date(today);
                    weekEnd.setDate(today.getDate() + 7);
                    matchesDate = bookingDate >= today && bookingDate <= weekEnd;
                } else if (dateRange === 'custom' && customStart && customEnd) {
                    const start = new Date(customStart);
                    start.setHours(0, 0, 0, 0);
                    const end = new Date(customEnd);
                    end.setHours(23, 59, 59, 999);
                    matchesDate = bookingDate >= start && bookingDate <= end;
                }
            }

            return matchesSearch && matchesStatus && matchesSource && matchesDate;
        }).sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
    }, [bookings, searchTerm, statusFilter, sourceFilter, dateRange, customStart, customEnd]);

    // Stats Calculation
    const stats = useMemo(() => {
        const totalRevenue = filteredBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
        const totalBookings = filteredBookings.length;
        const avgRevenue = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;

        // Revenue by status
        const completedRevenue = filteredBookings
            .filter(b => b.status === 'completed')
            .reduce((sum, b) => sum + (b.total_amount || 0), 0);

        return { totalRevenue, totalBookings, avgRevenue, completedRevenue };
    }, [filteredBookings]);

    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card padding="md" className="relative overflow-hidden">
                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Total Revenue</p>
                            <h3 className="text-2xl font-bold text-emerald-400">₹{stats.totalRevenue.toLocaleString()}</h3>
                        </div>
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <DollarSign className="text-emerald-500" size={20} />
                        </div>
                    </div>
                </Card>

                <Card padding="md" className="relative overflow-hidden">
                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Bookings</p>
                            <h3 className="text-2xl font-bold text-blue-400">{stats.totalBookings}</h3>
                        </div>
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Hash className="text-blue-500" size={20} />
                        </div>
                    </div>
                </Card>

                <Card padding="md" className="relative overflow-hidden">
                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Avg. Value</p>
                            <h3 className="text-2xl font-bold text-amber-400">₹{stats.avgRevenue}</h3>
                        </div>
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                            <TrendingUp className="text-amber-500" size={20} />
                        </div>
                    </div>
                </Card>

                <Card padding="md" className="relative overflow-hidden">
                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Realized Rev.</p>
                            <h3 className="text-2xl font-bold text-purple-400">₹{stats.completedRevenue.toLocaleString()}</h3>
                        </div>
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <CheckCircle className="text-purple-500" size={20} />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filters Section */}
            <Card padding="md" className="space-y-4">
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                    <div className="flex-1 w-full lg:w-auto">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name, phone, or ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full lg:max-w-md pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 text-white"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                        <Select
                            value={statusFilter}
                            onChange={(val) => setStatusFilter(val)}
                            options={[
                                { value: 'all', label: 'All Status' },
                                { value: 'pending', label: 'Pending' },
                                { value: 'confirmed', label: 'Confirmed' },
                                { value: 'in-progress', label: 'In Progress' },
                                { value: 'completed', label: 'Completed' },
                                { value: 'cancelled', label: 'Cancelled' },
                            ]}
                        />
                        <Select
                            value={sourceFilter}
                            onChange={(val) => setSourceFilter(val)}
                            options={[
                                { value: 'all', label: 'All Sources' },
                                { value: 'online', label: 'Online' },
                                { value: 'walk-in', label: 'Walk-in' },
                            ]}
                        />
                        <Select
                            value={dateRange}
                            onChange={(val) => setDateRange(val)}
                            options={[
                                { value: 'all', label: 'All Time' },
                                { value: 'today', label: 'Today' },
                                { value: 'tomorrow', label: 'Tomorrow' },
                                { value: 'week', label: 'This Week' },
                                { value: 'custom', label: 'Custom' },
                            ]}
                        />
                        {onRefresh && (
                            <Button variant="secondary" onClick={onRefresh} title="Refresh Data">
                                <RefreshCw size={18} />
                            </Button>
                        )}
                    </div>
                </div>

                {dateRange === 'custom' && (
                    <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-800">
                        <div className="space-y-1">
                            <label className="text-xs text-slate-400">Start Date</label>
                            <input
                                type="date"
                                value={customStart}
                                onChange={(e) => setCustomStart(e.target.value)}
                                className="block px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-slate-400">End Date</label>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={(e) => setCustomEnd(e.target.value)}
                                className="block px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                            />
                        </div>
                    </div>
                )}
            </Card>

            {/* Table */}
            <BookingsTable
                bookings={filteredBookings}
                showFilters={false}
                onStatusChange={onUpdateStatus}
                onEdit={onEdit}
                loading={loading}
                title={`Booking List (${filteredBookings.length})`}
                showActions={true}
            />
        </div>
    );
}
