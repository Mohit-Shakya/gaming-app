// Inventory Types - Can be removed along with inventory feature

export type InventoryCategory = 'snacks' | 'cold_drinks' | 'hot_drinks' | 'combo';

export interface InventoryItem {
  id: string;
  cafe_id: string;
  name: string;
  category: InventoryCategory;
  price: number;
  stock_quantity: number;
  is_available: boolean;
  created_at: string;
}

export interface BookingOrder {
  id: string;
  booking_id: string;
  inventory_item_id: string | null;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  ordered_at: string;
}

export interface CartItem {
  inventory_item_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export const CATEGORY_LABELS: Record<InventoryCategory, string> = {
  snacks: 'Snacks',
  cold_drinks: 'Cold Drinks',
  hot_drinks: 'Hot Drinks',
  combo: 'Combos',
};

export const CATEGORY_ICONS: Record<InventoryCategory, string> = {
  snacks: '🍿',
  cold_drinks: '🥤',
  hot_drinks: '☕',
  combo: '🎁',
};
