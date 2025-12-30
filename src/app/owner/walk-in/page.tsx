"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import useUser from "@/hooks/useUser";
import { CONSOLE_LABELS, CONSOLE_ICONS, CONSOLE_COLORS, type ConsoleId } from "@/lib/constants";

type BookingItem = {
  id: string;
  console: ConsoleId;
  quantity: number;
  duration: number;
};

export default function OwnerWalkInBooking() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [cafes, setCafes] = useState<any[]>([]);
  const [selectedCafe, setSelectedCafe] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState(() => {
    // Auto-set current time
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  });
  const [bookingItems, setBookingItems] = useState<BookingItem[]>([]);
  const [paymentMode, setPaymentMode] = useState<string>("cash");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [availableConsoles, setAvailableConsoles] = useState<ConsoleId[]>([]);
  const [previousCustomers, setPreviousCustomers] = useState<Array<{ name: string; phone: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<Array<{ name: string; phone: string }>>([]);
  const [activeSuggestionField, setActiveSuggestionField] = useState<'name' | 'phone' | null>(null);

  const consoleOptions: { id: ConsoleId; label: string; icon: string }[] = [
    { id: "ps5", label: CONSOLE_LABELS.ps5, icon: CONSOLE_ICONS.ps5 },
    { id: "ps4", label: CONSOLE_LABELS.ps4, icon: CONSOLE_ICONS.ps4 },
    { id: "xbox", label: CONSOLE_LABELS.xbox, icon: CONSOLE_ICONS.xbox },
    { id: "pc", label: CONSOLE_LABELS.pc, icon: CONSOLE_ICONS.pc },
    { id: "pool", label: CONSOLE_LABELS.pool, icon: CONSOLE_ICONS.pool },
    { id: "snooker", label: CONSOLE_LABELS.snooker, icon: CONSOLE_ICONS.snooker },
    { id: "arcade", label: CONSOLE_LABELS.arcade, icon: CONSOLE_ICONS.arcade },
    { id: "vr", label: CONSOLE_LABELS.vr, icon: CONSOLE_ICONS.vr },
    { id: "steering", label: CONSOLE_LABELS.steering, icon: CONSOLE_ICONS.steering },
  ];

  useEffect(() => {
    if (!user) return;

    async function loadCafes() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("cafes")
        .select("id, name")
        .eq("owner_id", user.id);

      if (!error && data) {
        setCafes(data);
        if (data.length > 0) {
          setSelectedCafe(data[0].id);
        }
      }
      setLoading(false);
    }

    loadCafes();
  }, [user]);

  // Fetch available consoles for selected cafe
  useEffect(() => {
    if (!selectedCafe) return;

    async function loadAvailableConsoles() {
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
          steering_wheel_count
        `)
        .eq("id", selectedCafe)
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
        setAvailableConsoles(available);
      }
    }

    loadAvailableConsoles();
  }, [selectedCafe]);

  // Fetch previous customers
  useEffect(() => {
    if (!selectedCafe) return;

    async function loadPreviousCustomers() {
      const { data, error } = await supabase
        .from("bookings")
        .select("customer_name, customer_phone")
        .eq("cafe_id", selectedCafe)
        .eq("source", "walk-in")
        .not("customer_name", "is", null)
        .not("customer_phone", "is", null)
        .order("created_at", { ascending: false })
        .limit(100);

      if (!error && data) {
        // Remove duplicates based on phone number
        const unique = data.reduce((acc: Array<{ name: string; phone: string }>, curr) => {
          if (!acc.find(c => c.phone === curr.customer_phone)) {
            acc.push({ name: curr.customer_name!, phone: curr.customer_phone! });
          }
          return acc;
        }, []);
        setPreviousCustomers(unique);
      }
    }

    loadPreviousCustomers();
  }, [selectedCafe]);

  // Handle name input change with autocomplete
  const handleNameChange = (value: string) => {
    setCustomerName(value);
    if (value.length > 0) {
      const filtered = previousCustomers.filter(c =>
        c.name.toLowerCase().startsWith(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setActiveSuggestionField('name');
    } else {
      setShowSuggestions(false);
      setActiveSuggestionField(null);
    }
  };

  // Handle phone input change with autocomplete
  const handlePhoneChange = (value: string) => {
    setCustomerPhone(value);
    if (value.length > 0) {
      const filtered = previousCustomers.filter(c =>
        c.phone.startsWith(value)
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setActiveSuggestionField('phone');
    } else {
      setShowSuggestions(false);
      setActiveSuggestionField(null);
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = (customer: { name: string; phone: string }) => {
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone);
    setShowSuggestions(false);
    setActiveSuggestionField(null);
  };

  const addBookingItem = () => {
    setBookingItems([
      ...bookingItems,
      {
        id: Math.random().toString(36).substr(2, 9),
        console: availableConsoles[0] || "ps5",
        quantity: 1,
        duration: 60,
      },
    ]);
  };

  const removeBookingItem = (id: string) => {
    setBookingItems(bookingItems.filter((item) => item.id !== id));
  };

  const updateBookingItem = (id: string, field: keyof BookingItem, value: any) => {
    setBookingItems(
      bookingItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSubmit = async () => {
    if (!selectedCafe || !customerName || !startTime || bookingItems.length === 0) {
      alert("Please fill in all required fields and add at least one console");
      return;
    }

    setSubmitting(true);

    try {
      // Calculate total amount (simplified - you may want to add pricing logic)
      const totalAmount = bookingItems.reduce((sum, item) => {
        const basePrice = 100; // Base price per console per hour
        return sum + (basePrice * item.quantity * (item.duration / 60));
      }, 0);

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          cafe_id: selectedCafe,
          customer_name: customerName,
          user_phone: customerPhone || null,
          booking_date: bookingDate,
          start_time: startTime,
          duration: bookingItems[0].duration, // Use first item's duration as main duration
          total_amount: totalAmount,
          status: "confirmed",
          source: "walk-in",
          payment_mode: paymentMode,
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Insert booking items
      const itemsToInsert = bookingItems.map((item) => ({
        booking_id: booking.id,
        console: item.console,
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("booking_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      alert("Bulk booking created successfully!");
      router.push("/owner");
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Failed to create booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (cafes.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p>No cafes found. Please create a cafe first.</p>
        <button onClick={() => router.push("/owner")}>Go to Dashboard</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", padding: 20 }}>
      <div style={{ maxWidth: 900, margin: "0 auto", paddingTop: 40, paddingBottom: 60 }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <button
            onClick={() => router.push("/owner")}
            style={{
              padding: "10px 20px",
              background: "rgba(148, 163, 184, 0.1)",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              borderRadius: 12,
              color: "#cbd5e1",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              marginBottom: 24,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "rgba(148, 163, 184, 0.15)";
              e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.3)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "rgba(148, 163, 184, 0.1)";
              e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.2)";
            }}
          >
            <span>←</span> Back to Dashboard
          </button>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: "#f1f5f9", margin: "0 0 12px 0", letterSpacing: "-0.5px" }}>
            🎮 Quick Booking
          </h1>
          <p style={{ fontSize: 17, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
            Create instant bookings for walk-in customers with multiple gaming stations
          </p>
        </div>

        {/* Form Card */}
        <div style={{
          background: "rgba(30, 41, 59, 0.6)",
          backdropFilter: "blur(20px)",
          borderRadius: 24,
          padding: 40,
          border: "1px solid rgba(148, 163, 184, 0.1)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        }}>
          {/* Customer Info */}
          <div style={{ marginBottom: 36 }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 20,
              paddingBottom: 16,
              borderBottom: "2px solid rgba(148, 163, 184, 0.1)"
            }}>
              <span style={{ fontSize: 24 }}>👤</span>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
                Customer Details
              </h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ position: "relative" }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginBottom: 10 }}>
                  Customer Name <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Enter full name"
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    background: "rgba(15, 23, 42, 0.8)",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: 12,
                    color: "#f1f5f9",
                    fontSize: 15,
                    outline: "none",
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#10b981";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(16, 185, 129, 0.1)";
                  }}
                  onBlur={(e) => {
                    // Delay to allow click on suggestion
                    const target = e.currentTarget;
                    setTimeout(() => {
                      if (target) {
                        target.style.borderColor = "rgba(148, 163, 184, 0.2)";
                        target.style.boxShadow = "none";
                      }
                      if (activeSuggestionField === 'name') {
                        setShowSuggestions(false);
                      }
                    }, 200);
                  }}
                />
                {/* Suggestions dropdown for name field */}
                {showSuggestions && activeSuggestionField === 'name' && filteredSuggestions.length > 0 && (
                  <div style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    marginTop: 4,
                    background: "rgba(15, 23, 42, 0.95)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: 12,
                    maxHeight: 200,
                    overflowY: "auto",
                    zIndex: 1000,
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
                  }}>
                    {filteredSuggestions.map((customer, index) => (
                      <div
                        key={index}
                        onClick={() => handleSuggestionClick(customer)}
                        style={{
                          padding: "12px 16px",
                          cursor: "pointer",
                          borderBottom: index < filteredSuggestions.length - 1 ? "1px solid rgba(148, 163, 184, 0.1)" : "none",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(16, 185, 129, 0.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#f1f5f9", marginBottom: 4 }}>
                          {customer.name}
                        </div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>
                          {customer.phone}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ position: "relative" }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginBottom: 10 }}>
                  Phone Number <span style={{ fontSize: 11, color: "#64748b" }}>(Optional)</span>
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="Enter phone number"
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    background: "rgba(15, 23, 42, 0.8)",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: 12,
                    color: "#f1f5f9",
                    fontSize: 15,
                    outline: "none",
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#10b981";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(16, 185, 129, 0.1)";
                  }}
                  onBlur={(e) => {
                    // Delay to allow click on suggestion
                    const target = e.currentTarget;
                    setTimeout(() => {
                      if (target) {
                        target.style.borderColor = "rgba(148, 163, 184, 0.2)";
                        target.style.boxShadow = "none";
                      }
                      if (activeSuggestionField === 'phone') {
                        setShowSuggestions(false);
                      }
                    }, 200);
                  }}
                />
                {/* Suggestions dropdown for phone field */}
                {showSuggestions && activeSuggestionField === 'phone' && filteredSuggestions.length > 0 && (
                  <div style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    marginTop: 4,
                    background: "rgba(15, 23, 42, 0.95)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: 12,
                    maxHeight: 200,
                    overflowY: "auto",
                    zIndex: 1000,
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
                  }}>
                    {filteredSuggestions.map((customer, index) => (
                      <div
                        key={index}
                        onClick={() => handleSuggestionClick(customer)}
                        style={{
                          padding: "12px 16px",
                          cursor: "pointer",
                          borderBottom: index < filteredSuggestions.length - 1 ? "1px solid rgba(148, 163, 184, 0.1)" : "none",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(16, 185, 129, 0.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#f1f5f9", marginBottom: 4 }}>
                          {customer.name}
                        </div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>
                          {customer.phone}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div style={{ marginBottom: 36 }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 20,
              paddingBottom: 16,
              borderBottom: "2px solid rgba(148, 163, 184, 0.1)"
            }}>
              <span style={{ fontSize: 24 }}>📅</span>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
                Booking Details
              </h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginBottom: 10 }}>
                  Date <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    background: "rgba(15, 23, 42, 0.8)",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: 12,
                    color: "#f1f5f9",
                    fontSize: 15,
                    outline: "none",
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#10b981";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(16, 185, 129, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.2)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginBottom: 10 }}>
                  Start Time <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    background: "rgba(15, 23, 42, 0.8)",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: 12,
                    color: "#f1f5f9",
                    fontSize: 15,
                    outline: "none",
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#10b981";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(16, 185, 129, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.2)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>
          </div>

          {/* Console Items */}
          <div style={{ marginBottom: 40 }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 20,
              paddingBottom: 16,
              borderBottom: "2px solid rgba(148, 163, 184, 0.1)"
            }}>
              <span style={{ fontSize: 24 }}>🎮</span>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9", margin: 0, flex: 1 }}>
                Gaming Stations
              </h3>
              <button
                onClick={addBookingItem}
                style={{
                  padding: "12px 24px",
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  border: "none",
                  borderRadius: 12,
                  color: "white",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(16, 185, 129, 0.4)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.3)";
                }}
              >
                <span style={{ fontSize: 18 }}>+</span> Add Station
              </button>
            </div>

            {bookingItems.length === 0 ? (
              <div style={{
                padding: 48,
                textAlign: "center",
                background: "rgba(15, 23, 42, 0.4)",
                borderRadius: 16,
                border: "2px dashed rgba(148, 163, 184, 0.2)",
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎮</div>
                <p style={{ color: "#94a3b8", margin: 0, fontSize: 15 }}>
                  No gaming stations added yet
                </p>
                <p style={{ color: "#64748b", margin: "8px 0 0 0", fontSize: 13 }}>
                  Click "Add Station" to begin creating your booking
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {bookingItems.map((item, index) => (
                  <div
                    key={item.id}
                    style={{
                      padding: 20,
                      background: "rgba(15, 23, 42, 0.6)",
                      borderRadius: 16,
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr 1fr auto",
                      gap: 16,
                      alignItems: "center",
                      transition: "all 0.2s",
                    }}
                  >
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#94a3b8", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Station Type
                      </label>
                      <select
                        value={item.console}
                        onChange={(e) => updateBookingItem(item.id, "console", e.target.value)}
                        style={{
                          width: "100%",
                          padding: "12px 14px",
                          background: "rgba(30, 41, 59, 0.8)",
                          border: "1px solid rgba(148, 163, 184, 0.2)",
                          borderRadius: 10,
                          color: "#f1f5f9",
                          fontSize: 14,
                          fontWeight: 500,
                          outline: "none",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = "#10b981";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.2)";
                        }}
                      >
                        {consoleOptions
                          .filter((console) => availableConsoles.includes(console.id))
                          .map((console) => (
                            <option key={console.id} value={console.id}>
                              {console.icon} {console.label}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#94a3b8", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Controllers
                      </label>
                      <select
                        value={item.quantity}
                        onChange={(e) => updateBookingItem(item.id, "quantity", parseInt(e.target.value))}
                        style={{
                          width: "100%",
                          padding: "12px 14px",
                          background: "rgba(30, 41, 59, 0.8)",
                          border: "1px solid rgba(148, 163, 184, 0.2)",
                          borderRadius: 10,
                          color: "#f1f5f9",
                          fontSize: 14,
                          fontWeight: 500,
                          outline: "none",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = "#10b981";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.2)";
                        }}
                      >
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#94a3b8", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Duration
                      </label>
                      <select
                        value={item.duration}
                        onChange={(e) => updateBookingItem(item.id, "duration", parseInt(e.target.value))}
                        style={{
                          width: "100%",
                          padding: "12px 14px",
                          background: "rgba(30, 41, 59, 0.8)",
                          border: "1px solid rgba(148, 163, 184, 0.2)",
                          borderRadius: 10,
                          color: "#f1f5f9",
                          fontSize: 14,
                          fontWeight: 500,
                          outline: "none",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = "#10b981";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.2)";
                        }}
                      >
                        <option value={30}>30 min</option>
                        <option value={60}>1 hour</option>
                        <option value={90}>1.5 hours</option>
                        <option value={120}>2 hours</option>
                        <option value={180}>3 hours</option>
                      </select>
                    </div>
                    <button
                      onClick={() => removeBookingItem(item.id)}
                      style={{
                        padding: "12px 16px",
                        background: "rgba(239, 68, 68, 0.1)",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        borderRadius: 10,
                        color: "#ef4444",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        marginTop: 20,
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = "#ef4444";
                        e.currentTarget.style.color = "white";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                        e.currentTarget.style.color = "#ef4444";
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Mode */}
          <div style={{ marginBottom: 32 }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 20,
              paddingBottom: 16,
              borderBottom: "2px solid rgba(148, 163, 184, 0.1)"
            }}>
              <span style={{ fontSize: 24 }}>💳</span>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
                Payment Mode
              </h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, maxWidth: 500 }}>
              <button
                type="button"
                onClick={() => setPaymentMode("cash")}
                style={{
                  padding: "20px",
                  background: paymentMode === "cash"
                    ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                    : "rgba(15, 23, 42, 0.6)",
                  border: paymentMode === "cash"
                    ? "2px solid #10b981"
                    : "2px solid rgba(148, 163, 184, 0.2)",
                  borderRadius: 12,
                  color: "#f1f5f9",
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: paymentMode === "cash"
                    ? "0 4px 12px rgba(16, 185, 129, 0.3)"
                    : "none",
                }}
                onMouseOver={(e) => {
                  if (paymentMode !== "cash") {
                    e.currentTarget.style.background = "rgba(15, 23, 42, 0.8)";
                    e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.3)";
                  }
                }}
                onMouseOut={(e) => {
                  if (paymentMode !== "cash") {
                    e.currentTarget.style.background = "rgba(15, 23, 42, 0.6)";
                    e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.2)";
                  }
                }}
              >
                <span style={{ fontSize: 32 }}>💵</span>
                <span>Cash</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode("upi")}
                style={{
                  padding: "20px",
                  background: paymentMode === "upi"
                    ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                    : "rgba(15, 23, 42, 0.6)",
                  border: paymentMode === "upi"
                    ? "2px solid #10b981"
                    : "2px solid rgba(148, 163, 184, 0.2)",
                  borderRadius: 12,
                  color: "#f1f5f9",
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: paymentMode === "upi"
                    ? "0 4px 12px rgba(16, 185, 129, 0.3)"
                    : "none",
                }}
                onMouseOver={(e) => {
                  if (paymentMode !== "upi") {
                    e.currentTarget.style.background = "rgba(15, 23, 42, 0.8)";
                    e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.3)";
                  }
                }}
                onMouseOut={(e) => {
                  if (paymentMode !== "upi") {
                    e.currentTarget.style.background = "rgba(15, 23, 42, 0.6)";
                    e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.2)";
                  }
                }}
              >
                <span style={{ fontSize: 32 }}>📱</span>
                <span>UPI</span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div style={{
            display: "flex",
            gap: 16,
            justifyContent: "flex-end",
            paddingTop: 24,
            borderTop: "2px solid rgba(148, 163, 184, 0.1)"
          }}>
            <button
              onClick={() => router.push("/owner")}
              disabled={submitting}
              style={{
                padding: "14px 32px",
                background: "rgba(148, 163, 184, 0.1)",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                borderRadius: 12,
                color: "#94a3b8",
                fontSize: 15,
                fontWeight: 600,
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.5 : 1,
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                if (!submitting) {
                  e.currentTarget.style.background = "rgba(148, 163, 184, 0.15)";
                  e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.3)";
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "rgba(148, 163, 184, 0.1)";
                e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.2)";
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !selectedCafe || !customerName || !startTime || bookingItems.length === 0}
              style={{
                padding: "14px 40px",
                background: submitting || !selectedCafe || !customerName || !startTime || bookingItems.length === 0
                  ? "rgba(16, 185, 129, 0.3)"
                  : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                border: "none",
                borderRadius: 12,
                color: "white",
                fontSize: 15,
                fontWeight: 700,
                cursor: submitting || !selectedCafe || !customerName || !startTime || bookingItems.length === 0
                  ? "not-allowed"
                  : "pointer",
                boxShadow: submitting || !selectedCafe || !customerName || !startTime || bookingItems.length === 0
                  ? "none"
                  : "0 4px 16px rgba(16, 185, 129, 0.4)",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
              onMouseOver={(e) => {
                if (!submitting && selectedCafe && customerName && startTime && bookingItems.length > 0) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(16, 185, 129, 0.5)";
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(16, 185, 129, 0.4)";
              }}
            >
              {submitting ? (
                <>
                  <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</span>
                  Creating...
                </>
              ) : (
                <>
                  <span>✓</span>
                  Create Booking
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
