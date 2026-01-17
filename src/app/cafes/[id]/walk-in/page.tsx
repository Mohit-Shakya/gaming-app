// src/app/cafes/[id]/walk-in/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import useUser from "@/hooks/useUser";
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
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const cafeIdOrSlug = typeof params?.id === "string" ? params.id : null;

  // Cafe data
  const [cafeId, setCafeId] = useState<string | null>(null);
  const [cafeName, setCafeName] = useState<string>("Gaming Café");
  const [cafePrice, setCafePrice] = useState<number>(150);
  const [loading, setLoading] = useState(true);
  const [availableConsoles, setAvailableConsoles] = useState<ConsoleId[]>([]);
  const [consolePricing, setConsolePricing] = useState<Partial<Record<ConsoleId, ConsolePricingTier>>>({});

  // User profile data (fetched after auth)
  const [profileData, setProfileData] = useState<{ fullName: string; phone: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Form data (no more customerName/Phone - using profile)
  const [selectedConsole, setSelectedConsole] = useState<ConsoleId | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [duration, setDuration] = useState<30 | 60>(60);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [bookingId, setBookingId] = useState<string>("");

  // Auth check - redirect to login if not authenticated
  useEffect(() => {
    if (userLoading) return;

    if (!user) {
      // Store current URL for redirect after login
      sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
      router.push("/login");
      return;
    }

    // User is logged in, fetch profile
    async function fetchProfile() {
      try {
        setProfileLoading(true);

        // Try to fetch profile - use first_name, last_name (not full_name)
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("first_name, last_name, phone, onboarding_complete")
          .eq("id", user!.id)
          .maybeSingle();

        // If profile doesn't exist or there's an error, use user metadata as fallback
        if (profileError) {
          console.warn("Profile fetch warning:", profileError);
          // Use user metadata from auth as fallback
          const userName = user!.user_metadata?.full_name || user!.email?.split("@")[0] || "Guest";
          setProfileData({
            fullName: userName,
            phone: user!.user_metadata?.phone || "",
          });
          setProfileLoading(false);
          return;
        }

        // If profile exists but onboarding not complete
        if (!profile?.onboarding_complete) {
          // Check if we have basic data - if so, continue; if not, redirect
          const profileName = profile?.first_name ? `${profile.first_name} ${profile.last_name || ""}`.trim() : null;
          const userName = profileName || user!.user_metadata?.full_name || user!.email?.split("@")[0];
          if (userName) {
            // Profile has enough data to proceed
            setProfileData({
              fullName: userName,
              phone: profile?.phone || "",
            });
            setProfileLoading(false);
            return;
          }
          // Profile incomplete, redirect to onboarding
          sessionStorage.setItem("redirectAfterOnboarding", window.location.pathname);
          router.push("/onboarding");
          return;
        }

        const displayName = profile.first_name
          ? `${profile.first_name} ${profile.last_name || ""}`.trim()
          : (user!.user_metadata?.full_name || user!.email?.split("@")[0] || "Guest");
        setProfileData({
          fullName: displayName,
          phone: profile.phone || "",
        });
        setProfileLoading(false);
      } catch (err) {
        console.error("Profile fetch error:", err);
        // Fallback to user metadata
        setProfileData({
          fullName: user!.user_metadata?.full_name || user!.email?.split("@")[0] || "Guest",
          phone: "",
        });
        setProfileLoading(false);
      }
    }

    fetchProfile();
  }, [user, userLoading, router]);

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

        let pricing: Partial<Record<ConsoleId, ConsolePricingTier>> = {};

        if (!pricingError && pricingData && pricingData.length > 0) {
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
        } else {
          // Fallback: Load from station_pricing table (used by owner dashboard)
          const { data: stationPricingData, error: stationPricingError } = await supabase
            .from("station_pricing")
            .select("station_type, controller_1_half_hour, controller_1_full_hour, controller_2_half_hour, controller_2_full_hour, controller_3_half_hour, controller_3_full_hour, controller_4_half_hour, controller_4_full_hour, half_hour_rate, hourly_rate, single_player_half_hour_rate, single_player_rate, multi_player_half_hour_rate, multi_player_rate")
            .eq("cafe_id", data.id);

          if (!stationPricingError && stationPricingData && stationPricingData.length > 0) {
            // Group by station_type and use the first station's pricing for each type
            const stationTypeMap: Record<string, any> = {};
            stationPricingData.forEach((sp: any) => {
              if (!stationTypeMap[sp.station_type]) {
                stationTypeMap[sp.station_type] = sp;
              }
            });

            // Convert station_type (Title Case) to ConsoleId (lowercase)
            const typeToConsoleId: Record<string, ConsoleId> = {
              "PS5": "ps5",
              "PS4": "ps4",
              "Xbox": "xbox",
              "PC": "pc",
              "Pool": "pool",
              "Snooker": "snooker",
              "Arcade": "arcade",
              "VR": "vr",
              "Steering": "steering_wheel",
            };

            Object.entries(stationTypeMap).forEach(([stationType, sp]: [string, any]) => {
              const consoleId = typeToConsoleId[stationType];
              if (!consoleId) return;

              const tier: ConsolePricingTier = {
                qty1_30min: null,
                qty1_60min: null,
                qty2_30min: null,
                qty2_60min: null,
                qty3_30min: null,
                qty3_60min: null,
                qty4_30min: null,
                qty4_60min: null,
              };

              // PS5/Xbox use controller pricing
              if (stationType === "PS5" || stationType === "Xbox") {
                tier.qty1_30min = sp.controller_1_half_hour || null;
                tier.qty1_60min = sp.controller_1_full_hour || null;
                tier.qty2_30min = sp.controller_2_half_hour || null;
                tier.qty2_60min = sp.controller_2_full_hour || null;
                tier.qty3_30min = sp.controller_3_half_hour || null;
                tier.qty3_60min = sp.controller_3_full_hour || null;
                tier.qty4_30min = sp.controller_4_half_hour || null;
                tier.qty4_60min = sp.controller_4_full_hour || null;
              }
              // PS4 uses single/multi player pricing
              else if (stationType === "PS4") {
                tier.qty1_30min = sp.single_player_half_hour_rate || null;
                tier.qty1_60min = sp.single_player_rate || null;
                tier.qty2_30min = sp.multi_player_half_hour_rate || null;
                tier.qty2_60min = sp.multi_player_rate || null;
                // For 3-4 players, use multi-player pricing
                tier.qty3_30min = sp.multi_player_half_hour_rate || null;
                tier.qty3_60min = sp.multi_player_rate || null;
                tier.qty4_30min = sp.multi_player_half_hour_rate || null;
                tier.qty4_60min = sp.multi_player_rate || null;
              }
              // Other consoles (PC, VR, Pool, etc.) use simple hourly pricing
              else {
                tier.qty1_30min = sp.half_hour_rate || null;
                tier.qty1_60min = sp.hourly_rate || null;
                // For these, quantity doesn't multiply the price per person
                tier.qty2_30min = sp.half_hour_rate || null;
                tier.qty2_60min = sp.hourly_rate || null;
                tier.qty3_30min = sp.half_hour_rate || null;
                tier.qty3_60min = sp.hourly_rate || null;
                tier.qty4_30min = sp.half_hour_rate || null;
                tier.qty4_60min = sp.hourly_rate || null;
              }

              pricing[consoleId] = tier;
            });
          }
        }

        setConsolePricing(pricing);

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
    if (!profileData) {
      setError("Profile not loaded. Please refresh the page.");
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

    if (!user) {
      setError("You must be logged in to book");
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

      // Create booking with user_id (linked to user's account)
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          cafe_id: cafeId,
          user_id: user.id,
          booking_date: bookingDate,
          start_time: startTime,
          duration: duration,
          total_amount: totalAmount,
          status: "in-progress",
          source: "walk-in",
          customer_name: profileData.fullName,
          customer_phone: profileData.phone,
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
    <div className="min-h-screen bg-black text-white relative overflow-hidden font-sans selection:bg-cyan-500/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-600/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-cyan-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[20%] right-[20%] w-[30vw] h-[30vw] bg-blue-600/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 p-4 sm:p-6 lg:p-10 pb-32 sm:pb-10 max-w-[1600px] mx-auto">
        {success ? (
          <div className="flex flex-col items-center justify-center min-h-[80vh] max-w-lg mx-auto animate-in fade-in zoom-in duration-500">
            <div className="relative mb-8">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center animate-pulse">
                <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-400" />
              </div>
              <div className="absolute inset-0 border-4 border-green-500/30 rounded-full animate-[spin_3s_linear_infinite]"></div>
            </div>

            <h1 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent mb-4 text-center">
              Booking Confirmed!
            </h1>

            <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-3xl p-6 sm:p-8 w-full shadow-2xl">
              <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-800">
                <span className="text-gray-400">Booking ID</span>
                <span className="font-mono text-xl sm:text-2xl font-bold text-cyan-400">#{bookingId}</span>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-base sm:text-lg">
                  <span className="text-gray-300">Console</span>
                  <span className="font-semibold">{CONSOLES.find(c => c.id === selectedConsole)?.label}</span>
                </div>
                <div className="flex justify-between text-base sm:text-lg">
                  <span className="text-gray-300">Controllers</span>
                  <span className="font-semibold">{quantity}</span>
                </div>
                <div className="flex justify-between text-base sm:text-lg">
                  <span className="text-gray-300">Duration</span>
                  <span className="font-semibold">{duration} min</span>
                </div>
                <div className="flex justify-between text-xl sm:text-2xl font-bold pt-4 border-t border-gray-800">
                  <span className="text-white">Amount</span>
                  <span className="text-green-400">₹{totalAmount}</span>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 flex items-start gap-3">
                <Receipt className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-yellow-500 text-sm">Action Required</p>
                  <p className="text-yellow-200/80 text-sm mt-1">Please show this screen at the counter to complete payment and get your station.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <header className="flex flex-col md:flex-row items-center justify-between mb-8 sm:mb-12 gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <Gamepad2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-white">{cafeName}</h1>
                  <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Walk-in Booking
                  </div>
                </div>
              </div>

              {/* User Profile Card */}
              {profileData && (
                <div className="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-full pl-2 pr-6 py-2 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-sm font-bold">
                    {profileData.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white leading-none">{profileData.fullName}</span>
                    <span className="text-xs text-gray-400 leading-none mt-1">{profileData.phone || "No phone"}</span>
                  </div>
                </div>
              )}
            </header>

            <form id="booking-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12">

              {/* LEFT COLUMN: Console Selection */}
              <div className="lg:col-span-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-cyan-400" />
                    Select Console
                  </h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {availableConsoleOptions.map((console) => {
                    const isSelected = selectedConsole === console.id;
                    return (
                      <button
                        key={console.id}
                        type="button"
                        onClick={() => setSelectedConsole(console.id)}
                        disabled={submitting}
                        className={`group relative aspect-[4/3] flex flex-col items-center justify-center rounded-3xl border-2 transition-all duration-300 overflow-hidden ${isSelected
                          ? 'border-cyan-500 shadow-[0_0_30px_-10px_rgba(6,182,212,0.6)]'
                          : 'border-gray-800 hover:border-gray-700 bg-gray-900/40 hover:bg-gray-900/60'
                          }`}
                      >
                        {/* Console Background Gradient */}
                        {isSelected && (
                          <div className={`absolute inset-0 bg-gradient-to-br ${console.gradient} opacity-20 transition-opacity`}></div>
                        )}

                        <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110 ${isSelected
                          ? `bg-gradient-to-br ${console.gradient} text-white shadow-lg`
                          : 'bg-gray-800 text-gray-400 group-hover:bg-gray-700 group-hover:text-white'
                          }`}>
                          {console.icon}
                        </div>

                        <span className={`relative font-bold text-lg ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                          {console.label}
                        </span>

                        {isSelected && (
                          <div className="absolute top-3 right-3">
                            <CheckCircle className="w-6 h-6 text-cyan-400" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* RIGHT COLUMN: Configuration & Summary */}
              <div className="lg:col-span-4 space-y-6">

                {/* Session Setup Card */}
                <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                  {/* Gradient Border Overlay */}
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>

                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-400" />
                    Session Configuration
                  </h3>

                  {/* Controllers Selector */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-sm text-gray-400 font-medium">Controllers</label>
                      <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-md">{quantity} selected</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 bg-black/40 p-1.5 rounded-2xl border border-gray-800">
                      {[1, 2, 3, 4].map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setQuantity(num)}
                          className={`h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-all duration-300 ${quantity === num
                            ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg'
                            : 'text-gray-500 hover:text-white hover:bg-gray-800'
                            }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Duration Selector */}
                  <div>
                    <label className="text-sm text-gray-400 font-medium block mb-3">Duration</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setDuration(30)}
                        className={`h-14 rounded-2xl border-2 flex items-center justify-center gap-2 transition-all ${duration === 30
                          ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                          : 'border-gray-800 bg-gray-900/20 text-gray-500 hover:border-gray-700'
                          }`}
                      >
                        <Clock className="w-5 h-5" />
                        <span className="font-bold">30 mins</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDuration(60)}
                        className={`h-14 rounded-2xl border-2 flex items-center justify-center gap-2 transition-all ${duration === 60
                          ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                          : 'border-gray-800 bg-gray-900/20 text-gray-500 hover:border-gray-700'
                          }`}
                      >
                        <Crown className="w-5 h-5" />
                        <span className="font-bold">1 Hour</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pricing Summary & Action */}
                <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-3xl p-6 shadow-2xl">
                  <div className="flex items-end justify-between mb-6">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Total Amount</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-white">₹{totalAmount}</span>
                        <span className="text-sm text-gray-500">
                          / {duration}m
                        </span>
                      </div>
                    </div>
                    {/* Pay Tag */}
                    <div className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      PAY AT COUNTER
                    </div>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <p className="text-sm text-red-400 font-medium">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || !selectedConsole}
                    className={`hidden lg:flex w-full py-4 rounded-2xl font-bold text-lg items-center justify-center gap-3 shadow-xl transition-all ${submitting || !selectedConsole
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-white text-black hover:scale-[1.02] active:scale-[0.98]'
                      }`}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <span>Confirm Booking</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs text-gray-500 mt-4">
                    By confirming, you agree to the updated terms of service.
                  </p>
                </div>

              </div>
            </form>
            {/* Mobile Sticky Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900/90 backdrop-blur-xl border-t border-gray-800 lg:hidden z-50">
              <div className="flex items-center gap-4 max-w-md mx-auto">
                <div className="flex-1">
                  <p className="text-xs text-gray-400">Total Amount</p>
                  <div className="flex items-baseline gap-1">
                    <p className="text-2xl font-bold text-white">₹{totalAmount}</p>
                    <span className="text-xs text-gray-500">/ {duration}m</span>
                  </div>
                </div>
                <button
                  type="submit"
                  form="booking-form"
                  disabled={submitting || !selectedConsole}
                  className={`flex-1 py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-lg ${submitting || !selectedConsole
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                    }`}
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Confirm</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}