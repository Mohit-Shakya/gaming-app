// View Orders Modal - For viewing and removing F&B items from bookings
// Can be removed along with inventory feature
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { X, Trash2, Loader2, ShoppingBag, Package } from "lucide-react";
import { BookingOrder } from "@/types/inventory";

interface ViewOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  customerName: string;
  onOrdersUpdated: () => void;
}

export default function ViewOrdersModal({
  isOpen,
  onClose,
  bookingId,
  customerName,
  onOrdersUpdated,
}: ViewOrdersModalProps) {
  const [orders, setOrders] = useState<BookingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && bookingId) {
      loadOrders();
    }
  }, [isOpen, bookingId]);

  async function loadOrders() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("booking_orders")
        .select("*")
        .eq("booking_id", bookingId)
        .order("ordered_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error("Error loading orders:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveOrder(order: BookingOrder) {
    if (!confirm(`Remove ${order.item_name} x${order.quantity} from this booking?`)) {
      return;
    }

    try {
      setDeleting(order.id);

      // Delete the order
      const { error: deleteError } = await supabase
        .from("booking_orders")
        .delete()
        .eq("id", order.id);

      if (deleteError) throw deleteError;

      // Restore inventory stock
      if (order.inventory_item_id) {
        const { data: inventoryItem } = await supabase
          .from("inventory_items")
          .select("stock_quantity")
          .eq("id", order.inventory_item_id)
          .single();

        if (inventoryItem) {
          await supabase
            .from("inventory_items")
            .update({ stock_quantity: inventoryItem.stock_quantity + order.quantity })
            .eq("id", order.inventory_item_id);
        }
      }

      // Update booking total
      const { data: booking } = await supabase
        .from("bookings")
        .select("total_amount")
        .eq("id", bookingId)
        .single();

      if (booking) {
        await supabase
          .from("bookings")
          .update({ total_amount: (booking.total_amount || 0) - order.total_price })
          .eq("id", bookingId);
      }

      // Refresh orders list
      await loadOrders();
      onOrdersUpdated();
    } catch (err) {
      console.error("Error removing order:", err);
      alert("Failed to remove item. Please try again.");
    } finally {
      setDeleting(null);
    }
  }

  const totalAmount = orders.reduce((sum, o) => sum + (o.total_price || 0), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-cyan-500" />
              F&B Orders
            </h3>
            <p className="text-sm text-slate-400 mt-0.5">
              {customerName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No F&B items added</p>
              <p className="text-sm text-slate-500 mt-1">
                Items added during the session will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 rounded-xl"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white">
                      {order.item_name}
                    </div>
                    <div className="flex items-center gap-3 text-sm mt-1">
                      <span className="text-slate-400">
                        ₹{order.unit_price} × {order.quantity}
                      </span>
                      <span className="text-cyan-400 font-semibold">
                        ₹{order.total_price}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {new Date(order.ordered_at).toLocaleString("en-IN", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveOrder(order)}
                    disabled={deleting === order.id}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition disabled:opacity-50"
                    title="Remove item"
                  >
                    {deleting === order.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {orders.length > 0 && (
          <div className="border-t border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total F&B Amount</span>
              <span className="text-xl font-bold text-cyan-400">₹{totalAmount}</span>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="p-4 pt-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
