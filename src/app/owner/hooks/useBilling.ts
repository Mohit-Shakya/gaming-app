/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ConsoleId } from "@/lib/constants";
import { BillingItem, PricingTier } from "../types";

type UseBillingProps = {
  selectedCafeId: string;
  consolePricing: Record<string, Record<string, PricingTier>>;
  stationPricing: Record<string, any>;
};

export function useBilling({ 
  selectedCafeId, 
  consolePricing, 
  stationPricing 
}: UseBillingProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  });
  const [items, setItems] = useState<BillingItem[]>([]);
  const [paymentMode, setPaymentMode] = useState<string>("cash");
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableConsoles, setAvailableConsoles] = useState<ConsoleId[]>([]);
  const [previousCustomers, setPreviousCustomers] = useState<Array<{ name: string; phone: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<Array<{ name: string; phone: string }>>([]);
  const [activeSuggestionField, setActiveSuggestionField] = useState<'name' | 'phone' | null>(null);

  // Helper function to get price
  const getBillingPrice = (consoleType: string, quantity: number, duration: number) => {
    // Try to get pricing from consolePricing (tier based)
    const pricingTier = consolePricing[selectedCafeId]?.[consoleType];

    // console.log('getBillingPrice:', { consoleType, quantity, duration, pricingTier, selectedCafeId });

    if (pricingTier) {
      if (duration === 90) {
        // 90min = 60min + 30min pricing
        const price60 = pricingTier[`qty${quantity}_60min` as keyof PricingTier] ?? 100;
        const price30 = pricingTier[`qty${quantity}_30min` as keyof PricingTier] ?? 50;
        return (price60 || 0) + (price30 || 0);
      } else if (duration === 120) {
        // 2 hours = 60min × 2
        const price60 = pricingTier[`qty${quantity}_60min` as keyof PricingTier] ?? 100;
        return (price60 || 0) * 2;
      } else if (duration === 180) {
        // 3 hours = 60min × 3
        const price60 = pricingTier[`qty${quantity}_60min` as keyof PricingTier] ?? 100;
        return (price60 || 0) * 3;
      } else {
        // 30min or 60min - direct lookup
        const qtyKey = `qty${quantity}_${duration}min` as keyof PricingTier;
        const tierPrice = pricingTier[qtyKey];

        if (tierPrice !== null && tierPrice !== undefined) {
          return tierPrice;
        }
      }
    }

    // Fallback: Try to get pricing from stationPricing
    const stationTypeMap: Record<string, string> = {
      "ps5": "PS5",
      "ps4": "PS4",
      "xbox": "Xbox",
      "pc": "PC",
      "pool": "Pool",
      "snooker": "Snooker",
      "arcade": "Arcade",
      "vr": "VR",
      "steering": "Steering",
      "steering_wheel": "Steering",
      "racing_sim": "Racing Sim",
    };
    const stationType = stationTypeMap[consoleType] || consoleType;

    const matchingStation = Object.values(stationPricing).find(
      (sp: any) => sp.station_type === stationType
    );

    if (matchingStation) {
      // PS5/Xbox use controller pricing
      if (stationType === "PS5" || stationType === "Xbox") {
        if (duration === 30) {
          return matchingStation[`controller_${quantity}_half_hour`] || 100;
        } else if (duration === 60) {
          return matchingStation[`controller_${quantity}_full_hour`] || 100;
        } else if (duration === 90) {
          const half = matchingStation[`controller_${quantity}_half_hour`] || 50;
          const full = matchingStation[`controller_${quantity}_full_hour`] || 100;
          return half + full;
        } else if (duration === 120) {
          return (matchingStation[`controller_${quantity}_full_hour`] || 100) * 2;
        } else if (duration === 180) {
          return (matchingStation[`controller_${quantity}_full_hour`] || 100) * 3;
        }
      }
      // PS4 uses single/multi player pricing
      else if (stationType === "PS4") {
        const isSingle = quantity === 1;
        if (duration === 30) {
          return isSingle
            ? matchingStation.single_player_half_hour_rate || 75
            : matchingStation.multi_player_half_hour_rate || 150;
        } else if (duration === 60) {
          return isSingle
            ? matchingStation.single_player_rate || 150
            : matchingStation.multi_player_rate || 300;
        } else if (duration === 90) {
          const half = isSingle
            ? matchingStation.single_player_half_hour_rate || 75
            : matchingStation.multi_player_half_hour_rate || 150;
          const full = isSingle
            ? matchingStation.single_player_rate || 150
            : matchingStation.multi_player_rate || 300;
          return half + full;
        } else if (duration === 120) {
          return (isSingle
            ? matchingStation.single_player_rate || 150
            : matchingStation.multi_player_rate || 300) * 2;
        } else if (duration === 180) {
          return (isSingle
            ? matchingStation.single_player_rate || 150
            : matchingStation.multi_player_rate || 300) * 3;
        }
      }
      // Other consoles use simple hourly rate
      else {
        if (duration === 30) {
          return matchingStation.half_hour_rate || 50;
        } else if (duration === 60) {
          return matchingStation.hourly_rate || 100;
        } else if (duration === 90) {
          return (matchingStation.half_hour_rate || 50) + (matchingStation.hourly_rate || 100);
        } else if (duration === 120) {
          return (matchingStation.hourly_rate || 100) * 2;
        } else if (duration === 180) {
          return (matchingStation.hourly_rate || 100) * 3;
        }
      }
    }

    // Default fallback
    return 100;
  };

  const addBillingItem = () => {
    const consoleType = availableConsoles[0] || "ps5";
    const quantity = 1;
    const duration = 60;
    const price = getBillingPrice(consoleType, quantity, duration);

    setItems([
      ...items,
      {
        id: Math.random().toString(36).substr(2, 9),
        console: consoleType,
        quantity: quantity,
        duration: duration,
        price: price,
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: string, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };

          // Recalculate price if console, quantity, or duration changed
          if (field === 'console' || field === 'quantity' || field === 'duration') {
            updatedItem.price = getBillingPrice(
              updatedItem.console,
              updatedItem.quantity,
              updatedItem.duration
            );
          }

          return updatedItem;
        }
        return item;
      })
    );
  };

  const resetForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setBookingDate(new Date().toISOString().split("T")[0]);
    const now = new Date();
    setStartTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    setItems([]);
    setPaymentMode("cash");
  };

  const handleSubmit = async () => {
    if (!selectedCafeId || !customerName || !startTime || items.length === 0) {
      alert("Please fill in all required fields and add at least one console");
      return;
    }

    setIsSubmitting(true);

    const [hours, minutes] = startTime.split(':').map(Number);
    const period = hours >= 12 ? 'pm' : 'am';
    const hours12 = hours % 12 || 12;
    const startTime12h = `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;

    try {
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          cafe_id: selectedCafeId,
          customer_name: customerName,
          customer_phone: customerPhone || null,
          booking_date: bookingDate,
          start_time: startTime12h,
          duration: items[0].duration,
          total_amount: totalAmount,
          status: "in-progress",
          source: "walk-in",
          payment_mode: paymentMode,
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      const itemsToInsert = items.map((item) => ({
        booking_id: booking.id,
        console: item.console,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from("booking_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      alert("Bulk booking created successfully!");
      resetForm();
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Failed to create booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update total amount
  useEffect(() => {
    const calculatedTotal = items.reduce((sum, item) => sum + item.price, 0);
    setTotalAmount(calculatedTotal);
  }, [items]);

  // Load available consoles
  useEffect(() => {
    if (!selectedCafeId) return;

    async function loadConsoles() {
      const { data, error } = await supabase
        .from("cafes")
        .select(`
          ps5_count,
          ps4_count,
          xbox_count,
          pc_count,
          pool_count,
          snooker_count,
          arcade_count,
          vr_count,
          steering_wheel_count,
          racing_sim_count
        `)
        .eq("id", selectedCafeId)
        .single();

      if (!error && data) {
        const available: ConsoleId[] = [];
        if (data.ps5_count > 0) available.push("ps5");
        if (data.ps4_count > 0) available.push("ps4");
        if (data.xbox_count > 0) available.push("xbox");
        if (data.pc_count > 0) available.push("pc");
        if (data.pool_count > 0) available.push("pool");
        if (data.snooker_count > 0) available.push("snooker");
        if (data.arcade_count > 0) available.push("arcade");
        if (data.vr_count > 0) available.push("vr");
        if (data.steering_wheel_count > 0) available.push("steering");
        if (data.racing_sim_count > 0) available.push("racing_sim");
        setAvailableConsoles(available);
      }
    }
    loadConsoles();
  }, [selectedCafeId]);

  // Load previous customers
  useEffect(() => {
    if (!selectedCafeId) return;

    async function loadCustomers() {
      const { data, error } = await supabase
        .from("bookings")
        .select("customer_name, customer_phone")
        .eq("cafe_id", selectedCafeId)
        .eq("source", "walk-in")
        .not("customer_name", "is", null)
        .order("created_at", { ascending: false })
        .limit(100);

      if (!error && data) {
        const unique = data.reduce((acc: Array<{ name: string; phone: string }>, curr) => {
          const phone = curr.customer_phone;
          if (phone && !acc.find(c => c.phone === phone)) {
            acc.push({ name: curr.customer_name!, phone: phone });
          }
          return acc;
        }, []);
        setPreviousCustomers(unique);
      }
    }
    loadCustomers();
  }, [selectedCafeId]);

  // Suggestions logic
  const handleNameChange = (val: string) => {
    setCustomerName(val);
    setActiveSuggestionField('name');
    if (val.length > 1) {
      const filtered = previousCustomers.filter(c => 
        c.name.toLowerCase().includes(val.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handlePhoneChange = (val: string) => {
    setCustomerPhone(val);
    setActiveSuggestionField('phone');
    if (val.length > 2) {
      const filtered = previousCustomers.filter(c => 
        c.phone?.includes(val)
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (customer: { name: string; phone: string }) => {
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone || "");
    setShowSuggestions(false);
  };

  return {
    customerName, setCustomerName,
    customerPhone, setCustomerPhone,
    bookingDate, setBookingDate,
    startTime, setStartTime,
    items, setItems,
    paymentMode, setPaymentMode,
    totalAmount,
    isSubmitting,
    availableConsoles,
    previousCustomers,
    showSuggestions, setShowSuggestions,
    filteredSuggestions,
    activeSuggestionField,
    addBillingItem,
    removeItem,
    updateItem,
    handleSubmit,
    handleNameChange,
    handlePhoneChange,
    handleSuggestionClick,
    getBillingPrice
  };
}
