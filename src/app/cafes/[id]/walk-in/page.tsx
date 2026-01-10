// src/app/cafes/[id]/walk-in/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Gamepad2,
  Monitor,
  Car,
  Target,
  RectangleGoggles,
  User,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
  CreditCard,
  Shield,
  Hash,
  Users,
  Crown,
  Zap,
  IndianRupee,
  Receipt,
  UserCheck,
  Smartphone,
  Timer,
  Wallet,
  ArrowRight,
  ShieldCheck,
  CheckSquare,
  CalendarClock,
  Cpu,
  Joystick,
  SquareActivity,
  Bolt
} from "lucide-react";

type ConsoleId = "ps5" | "ps4" | "xbox" | "pc" | "pool" | "arcade" | "snooker" | "vr" | "steering_wheel";

const CONSOLES: { id: ConsoleId; label: string; icon: React.ReactNode; color: string; gradient: string }[] = [
  { id: "ps5", label: "PS5", icon: <Gamepad2 className="w-5 h-5 md:w-6 md:h-6" />, color: "#3b82f6", gradient: "from-blue-500 to-cyan-500" },
  { id: "ps4", label: "PS4", icon: <Joystick className="w-5 h-5 md:w-6 md:h-6" />, color: "#1d4ed8", gradient: "from-blue-600 to-blue-800" },
  { id: "xbox", label: "Xbox", icon: <SquareActivity className="w-5 h-5 md:w-6 md:h-6" />, color: "#16a34a", gradient: "from-green-500 to-emerald-600" },
  { id: "pc", label: "PC Gaming", icon: <Monitor className="w-5 h-5 md:w-6 md:h-6" />, color: "#ef4444", gradient: "from-red-500 to-pink-600" },
  { id: "pool", label: "Pool Table", icon: <Target className="w-5 h-5 md:w-6 md:h-6" />, color: "#92400e", gradient: "from-amber-700 to-yellow-600" },
  { id: "arcade", label: "Arcade", icon: <Gamepad2 className="w-5 h-5 md:w-6 md:h-6" />, color: "#ea580c", gradient: "from-orange-500 to-red-500" },
  { id: "snooker", label: "Snooker", icon: <Target className="w-5 h-5 md:w-6 md:h-6" />, color: "#059669", gradient: "from-emerald-500 to-teal-600" },
  { id: "vr", label: "VR Experience", icon: <RectangleGoggles className="w-5 h-5 md:w-6 md:h-6" />, color: "#7c3aed", gradient: "from-purple-500 to-violet-600" },
  { id: "steering_wheel", label: "Racing Rig", icon: <Car className="w-5 h-5 md:w-6 md:h-6" />, color: "#dc2626", gradient: "from-red-600 to-rose-700" },
];

const CONSOLE_DB_KEYS: Record<ConsoleId, string> = {
  ps5: "ps5_count",
  ps4: "ps4_count",
  xbox: "xbox_count",
  pc: "pc_count",
  pool: "pool_count",
  arcade: "arcade_count",
  snooker: "snooker_count",
  vr: "vr_count",
  steering_wheel: "steering_wheel_count",
};

type ConsolePricingTier = {
  qty1_30min: number | null;
  qty1_60min: number | null;
  qty2_30min: number | null;
  qty2_60min: number | null;
  qty3_30min: number | null;
  qty3_60min: number | null;
  qty4_30min: number | null;
  qty4_60min: number | null;
};

