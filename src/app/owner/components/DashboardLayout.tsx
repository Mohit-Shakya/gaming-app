'use client';

import { ReactNode, useState } from 'react';
import { RefreshCw, Bell, LayoutDashboard, CreditCard, CalendarCheck, Users, BarChart3, Package, Ticket, Settings, Gamepad2, Trophy, ChevronDown } from 'lucide-react';
import { MobileMenuButton, Sidebar } from './Sidebar';

interface DashboardLayoutProps {
    children: ReactNode;
    activeTab: string;
    onTabChange: (tab: string) => void;
    cafeName: string;
    isMobile: boolean;
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (open: boolean) => void;
    title: string;
    onRefresh?: () => void;
}

const DESKTOP_PRIMARY_TABS = [
    { id: 'dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
    { id: 'billing',     label: 'Billing',      icon: CreditCard },
    { id: 'bookings',    label: 'Bookings',     icon: CalendarCheck },
    { id: 'reports',     label: 'Reports',      icon: BarChart3 },
    { id: 'inventory',   label: 'Inventory',    icon: Package },
    { id: 'memberships', label: 'Memberships',  icon: Ticket },
    { id: 'coupons',     label: 'Coupons',      icon: Ticket },
    { id: 'customers',   label: 'Customers',    icon: Users },
];

const DESKTOP_MORE_TABS = [
    { id: 'stations',      label: 'Stations',    icon: Gamepad2 },
    { id: 'subscriptions', label: 'Tournament',  icon: Trophy },
    { id: 'settings',      label: 'Settings',    icon: Settings },
];

export function DashboardLayout({
    children,
    activeTab,
    onTabChange,
    cafeName,
    isMobile,
    mobileMenuOpen,
    setMobileMenuOpen,
    onRefresh,
}: DashboardLayoutProps) {
    const [spinning, setSpinning] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);

    const handleRefresh = () => {
        if (!onRefresh || spinning) return;
        setSpinning(true);
        onRefresh();
        setTimeout(() => setSpinning(false), 800);
    };

    const handleLogout = async () => {
        if (confirm('Are you sure you want to logout?')) {
            try { await fetch('/api/owner/login', { method: 'DELETE', credentials: 'include' }); } catch {}
            window.location.href = '/owner/login';
        }
    };

    const initials = cafeName.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');
    const isMoreActive = DESKTOP_MORE_TABS.some(t => t.id === activeTab);

    return (
        <div className="min-h-screen owner-bg flex flex-col">

            {/* ── DESKTOP HEADER (2 rows) ── */}
            <div className="hidden lg:block sticky top-0 z-40"
                style={{ background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(20px)', boxShadow: '0 1px 0 rgba(255,255,255,0.06)' }}>

                {/* Row 1: Logo + User */}
                <div className="flex items-center justify-between px-6 py-2.5 border-b border-white/[0.05]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.15)' }}>
                            <Gamepad2 size={18} className="text-cyan-400" />
                        </div>
                        <div>
                            <p className="text-[14px] font-bold text-white leading-none">BookMyGame.</p>
                            <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">Owner Console · {cafeName}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {onRefresh && (
                            <button onClick={handleRefresh} title="Refresh"
                                className="w-8 h-8 rounded-full border border-white/[0.08] bg-white/[0.03] flex items-center justify-center text-slate-500 hover:text-white transition-colors">
                                <RefreshCw size={13} className={spinning ? 'animate-spin' : ''} />
                            </button>
                        )}
                        <button className="w-8 h-8 rounded-full border border-white/[0.08] bg-white/[0.03] flex items-center justify-center text-slate-500 hover:text-white transition-colors">
                            <Bell size={13} />
                        </button>
                        <button onClick={handleLogout}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.10] bg-white/[0.04] hover:bg-white/[0.07] transition-colors">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: 'rgba(6,182,212,0.3)', color: '#22d3ee' }}>
                                {initials || 'O'}
                            </div>
                            <span className="text-[12px] font-medium text-slate-200 max-w-[90px] truncate">{cafeName}</span>
                            <ChevronDown size={11} className="text-slate-500" />
                        </button>
                    </div>
                </div>

                {/* Row 2: Tab navigation */}
                <nav className="flex items-end px-6 overflow-x-auto no-scrollbar" style={{ height: 42 }}>
                    {DESKTOP_PRIMARY_TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button key={tab.id} onClick={() => onTabChange(tab.id)}
                                className={`relative flex items-center gap-1.5 px-4 h-full text-[12px] font-medium whitespace-nowrap transition-colors border-b-2 mr-0.5
                                    ${isActive ? 'text-white border-cyan-400' : 'text-slate-500 border-transparent hover:text-slate-200'}`}>
                                <Icon size={12} />
                                {tab.label}
                            </button>
                        );
                    })}

                    <div className="relative h-full">
                        <button onClick={() => setMoreOpen(p => !p)}
                            className={`relative flex items-center gap-1 px-4 h-full text-[12px] font-medium whitespace-nowrap transition-colors border-b-2
                                ${isMoreActive ? 'text-white border-cyan-400' : 'text-slate-500 border-transparent hover:text-slate-200'}`}>
                            More <ChevronDown size={10} className={`transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {moreOpen && (
                            <div className="absolute top-full left-0 mt-1 w-40 glass rounded-xl overflow-hidden py-1 z-50" onClick={() => setMoreOpen(false)}>
                                {DESKTOP_MORE_TABS.map(tab => {
                                    const Icon = tab.icon;
                                    return (
                                        <button key={tab.id} onClick={() => onTabChange(tab.id)}
                                            className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] transition-colors
                                                ${activeTab === tab.id ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'}`}>
                                            <Icon size={13} />{tab.label}
                                        </button>
                                    );
                                })}
                                <div className="border-t border-white/[0.06] mt-1 pt-1">
                                    <button onClick={handleLogout}
                                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] text-red-400 hover:bg-red-500/10 transition-colors">
                                        <Settings size={13} />Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </nav>
            </div>

            {/* ── MOBILE HEADER ── */}
            <header className="lg:hidden sticky top-0 z-40 h-14 flex items-center justify-between px-4 border-b border-white/[0.06]"
                style={{ background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(20px)' }}>
                <div className="flex items-center gap-3">
                    <MobileMenuButton onClick={() => setMobileMenuOpen(true)} />
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.15)' }}>
                            <Gamepad2 size={14} className="text-cyan-400" />
                        </div>
                        <p className="text-sm font-bold text-white">BookMyGame.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {onRefresh && (
                        <button onClick={handleRefresh} className="w-8 h-8 rounded-lg border border-white/[0.06] bg-white/[0.04] flex items-center justify-center text-slate-500 hover:text-white transition-colors">
                            <RefreshCw size={13} className={spinning ? 'animate-spin' : ''} />
                        </button>
                    )}
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: 'rgba(6,182,212,0.3)', color: '#22d3ee' }}>
                        {initials || 'O'}
                    </div>
                </div>
            </header>

            {/* Mobile sidebar drawer */}
            <Sidebar activeTab={activeTab} onTabChange={(tab) => onTabChange(tab)} cafeName={cafeName}
                isMobile={true} isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}
                onLogout={handleLogout} collapsed={false} onToggleCollapsed={() => {}} />

            {/* Page Content */}
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                {children}
            </main>
        </div>
    );
}
