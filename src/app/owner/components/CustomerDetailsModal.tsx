/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { theme } from '../utils/theme';
import { convertTo12Hour } from '../utils';

type CustomerDetailsModalProps = {
    customer: any;
    customerBookings: any[];
    loadingCustomerData: boolean;
    isMobile: boolean;
    onClose: () => void;
    onBackToSubscription: (sub: any) => void;
};

export default function CustomerDetailsModal({
    customer,
    customerBookings,
    loadingCustomerData,
    isMobile,
    onClose,
    onBackToSubscription
}: CustomerDetailsModalProps) {
    if (!customer) return null;

    // Get initials for avatar
    const nameParts = customer.name?.split(' ') || [];
    const initials = nameParts.length >= 2
        ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
        : (customer.name?.[0] || 'U').toUpperCase();

    const totalSpent = customerBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const totalHours = customerBookings.reduce((sum, b) => sum + (b.duration ? b.duration / 60 : 0), 0);

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0, 0, 0, 0.7)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                padding: isMobile ? "16px" : "20px",
                overflowY: 'auto',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: theme.cardBackground,
                    borderRadius: isMobile ? 16 : 24,
                    border: `1px solid ${theme.border}`,
                    maxWidth: 900,
                    width: "100%",
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with Back Button (if came from subscription) */}
                {customer.subscription && (
                    <div style={{
                        padding: isMobile ? "20px 24px" : "28px 32px",
                        borderBottom: `1px solid ${theme.border}`,
                        background: "rgba(59, 130, 246, 0.05)",
                    }}>
                        <button
                            onClick={() => onBackToSubscription(customer.subscription)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: theme.textMuted,
                                fontSize: isMobile ? 14 : 15,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                marginBottom: 16,
                                padding: 0,
                            }}
                        >
                            ← Back to Subscription
                        </button>
                    </div>
                )}

                {/* Customer Profile Header */}
                <div style={{ padding: isMobile ? "24px" : "32px" }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 20,
                        marginBottom: 32,
                        borderBottom: `1px solid ${theme.border}`,
                        paddingBottom: 32,
                    }}>
                        <div style={{
                            width: isMobile ? 72 : 96,
                            height: isMobile ? 72 : 96,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: isMobile ? 28 : 36,
                            fontWeight: 700,
                            color: '#fff',
                            boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)',
                        }}>
                            {initials}
                        </div>
                        <div>
                            <h2 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 700, color: theme.textPrimary, margin: 0, marginBottom: 4 }}>
                                {customer.name}
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <p style={{ fontSize: isMobile ? 14 : 16, color: theme.textSecondary, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span>📞</span> {customer.phone || 'No phone'}
                                </p>
                                {customer.email && (
                                    <p style={{ fontSize: isMobile ? 14 : 16, color: theme.textSecondary, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span>📧</span> {customer.email}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
                        gap: isMobile ? 16 : 24,
                        marginBottom: 32,
                    }}>
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: 16,
                            padding: isMobile ? 16 : 20,
                            border: `1px solid ${theme.border}`,
                        }}>
                            <p style={{ fontSize: isMobile ? 11 : 12, color: theme.textMuted, margin: '0 0 6px 0', textTransform: 'uppercase' }}>
                                Total Sessions
                            </p>
                            <p style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: theme.textPrimary, margin: 0 }}>
                                {customerBookings.length}
                            </p>
                        </div>
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: 16,
                            padding: isMobile ? 16 : 20,
                            border: `1px solid ${theme.border}`,
                        }}>
                            <p style={{ fontSize: isMobile ? 11 : 12, color: theme.textMuted, margin: '0 0 6px 0', textTransform: 'uppercase' }}>
                                Total Spent
                            </p>
                            <p style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: '#10b981', margin: 0 }}>
                                ₹{totalSpent.toLocaleString()}
                            </p>
                        </div>
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: 16,
                            padding: isMobile ? 16 : 20,
                            border: `1px solid ${theme.border}`,
                        }}>
                            <p style={{ fontSize: isMobile ? 11 : 12, color: theme.textMuted, margin: '0 0 6px 0', textTransform: 'uppercase' }}>
                                Hours Played
                            </p>
                            <p style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: '#3b82f6', margin: 0 }}>
                                {Math.floor(totalHours)}h {Math.round((totalHours % 1) * 60)}m
                            </p>
                        </div>
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: 16,
                            padding: isMobile ? 16 : 20,
                            border: `1px solid ${theme.border}`,
                        }}>
                            <p style={{ fontSize: isMobile ? 11 : 12, color: theme.textMuted, margin: '0 0 6px 0', textTransform: 'uppercase' }}>
                                Last Visit
                            </p>
                            <p style={{ fontSize: isMobile ? 16 : 18, fontWeight: 600, color: theme.textPrimary, margin: 0 }}>
                                {customerBookings.length > 0
                                    ? new Date(customerBookings[0].booking_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                    : 'N/A'}
                            </p>
                        </div>
                    </div>

                    {/* Sessions List */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: `1px solid ${theme.border}`,
                        borderRadius: 16,
                        padding: 0,
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            padding: isMobile ? "16px 20px" : "20px 24px",
                            borderBottom: `1px solid ${theme.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}>
                            <div>
                                <h3 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: theme.textPrimary, margin: 0 }}>
                                    Recent Sessions
                                </h3>
                                <p style={{ fontSize: isMobile ? 13 : 14, color: theme.textMuted, margin: '2px 0 0 0' }}>
                                    Last 10 gaming sessions
                                </p>
                            </div>
                            <button style={{
                                padding: '8px 16px',
                                background: 'transparent',
                                border: `2px solid ${theme.border}`,
                                borderRadius: 8,
                                color: theme.textPrimary,
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}>
                                View All
                            </button>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: isMobile ? 11 : 12, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase' }}>DATE</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: isMobile ? 11 : 12, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase' }}>STATION</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: isMobile ? 11 : 12, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase' }}>DURATION</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: isMobile ? 11 : 12, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase' }}>AMOUNT</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: isMobile ? 11 : 12, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase' }}>STATUS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingCustomerData ? (
                                        <tr>
                                            <td colSpan={5} style={{ padding: '40px 16px', textAlign: 'center', color: theme.textMuted }}>
                                                Loading sessions...
                                            </td>
                                        </tr>
                                    ) : customerBookings.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ padding: '40px 16px', textAlign: 'center', color: theme.textMuted }}>
                                                No sessions yet
                                            </td>
                                        </tr>
                                    ) : (
                                        customerBookings.map((booking) => {
                                            const bookingDate = new Date(booking.booking_date);
                                            const consoleInfo = booking.booking_items?.[0];
                                            const stationName = consoleInfo?.console?.toUpperCase() || 'N/A';
                                            const isSubscription = booking.source === 'subscription' || !booking.total_amount;

                                            return (
                                                <tr key={booking.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                                                    <td style={{ padding: '16px', fontSize: isMobile ? 13 : 14, color: theme.textPrimary }}>
                                                        <div>{bookingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                                        <div style={{ fontSize: isMobile ? 11 : 12, color: theme.textMuted }}>
                                                            {convertTo12Hour(booking.start_time)}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '16px', fontSize: isMobile ? 13 : 14, fontWeight: 600, color: theme.textPrimary }}>
                                                        {stationName}-{consoleInfo?.quantity || 1}
                                                    </td>
                                                    <td style={{ padding: '16px', fontSize: isMobile ? 13 : 14, color: theme.textPrimary }}>
                                                        {booking.duration ? `${Math.floor(booking.duration / 60)}h ${booking.duration % 60}m` : 'N/A'}
                                                    </td>
                                                    <td style={{ padding: '16px', fontSize: isMobile ? 13 : 14, fontWeight: 600, color: isSubscription ? '#3b82f6' : theme.textPrimary }}>
                                                        {isSubscription ? 'Subscription' : `₹${booking.total_amount}`}
                                                    </td>
                                                    <td style={{ padding: '16px' }}>
                                                        <span style={{
                                                            padding: '4px 12px',
                                                            background: booking.status === 'completed' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                                                            color: booking.status === 'completed' ? '#22c55e' : '#6b7280',
                                                            borderRadius: 12,
                                                            fontSize: isMobile ? 11 : 12,
                                                            fontWeight: 600,
                                                            textTransform: 'capitalize',
                                                        }}>
                                                            {booking.status || 'Completed'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
