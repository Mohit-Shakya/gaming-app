'use client';

import { ReactNode } from 'react';
import { Sidebar, MobileMenuButton } from './Sidebar';

interface DashboardLayoutProps {
    children: ReactNode;
    activeTab: string;
    onTabChange: (tab: string) => void;
    cafeName: string;
    isMobile: boolean;
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (open: boolean) => void;
    title: string;
}

// Map tab IDs to display titles
const TAB_TITLES: Record<string, string> = {
    dashboard: 'Dashboard',
    'live-status': 'Live Console Status',
    billing: 'Billing',
    sessions: 'Bookings',
    customers: 'Customers',
    stations: 'Stations',
    memberships: 'Memberships',
    coupons: 'Coupons',
    reports: 'Reports',
    settings: 'Settings',
};

export function DashboardLayout({
    children,
    activeTab,
    onTabChange,
    cafeName,
    isMobile,
    mobileMenuOpen,
    setMobileMenuOpen,
    title,
}: DashboardLayoutProps) {
    const handleLogout = () => {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('owner_session');
            window.location.href = '/owner/login';
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex">
            {/* Sidebar */}
            <Sidebar
                activeTab={activeTab}
                onTabChange={(tab) => onTabChange(tab)}
                cafeName={cafeName}
                isMobile={isMobile}
                isOpen={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
                onLogout={handleLogout}
            />

            {/* Main Content Area */}
            <div
                className={`
          flex-1 flex flex-col min-w-0
          ${!isMobile ? 'ml-72' : ''}
        `}
            >
                {/* Header */}
                <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
                    <div className="flex items-center justify-between px-4 py-4 md:px-8">
                        <div className="flex items-center gap-4">
                            {isMobile && (
                                <MobileMenuButton onClick={() => setMobileMenuOpen(true)} />
                            )}
                            <h1 className="text-xl font-bold text-white md:text-2xl">
                                {TAB_TITLES[activeTab] || title}
                            </h1>
                        </div>

                        {/* Header Actions - can be extended */}
                        <div className="flex items-center gap-3">
                            {/* Placeholder for notifications, search, etc. */}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