export default function WalkInBookingPage() {
  const params = useParams();
  const cafeIdOrSlug = typeof params?.id === "string" ? params.id : null;

  // Cafe data
  const [cafeId, setCafeId] = useState<string | null>(null);
  const [cafeName, setCafeName] = useState<string>("Gaming Café");
  const [cafePrice, setCafePrice] = useState<number>(150);
  const [loading, setLoading] = useState(true);
  const [availableConsoles, setAvailableConsoles] = useState<ConsoleId[]>([]);
  const [consolePricing, setConsolePricing] = useState<Partial<Record<ConsoleId, ConsolePricingTier>>>({});

  // Form data
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedConsole, setSelectedConsole] = useState<ConsoleId | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [duration, setDuration] = useState<30 | 60>(60);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [bookingId, setBookingId] = useState<string>("");

  // Load cafe data
  useEffect(() => {
    async function loadCafe() {
      if (!cafeIdOrSlug) return;

      try {
        setLoading(true);
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cafeIdOrSlug);

        const { data, error } = await supabase
          .from("cafes")
          .select("*")
          .eq(isUUID ? "id" : "slug", cafeIdOrSlug)
          .maybeSingle();

        if (error || !data) {
          setError("Café not found");
          return;
        }

        setCafeId(data.id);
        setCafeName(data.name || "Gaming Café");
        setCafePrice(data.hourly_price || 150);

        // Get available consoles
        const available: ConsoleId[] = [];

        CONSOLES.forEach((c) => {
          const dbKey = CONSOLE_DB_KEYS[c.id];
          const count = (data as any)[dbKey] ?? 0;

          if (count > 0) {
            available.push(c.id);
          }
        });

        setAvailableConsoles(available);

        // Load console pricing from console_pricing table
        const { data: pricingData, error: pricingError } = await supabase
          .from("console_pricing")
          .select("console_type, quantity, duration_minutes, price")
          .eq("cafe_id", data.id);

        if (!pricingError && pricingData) {
          const pricing: Partial<Record<ConsoleId, ConsolePricingTier>> = {};

          pricingData.forEach((item: any) => {
            let consoleId = item.console_type as ConsoleId;

            if (!pricing[consoleId]) {
              pricing[consoleId] = {
                qty1_30min: null,
                qty1_60min: null,
                qty2_30min: null,
                qty2_60min: null,
                qty3_30min: null,
                qty3_60min: null,
                qty4_30min: null,
                qty4_60min: null,
              };
            }

            const key = `qty${item.quantity}_${item.duration_minutes}min` as keyof ConsolePricingTier;
            pricing[consoleId]![key] = item.price;
          });

          setConsolePricing(pricing);
        }

        // Auto-select first available console
        if (available.length > 0) {
          setSelectedConsole(available[0]);
        }
      } catch (err) {
        console.error("Error loading cafe:", err);
        setError("Could not load café details");
      } finally {
        setLoading(false);
      }
    }

    loadCafe();
  }, [cafeIdOrSlug]);

  // Calculate amount based on tier pricing
  const calculateAmount = () => {
    if (!selectedConsole) return 0;

    const tier = consolePricing[selectedConsole];
    const basePrice = cafePrice;

    if (tier) {
      const key = `qty${quantity}_${duration}min` as keyof ConsolePricingTier;
      const tierPrice = tier[key];

      if (tierPrice !== null && tierPrice !== undefined) {
        return tierPrice;
      }
    }

    // Fallback to simple calculation
    const durationMultiplier = duration / 60;
    const fallbackAmount = basePrice * quantity * durationMultiplier;
    return Math.round(fallbackAmount);
  };

  const totalAmount = calculateAmount();

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!customerName.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!customerPhone.trim()) {
      setError("Please enter your phone number");
      return;
    }

    if (customerPhone.length < 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    if (!selectedConsole) {
      setError("Please select a console");
      return;
    }

    if (!cafeId) {
      setError("Café information not loaded");
      return;
    }

    try {
      setSubmitting(true);

      const now = new Date();
      const bookingDate = now.toISOString().split("T")[0];
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? "pm" : "am";
      const displayHours = hours % 12 || 12;
      const startTime = `${displayHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          cafe_id: cafeId,
          user_id: null,
          booking_date: bookingDate,
          start_time: startTime,
          duration: duration,
          total_amount: totalAmount,
          status: "in-progress",
          source: "walk-in",
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
        })
        .select()
        .single();

      if (bookingError) {
        console.error("Booking error:", bookingError);
        setError("Could not create booking. Please try again.");
        return;
      }

      // Create booking item
      const consoleInfo = CONSOLES.find(c => c.id === selectedConsole);
      const ticketId = `${selectedConsole}_${quantity}_${duration}`;

      const { error: itemError } = await supabase
        .from("booking_items")
        .insert({
          booking_id: booking.id,
          ticket_id: ticketId,
          console: selectedConsole,
          title: `${consoleInfo?.label || selectedConsole} - ${quantity}x ${duration}min`,
          price: totalAmount,
          quantity: quantity,
        });

      if (itemError) {
        console.error("Booking item error:", itemError);
        setError("Booking created but item failed. Please contact staff.");
        return;
      }

      // Success!
      setBookingId(booking.id.slice(0, 8).toUpperCase());
      setSuccess(true);

      // Reset form after 5 seconds
      setTimeout(() => {
        setCustomerName("");
        setCustomerPhone("");
        setQuantity(1);
        setDuration(60);
        if (availableConsoles.length > 0) {
          setSelectedConsole(availableConsoles[0]);
        }
        setSuccess(false);
        setBookingId("");
      }, 5000);

    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-red-600 via-cyan-500 to-blue-600 animate-spin mx-auto"></div>
            <Gamepad2 className="w-12 h-12 text-white absolute inset-0 m-auto" />
          </div>
          <div>
            <p className="text-gray-400 font-medium mb-2">Loading Gaming Zone...</p>
            <div className="w-48 h-2 bg-gray-800 rounded-full overflow-hidden mx-auto">
              <div className="h-full bg-gradient-to-r from-red-500 to-cyan-400 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !cafeId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-red-500/20 to-red-900/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Café Not Found</h1>
          <p className="text-gray-400 mb-8">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-lg font-semibold hover:opacity-90 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Filter consoles to show only available ones
  const availableConsoleOptions = CONSOLES.filter(c => availableConsoles.includes(c.id));

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
      </div>

      <div className="relative max-w-2xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Success State */}
        {success ? (
          <div className="text-center space-y-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-600/20 flex items-center justify-center mx-auto animate-pulse">
                <CheckCircle className="w-20 h-20 text-green-400" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-40 h-40 rounded-full border-2 border-green-400/30 animate-ping"></div>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                BOOKING CONFIRMED!
              </h1>
              <div className="inline-flex items-center gap-3 px-4 sm:px-6 py-3 bg-gradient-to-r from-gray-900 to-black border border-gray-800 rounded-full">
                <Hash className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                <span className="font-mono text-lg sm:text-xl font-bold">#{bookingId}</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl rounded-3xl border border-gray-800 p-6 sm:p-8">
              <div className="space-y-6">
                <div className="flex items-center justify-center gap-3 sm:gap-4">
                  <Receipt className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
                  <span className="text-xl sm:text-2xl font-bold">Payment Summary</span>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center py-4 border-b border-gray-800">
                    <span className="text-gray-400 text-sm sm:text-base">Console</span>
                    <span className="font-semibold text-sm sm:text-base">
                      {CONSOLES.find(c => c.id === selectedConsole)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-gray-800">
                    <span className="text-gray-400 text-sm sm:text-base">Players</span>
                    <span className="font-semibold text-sm sm:text-base">{quantity} person(s)</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-gray-800">
                    <span className="text-gray-400 text-sm sm:text-base">Duration</span>
                    <span className="font-semibold text-sm sm:text-base">{duration} minutes</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-red-500/10 to-red-900/10 border border-red-500/20 rounded-2xl p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-2">Total Amount</p>
                      <p className="text-2xl sm:text-3xl font-bold text-white">
                        ₹{totalAmount}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-gray-400 text-sm mb-2">Status</p>
                      <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full border border-green-500/30">
                        <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                        <span className="font-semibold text-xs sm:text-sm text-green-400">PENDING PAYMENT</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 mt-1" />
                    <div>
                      <p className="font-semibold text-cyan-400 text-sm sm:text-base">Proceed to Counter</p>
                      <p className="text-gray-400 text-xs sm:text-sm mt-1">
                        Show this booking ID at the counter for payment and seat allocation
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="text-center mb-6 sm:mb-10">
              <div className="inline-flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-red-600 via-cyan-500 to-blue-600 flex items-center justify-center">
                  <Gamepad2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-red-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    {cafeName}
                  </h1>
                  <p className="text-gray-400 text-xs sm:text-sm mt-1 sm:mt-2">Premium Gaming Experience</p>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-red-500/10 to-cyan-500/10 border border-red-500/20 rounded-full max-w-[90vw] mx-auto overflow-hidden">
                <CalendarClock className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 flex-shrink-0" />
                <span className="font-semibold text-xs sm:text-sm truncate">WALK-IN BOOKING</span>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-cyan-400 rounded-full animate-pulse flex-shrink-0"></div>
              </div>
            </div>

            {/* Main Card */}
            <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl rounded-3xl border border-gray-800 overflow-hidden mb-6 sm:mb-8 shadow-2xl">
              {/* Card Header */}
              <div className="p-4 sm:p-8 border-b border-gray-800">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-r from-red-500 to-cyan-500 flex items-center justify-center">
                      <Bolt className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-2xl font-bold">Quick Booking</h2>
                      <p className="text-gray-400 text-xs sm:text-sm">Fill details & start gaming instantly!</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-red-500/20 to-cyan-500/20 rounded-full border border-red-500/30 max-w-full overflow-hidden">
                      <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400 flex-shrink-0" />
                      <span className="font-semibold text-xs truncate">INSTANT CONFIRMATION</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-4 sm:p-8">
                {/* Error Message */}
                {error && (
                  <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-gradient-to-r from-red-500/10 to-red-900/10 border border-red-500/30 rounded-2xl">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0" />
                      <p className="font-semibold text-red-400 text-sm sm:text-base">{error}</p>
                    </div>
                  </div>
                )}

                {/* Personal Details Section */}
                <div className="mb-8 sm:mb-10">
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-r from-red-500/20 to-cyan-500/20 flex items-center justify-center">
                      <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold">Personal Details</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="text-xs sm:text-sm font-semibold text-gray-400 flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                        <User className="w-3 h-3 sm:w-4 sm:h-4" />
                        Your Name *
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Enter your full name"
                        disabled={submitting}
                        autoComplete="name"
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-900/50 border border-gray-800 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition text-center text-sm sm:text-base"
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="text-xs sm:text-sm font-semibold text-gray-400 flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                        <Smartphone className="w-3 h-3 sm:w-4 sm:h-4" />
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="10-digit mobile number"
                        disabled={submitting}
                        autoComplete="tel"
                        inputMode="numeric"
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-900/50 border border-gray-800 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition text-center text-sm sm:text-base"
                      />
                    </div>
                  </div>
                </div>

                {/* Console Selection */}
                <div className="mb-8 sm:mb-10">
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-r from-red-500/20 to-cyan-500/20 flex items-center justify-center">
                      <Cpu className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold mb-0.5 sm:mb-1">Select Gaming Console</h3>
                      <p className="text-gray-400 text-xs sm:text-sm">Choose your preferred gaming setup</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                    {availableConsoleOptions.map((console) => {
                      const isSelected = selectedConsole === console.id;

                      return (
                        <button
                          key={console.id}
                          type="button"
                          onClick={() => setSelectedConsole(console.id)}
                          disabled={submitting}
                          className={`relative p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center min-h-[110px] sm:min-h-[140px] w-full ${
                            isSelected 
                              ? 'border-cyan-500 scale-105 shadow-xl sm:shadow-2xl' 
                              : 'border-gray-800 hover:border-gray-700 hover:scale-102'
                          }`}
                        >
                          {/* Background Gradient */}
                          {isSelected && (
                            <div className={`absolute inset-0 bg-gradient-to-br ${console.gradient} opacity-10 rounded-xl sm:rounded-2xl`}></div>
                          )}

                          <div className="relative flex flex-col items-center justify-center w-full h-full space-y-2 sm:space-y-3">
                            <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${
                              isSelected 
                                ? `bg-gradient-to-br ${console.gradient}` 
                                : 'bg-gray-900'
                            }`}>
                              <div className={`${isSelected ? 'text-white' : 'text-gray-400'}`}>
                                {console.icon}
                              </div>
                            </div>
                            
                            <div className="font-semibold text-center text-sm sm:text-lg px-1 break-words">
                              {console.label}
                            </div>
                            
                            {isSelected && (
                              <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-cyan-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Players & Duration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 mb-8 sm:mb-10">
                  {/* Players Selection */}
                  <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                    <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-r from-red-500/20 to-cyan-500/20 flex items-center justify-center">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-base sm:text-lg">No. of Players</h4>
                        <p className="text-gray-400 text-xs sm:text-sm">Select number of players</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2 sm:gap-3">
                      {[1, 2, 3, 4].map((num) => {
                        const isSelected = quantity === num;

                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setQuantity(num)}
                            disabled={submitting}
                            className={`relative p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center min-h-[80px] sm:min-h-[100px] w-full ${
                              isSelected 
                                ? 'border-cyan-500 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 scale-105' 
                                : 'border-gray-800 hover:border-gray-700'
                            }`}
                          >
                            <div className="text-center space-y-1 sm:space-y-2">
                              <div className={`text-2xl sm:text-3xl font-bold ${isSelected ? 'text-cyan-400' : 'text-gray-400'}`}>
                                {num}
                              </div>
                              <div className={`text-xs sm:text-start ${isSelected ? 'text-cyan-400 font-semibold' : 'text-gray-500'}`}>
                                {num === 1 ? 'Player' : 'Players'}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Duration Selection */}
                  <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                    <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-r from-red-500/20 to-cyan-500/20 flex items-center justify-center">
                        <Timer className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-base sm:text-lg">Duration</h4>
                        <p className="text-gray-400 text-xs sm:text-sm">Select gaming session length</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <button
                        type="button"
                        onClick={() => setDuration(30)}
                        disabled={submitting}
                        className={`relative p-4 sm:p-6 rounded-lg sm:rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center min-h-[100px] sm:min-h-[120px] w-full ${
                          duration === 30 
                            ? 'border-cyan-500 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 scale-105' 
                            : 'border-gray-800 hover:border-gray-700'
                        }`}
                      >
                        <div className="text-center space-y-1.5 sm:space-y-3">
                          <div className={`text-3xl sm:text-4xl font-bold ${duration === 30 ? 'text-cyan-400' : 'text-gray-400'}`}>
                            30
                          </div>
                          <div className={`text-xs sm:text-sm ${duration === 30 ? 'text-cyan-400 font-semibold' : 'text-gray-500'}`}>
                            Minutes
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDuration(60)}
                        disabled={submitting}
                        className={`relative p-4 sm:p-6 rounded-lg sm:rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center min-h-[100px] sm:min-h-[120px] w-full ${
                          duration === 60 
                            ? 'border-red-500 bg-gradient-to-br from-red-500/20 to-pink-500/20 scale-105' 
                            : 'border-gray-800 hover:border-gray-700'
                        }`}
                      >
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                          <Crown className={`w-3 h-3 sm:w-4 sm:h-4 ${duration === 60 ? 'text-yellow-400' : 'text-gray-600'}`} />
                        </div>
                        <div className="text-center space-y-1.5 sm:space-y-3">
                          <div className={`text-3xl sm:text-4xl font-bold ${duration === 60 ? 'text-red-400' : 'text-gray-400'}`}>
                            60
                          </div>
                          <div className={`text-xs sm:text-sm ${duration === 60 ? 'text-red-400 font-semibold' : 'text-gray-500'}`}>
                            Minutes
                          </div>
                          <div className={`mt-1 sm:mt-2 text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full ${duration === 60 ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 text-gray-600'}`}>
                            Popular
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Amount Summary */}
                <div className="mb-6 sm:mb-8">
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-r from-red-500/20 to-cyan-500/20 flex items-center justify-center">
                      <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold">Payment Summary</h3>
                  </div>

                  <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-6">
                      <div className="text-center">
                        <p className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">Console</p>
                        <p className="font-semibold text-sm sm:text-lg">
                          {selectedConsole ? CONSOLES.find(c => c.id === selectedConsole)?.label : '--'}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">Players</p>
                        <p className="font-semibold text-sm sm:text-lg">{quantity}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">Duration</p>
                        <p className="font-semibold text-sm sm:text-lg">{duration} min</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">Total</p>
                        <p className="text-2xl sm:text-3xl font-bold text-cyan-400">
                          ₹{totalAmount}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-red-500/10 to-cyan-500/10 border border-red-500/20 rounded-lg sm:rounded-xl p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-cyan-400 text-sm sm:text-base">Pay at Counter</p>
                            <p className="text-gray-400 text-xs sm:text-sm">Complete payment at reception</p>
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full border border-green-500/30">
                            <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                            <span className="font-semibold text-xs sm:text-sm text-green-400">SECURE</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || !selectedConsole}
                  className={`w-full py-3 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 ${
                    submitting || !selectedConsole
                      ? 'bg-gray-900 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-red-600 via-red-500 to-cyan-500 hover:from-red-700 hover:via-red-600 hover:to-cyan-600 hover:scale-[1.02] active:scale-100 shadow-xl hover:shadow-2xl'
                  }`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                      <span className="text-sm sm:text-base">CREATING BOOKING...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span className="text-sm sm:text-base">CONFIRM WALK-IN BOOKING</span>
                      <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Info Banner */}
            <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-cyan-500/20 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-lg">Instant Gaming Access</h4>
                    <p className="text-gray-400 text-xs sm:text-sm">Your seat will be allocated immediately after booking</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-cyan-400">24/7</div>
                    <div className="text-gray-400 text-xs sm:text-sm">Support</div>
                  </div>
                  <div className="w-px h-6 sm:h-8 bg-gray-800"></div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-green-400">100%</div>
                    <div className="text-gray-400 text-xs sm:text-sm">Success Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}