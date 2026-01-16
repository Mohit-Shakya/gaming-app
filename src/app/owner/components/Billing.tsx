'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { CONSOLE_ICONS, CONSOLE_LABELS } from '@/lib/constants';
import { Card, Button, Input, Select, StatusBadge, LoadingSpinner } from './ui';
import {
    User, Smartphone, Calendar, Clock, Plus, Trash2,
    CreditCard, Banknote, CheckCircle, AlertCircle, Search
} from 'lucide-react';
import { CafeRow } from '@/types/database';

interface BillingProps {
    cafeId: string;
    cafes: CafeRow[];
    isMobile?: boolean;
    onSuccess?: () => void;
}

type BillingItem = {
    id: string;
    console: string;
    quantity: number;
    duration: number;
    price: number;
};

type CustomerSuggestion = {
    name: string;
    phone: string;
};

export function Billing({ cafeId, cafes, isMobile = false, onSuccess }: BillingProps) {
    // Form State
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState('');
    const [items, setItems] = useState<BillingItem[]>([]);
    const [paymentMode, setPaymentMode] = useState<'cash' | 'upi'>('cash');
    const [submitting, setSubmitting] = useState(false);

    // Data State
    const [pricing, setPricing] = useState<any>(null);
    const [availableConsoles, setAvailableConsoles] = useState<string[]>([]);

    // Autocomplete State
    const [suggestions, setSuggestions] = useState<CustomerSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize time and available consoles
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setStartTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
        };
        updateTime();

        // Find current cafe
        const currentCafe = cafes.find(c => c.id === cafeId) || cafes[0];
        if (currentCafe) {
            const consoleTypes = [
                { id: 'ps5', count: currentCafe.ps5_count },
                { id: 'ps4', count: currentCafe.ps4_count },
                { id: 'xbox', count: currentCafe.xbox_count },
                { id: 'pc', count: currentCafe.pc_count },
                { id: 'pool', count: currentCafe.pool_count },
                { id: 'snooker', count: currentCafe.snooker_count },
                { id: 'arcade', count: currentCafe.arcade_count },
                { id: 'vr', count: currentCafe.vr_count },
                { id: 'steering', count: currentCafe.steering_wheel_count },
            ];

            setAvailableConsoles(
                consoleTypes.filter(c => c.count > 0).map(c => c.id)
            );
        }

        // Fetch pricing
        async function fetchPricing() {
            if (!cafeId) return;
            const { data } = await supabase
                .from('console_pricing')
                .select('*')
                .eq('cafe_id', cafeId);

            if (data) {
                // Transform to map: { 'ps5': { qty1_30min: 50... } }
                const pricingMap: any = {};
                data.forEach(p => {
                    const type = p.console_type; // e.g. 'ps5'
                    if (!pricingMap[type]) pricingMap[type] = {};

                    // Key format matching old logic: qtyX_Ymin
                    pricingMap[type][`qty${p.quantity}_${p.duration_minutes}min`] = p.price;
                });
                setPricing(pricingMap);
            }
        }
        fetchPricing();
    }, [cafeId, cafes]);

    // Customer Autocomplete
    useEffect(() => {
        if (!customerName || customerName.length < 2) {
            setSuggestions([]);
            return;
        }

        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        searchTimeoutRef.current = setTimeout(async () => {
            const { data } = await supabase
                .from('bookings')
                .select('customer_name, customer_phone')
                .ilike('customer_name', `%${customerName}%`)
                .order('created_at', { ascending: false })
                .limit(5);

            if (data) {
                // Unique by phone
                const unique = data.reduce((acc: any[], curr) => {
                    if (curr.customer_name && !acc.find(item => item.customer_name === curr.customer_name)) {
                        acc.push({ name: curr.customer_name, phone: curr.customer_phone || '' });
                    }
                    return acc;
                }, []);
                setSuggestions(unique);
                setShowSuggestions(true);
            }
        }, 300);
    }, [customerName]);

    // Pricing Helper
    const calculatePrice = (type: string, qty: number, duration: number) => {
        if (!pricing) return 0;

        // Map app console types to DB types if needed (e.g. steering -> steering_wheel)
        // Check how it's stored in DB vs App. Previous code handled "steering" -> "steering_wheel".
        // Let's assume standard IDs for now, handle exception if needed.
        const dbType = type === 'steering' ? 'steering_wheel' : type;
        const tier = pricing[dbType];

        if (!tier) return 0;

        // Pricing logic from page.tsx
        if (duration === 90) {
            const p60 = tier[`qty${qty}_60min`] || 0;
            const p30 = tier[`qty${qty}_30min`] || 0;
            return p60 + p30;
        }
        const exactKey = `qty${qty}_${duration}min`;
        if (tier[exactKey]) return tier[exactKey];

        // Fallback multipliers
        if (duration === 120) return (tier[`qty${qty}_60min`] || 0) * 2;
        if (duration === 180) return (tier[`qty${qty}_60min`] || 0) * 3;

        return 0;
    };

    // Item Management
    const addItem = () => {
        if (availableConsoles.length === 0) return;
        const defaultType = availableConsoles[0];
        const defaultQty = 1;
        const defaultDur = 60;

        const newItem: BillingItem = {
            id: Math.random().toString(36).substr(2, 9),
            console: defaultType,
            quantity: defaultQty,
            duration: defaultDur,
            price: calculatePrice(defaultType, defaultQty, defaultDur)
        };
        setItems([...items, newItem]);
    };

    const updateItem = (id: string, field: keyof BillingItem, value: any) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                if (['console', 'quantity', 'duration'].includes(field)) {
                    updated.price = calculatePrice(updated.console, updated.quantity, updated.duration);
                }
                return updated;
            }
            return item;
        }));
    };

    const removeItem = (id: string) => {
        setItems(items.filter(i => i.id !== id));
    };

    const totalAmount = items.reduce((sum, i) => sum + i.price, 0);

    const handleSubmit = async () => {
        if (!customerName || !startTime || items.length === 0) {
            alert('Please fill all required fields');
            return;
        }

        setSubmitting(true);
        try {
            // Format time
            const [hours, mins] = startTime.split(':').map(Number);
            const period = hours >= 12 ? 'pm' : 'am';
            const displayHours = hours % 12 || 12;
            const startTime12h = `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`;

            // Create Booking
            const { data: booking, error: bookingError } = await supabase
                .from('bookings')
                .insert({
                    cafe_id: cafeId,
                    customer_name: customerName,
                    customer_phone: customerPhone || null,
                    booking_date: bookingDate,
                    start_time: startTime12h,
                    duration: items[0].duration, // Primary duration
                    total_amount: totalAmount,
                    status: 'in-progress',
                    source: 'walk-in',
                    payment_mode: paymentMode
                })
                .select()
                .single();

            if (bookingError) throw bookingError;

            // Create Items
            const bookingItems = items.map(item => ({
                booking_id: booking.id,
                console: item.console,
                quantity: item.quantity,
                price: item.price
            }));

            const { error: itemsError } = await supabase
                .from('booking_items')
                .insert(bookingItems);

            if (itemsError) throw itemsError;

            // Success
            setCustomerName('');
            setCustomerPhone('');
            setItems([]);
            if (onSuccess) onSuccess();
            alert('Booking created successfully!'); // Can replace with toast later

        } catch (error) {
            console.error('Booking failed:', error);
            alert('Failed to create booking');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${isMobile ? 'pb-20' : ''}`}>
            {/* Left Column: Form */}
            <div className="lg:col-span-2 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <span className="text-2xl">⚡</span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Quick Booking</h2>
                        <p className="text-slate-400">Create instant walk-in sessions</p>
                    </div>
                </div>

                {/* Customer Details */}
                <Card className="space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <User className="text-blue-500" size={20} /> Customer Info
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <Input
                                label="Name"
                                value={customerName}
                                onChange={(val) => {
                                    setCustomerName(val);
                                    if (val.length < 2) setShowSuggestions(false);
                                }}
                                placeholder="Enter customer name"
                            />
                            {showSuggestions && suggestions.length > 0 && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setShowSuggestions(false)}
                                    />
                                    <div className="absolute top-full mt-1 left-0 w-full z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                                        {suggestions.map((s, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => {
                                                    setCustomerName(s.name);
                                                    setCustomerPhone(s.phone);
                                                    setShowSuggestions(false);
                                                }}
                                                className="px-4 py-3 hover:bg-slate-700/50 cursor-pointer border-b border-slate-700/50 last:border-0"
                                            >
                                                <div className="font-medium text-white">{s.name}</div>
                                                <div className="text-xs text-slate-400">{s.phone}</div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                        <Input
                            label="Phone (Optional)"
                            value={customerPhone}
                            onChange={setCustomerPhone}
                            placeholder="Enter phone number"
                            type="tel"
                        />
                    </div>
                </Card>

                {/* Booking Items */}
                <Card className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Smartphone className="text-purple-500" size={20} /> Stations
                        </h3>
                        {items.length > 0 && (
                            <Button size="sm" variant="secondary" onClick={addItem}>
                                <Plus size={16} className="mr-1" /> Add Station
                            </Button>
                        )}
                    </div>

                    {items.length === 0 ? (
                        <div className="py-8 text-center border-2 border-dashed border-slate-800 rounded-xl">
                            <p className="text-slate-500 mb-4">No stations added yet</p>
                            <Button size="sm" onClick={addItem}>Add First Station</Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {items.map((item, idx) => (
                                <div key={item.id} className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl relative group transition-all hover:border-slate-700">
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-slate-800 text-slate-400 hover:text-red-400 rounded-full flex items-center justify-center border border-slate-700 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={12} />
                                    </button>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <Select
                                            label="Console"
                                            value={item.console}
                                            options={availableConsoles.map(c => ({ value: c, label: CONSOLE_LABELS[c as keyof typeof CONSOLE_LABELS] || c }))}
                                            onChange={(val) => updateItem(item.id, 'console', val)}
                                        />
                                        <Select
                                            label="Players"
                                            value={String(item.quantity || 1)}
                                            options={[
                                                { value: '1', label: '1 Player' },
                                                { value: '2', label: '2 Players' },
                                                { value: '3', label: '3 Players' },
                                                { value: '4', label: '4 Players' },
                                            ]}
                                            onChange={(val) => updateItem(item.id, 'quantity', parseInt(val))}
                                        />
                                        <Select
                                            label="Duration"
                                            value={String(item.duration)}
                                            options={[
                                                { value: '30', label: '30 Mins' },
                                                { value: '60', label: '1 Hour' },
                                                { value: '90', label: '1.5 Hours' },
                                                { value: '120', label: '2 Hours' },
                                                { value: '180', label: '3 Hours' },
                                            ]}
                                            onChange={(val) => updateItem(item.id, 'duration', parseInt(val))}
                                        />
                                        <div className="flex flex-col justify-end">
                                            <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-right">
                                                <div className="text-xs text-slate-500 mb-0.5">Price</div>
                                                <div className="text-emerald-400 font-bold font-mono">₹{item.price}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            {/* Right Column: Summary & Payment */}
            <div className="lg:col-span-1 space-y-6">
                <Card className="sticky top-6">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <Clock className="text-orange-500" size={20} /> Summary
                    </h3>

                    <div className="bg-slate-900/50 rounded-xl p-4 mb-6 space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">Date</span>
                            <input
                                type="date"
                                className="bg-transparent text-white text-right outline-none focus:text-blue-400"
                                value={bookingDate}
                                onChange={(e) => setBookingDate(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">Start Time</span>
                            <input
                                type="time"
                                className="bg-transparent text-white text-right outline-none focus:text-blue-400"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                            />
                        </div>
                        <div className="border-t border-slate-800 my-2"></div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-400">Total Amount</span>
                            <span className="text-2xl font-bold text-white">₹{totalAmount}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setPaymentMode('cash')}
                                className={`
                                    p-4 rounded-xl border flex flex-col items-center gap-2 transition-all
                                    ${paymentMode === 'cash'
                                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500'
                                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}
                                `}
                            >
                                <Banknote size={24} />
                                <span className="text-sm font-semibold">Cash</span>
                            </button>
                            <button
                                onClick={() => setPaymentMode('upi')}
                                className={`
                                    p-4 rounded-xl border flex flex-col items-center gap-2 transition-all
                                    ${paymentMode === 'upi'
                                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500'
                                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}
                                `}
                            >
                                <Smartphone size={24} />
                                <span className="text-sm font-semibold">UPI</span>
                            </button>
                        </div>

                        <Button
                            className="w-full py-4 text-lg"
                            onClick={handleSubmit}
                            loading={submitting}
                            disabled={items.length === 0}
                        >
                            Confirm Booking
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
