'use client';

import { useState } from 'react';
import { Card, StatusBadge, Button, Select, Input } from './ui';
import { Search, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { BookingRow } from '@/types/database';

interface BookingsTableProps {
    bookings: any[];
    onStatusChange?: (id: string, status: string) => void;
    onEdit?: (booking: any) => void;
    showFilters?: boolean;
    limit?: number;
    loading?: boolean;
    theme?: any;
    title?: string;
    onViewAll?: () => void;
}

export function BookingsTable({
    bookings,
    onStatusChange,
    onEdit,
    showFilters = false,
    limit,
    loading = false,
    title = "Bookings",
    onViewAll
}: BookingsTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Filter logic
    let filteredBookings = bookings.filter((booking) => {
        const matchesSearch =
            (booking.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
            (booking.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
            (booking.id?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
            (booking.customer_phone?.includes(searchTerm) ?? false);

        const matchesStatus =
            statusFilter === 'all' || booking.status?.toLowerCase() === statusFilter.toLowerCase();

        return matchesSearch && matchesStatus;
    });

    // Sort by date desc
    filteredBookings.sort((a, b) => {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

    // Apply limit if provided (for dashboard view)
    const displayBookings = limit ? filteredBookings.slice(0, limit) : filteredBookings;

    // Pagination (only if no limit)
    const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
    const paginatedBookings = limit
        ? displayBookings
        : displayBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    const formatTime = (timeString: string | null) => {
        if (!timeString) return '-';
        // If it's a full ISO string
        if (timeString.includes('T')) {
            return new Date(timeString).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "numeric",
                hour12: true
            });
        }
        // If it's already HH:MM format, try to format nicely
        return timeString;
    };

    return (
        <Card className="w-full overflow-hidden" padding="none">
            <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    {title}
                </h2>

                {showFilters && (
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search bookings..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-full sm:w-64"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="in-progress">In Progress</option>
                        </select>
                    </div>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 border-b border-white/5">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Customer</th>
                            <th className="px-6 py-4 font-semibold">Details</th>
                            <th className="px-6 py-4 font-semibold">Date & Time</th>
                            <th className="px-6 py-4 font-semibold">Amount</th>
                            <th className="px-6 py-4 font-semibold">Status</th>
                            <th className="px-6 py-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                    Loading bookings...
                                </td>
                            </tr>
                        ) : paginatedBookings.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                    No bookings found
                                </td>
                            </tr>
                        ) : (
                            paginatedBookings.map((booking) => (
                                <tr key={booking.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-white">
                                            {booking.customer_name || booking.user_name || "Guest"}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5">
                                            {booking.customer_phone || booking.user_email || "-"}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-slate-300">
                                            {booking.booking_items?.map((item: any, idx: number) => (
                                                <span key={idx} className="block">
                                                    {item.quantity}x {item.console}
                                                </span>
                                            )) || <span className="text-slate-500">No items</span>}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5 capitalize">
                                            {booking.source?.replace('_', ' ') || 'Online'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-white">{formatDate(booking.booking_date)}</div>
                                        <div className="text-xs text-slate-500 mt-0.5">
                                            {formatTime(booking.start_time)} ({booking.duration}m)
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-emerald-400">
                                            ₹{booking.total_amount}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5 capitalize">
                                            {booking.payment_mode || 'Unpaid'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={booking.status || 'pending'} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {onEdit && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => onEdit(booking)}
                                            >
                                                Edit
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {!limit && totalPages > 1 && (
                <div className="p-4 border-t border-white/5 flex items-center justify-between">
                    <div className="text-sm text-slate-500">
                        Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="secondary"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                            size="sm"
                            variant="secondary"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            {limit && onViewAll && (
                <div className="p-4 border-t border-white/5">
                    <Button
                        variant="ghost"
                        className="w-full justify-center text-blue-400 hover:text-blue-300"
                        onClick={onViewAll}
                    >
                        View All Bookings →
                    </Button>
                </div>
            )}
        </Card>
    );
}
