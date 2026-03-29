'use client';

import { useState } from 'react';
import { LucideIcon } from 'lucide-react';
import {
    LayoutDashboard,
    MonitorPlay,
    CreditCard,
    CalendarCheck,
    Users,
    Gamepad2,
    Ticket,
    BarChart3,
    Settings,
    LogOut,
    X,
    Menu,
    Package,
    Trophy,
    ChevronDown,
    ChevronRight,
} from 'lucide-react';

const PRIMARY_NAV = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'live-status', label: 'Live Status', icon: MonitorPlay },
    { id: 'billing', label: 'New Booking', icon: CreditCard },
    { id: 'bookings', label: 'Bookings', icon: CalendarCheck },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
] as const;

const MANAGE_NAV = [
    { id: 'stations', label: 'Stations', icon: Gamepad2 },
    { id: 'memberships', label: 'Memberships', icon: Ticket },
    { id: 'subscriptions', label: 'Tournament', icon: Trophy },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'coupons', label: 'Coupons', icon: Ticket },
    { id: 'settings', label: 'Settings', icon: Settings },
] as const;

type NavTabId = typeof PRIMARY_NAV[number]['id'] | typeof MANAGE_NAV[number]['id'];

interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: NavTabId) => void;
    cafeName: string;
    isMobile: boolean;
    isOpen: boolean;
    onClose: () => void;
    onLogout: () => void;
}

export function Sidebar({
    activeTab,
    onTabChange,
    cafeName,
    isMobile,
    isOpen,
    onClose,
    onLogout,
}: SidebarProps) {
    const isManageActive = MANAGE_NAV.some(item => item.id === activeTab);
    const [manageOpen, setManageOpen] = useState(isManageActive);

    return (
        <>
            {isMobile && isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />
            )}

            <aside className={`
                fixed top-0 left-0 z-50 h-screen w-64
                bg-gradient-to-b from-slate-900 to-slate-950
                border-r border-slate-800/50
                flex flex-col
                transition-transform duration-300 ease-out
                ${isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
            `}>
                {/* Header */}
                <div className="p-5 border-b border-slate-800/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-lg font-bold text-white truncate max-w-[160px]">{cafeName}</h1>
                            <div className="text-[10px] tracking-[2px] font-semibold text-slate-500 mt-0.5 uppercase">
                                <span className="text-red-500">BOOK</span>MYGAME
                            </div>
                        </div>
                        {isMobile && (
                            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                                <X size={18} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 overflow-y-auto space-y-0.5">
                    {/* Primary items */}
                    {PRIMARY_NAV.map((item) => {
                        const isActive = activeTab === item.id;
                        const Icon = item.icon;
                        const isBilling = item.id === 'billing';
                        return (
                            <button
                                key={item.id}
                                onClick={() => { onTabChange(item.id); if (isMobile) onClose(); }}
                                className={`
                                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                                    transition-all duration-200 group relative
                                    ${isBilling
                                        ? isActive
                                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                            : 'text-blue-400 hover:bg-blue-500/10 border border-blue-500/20'
                                        : isActive
                                            ? 'bg-gradient-to-r from-blue-500/15 to-blue-600/15 text-blue-400'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                    }
                                `}
                            >
                                {isActive && !isBilling && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-500 rounded-r-full" />
                                )}
                                <Icon size={18} className={isActive ? 'text-blue-400' : isBilling ? 'text-blue-400' : 'group-hover:text-white'} />
                                <span className="font-medium text-sm">{item.label}</span>
                            </button>
                        );
                    })}

                    {/* Manage group */}
                    <div className="pt-2">
                        <button
                            onClick={() => setManageOpen(prev => !prev)}
                            className="w-full flex items-center justify-between px-3 py-2 text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            <span className="text-[10px] font-bold uppercase tracking-widest">Manage</span>
                            {manageOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </button>

                        {manageOpen && (
                            <div className="space-y-0.5 mt-0.5">
                                {MANAGE_NAV.map((item) => {
                                    const isActive = activeTab === item.id;
                                    const Icon = item.icon;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => { onTabChange(item.id); if (isMobile) onClose(); }}
                                            className={`
                                                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                                                transition-all duration-200 group relative
                                                ${isActive
                                                    ? 'bg-gradient-to-r from-blue-500/15 to-blue-600/15 text-blue-400'
                                                    : 'text-slate-500 hover:text-white hover:bg-slate-800/50'
                                                }
                                            `}
                                        >
                                            {isActive && (
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-500 rounded-r-full" />
                                            )}
                                            <Icon size={16} className={isActive ? 'text-blue-400' : 'group-hover:text-white'} />
                                            <span className="font-medium text-[13px]">{item.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </nav>

                {/* Footer */}
                <div className="p-3 border-t border-slate-800/50 space-y-1">
                    <button
                        onClick={() => (window.location.href = '/')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                    >
                        <Users size={18} />
                        <span className="font-medium text-sm">User Dashboard</span>
                    </button>
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut size={18} />
                        <span className="font-medium text-sm">Sign Out</span>
                    </button>
                </div>
            </aside>
        </>
    );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center justify-center w-10 h-10 rounded-lg border border-slate-700 text-white hover:bg-slate-800 transition-colors"
        >
            <Menu size={20} />
        </button>
    );
}
