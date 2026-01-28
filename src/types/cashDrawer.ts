// Cash Drawer Types

export interface CashDrawerRecord {
  id: string;
  cafe_id: string;
  date: string; // YYYY-MM-DD

  // Opening balance (from previous day's closing or manually set)
  opening_balance: number;

  // Owner collection
  amount_collected: number | null;
  change_left: number | null;
  collection_time: string | null; // ISO timestamp

  // Staff verification of change amount
  staff_verified_change: boolean;
  staff_verified_at: string | null;

  // Closing verification
  expected_closing: number | null; // auto-calculated
  actual_closing: number | null; // if discrepancy, staff enters actual
  has_discrepancy: boolean;
  discrepancy_amount: number | null;
  discrepancy_note: string | null;
  closing_verified: boolean;
  closing_verified_at: string | null;

  created_at: string;
  updated_at: string;
}

export interface CashDrawerStatus {
  // Current state
  date: string;
  openingBalance: number;
  cashSalesToday: number;
  expectedInDrawer: number; // opening + cash sales (before collection)

  // Collection info (if done)
  hasCollected: boolean;
  amountCollected: number | null;
  changeLeft: number | null;
  collectionTime: string | null;
  staffVerifiedChange: boolean;

  // Cash sales after collection
  cashSalesAfterCollection: number;

  // Expected closing
  expectedClosing: number;

  // Closing verification
  closingVerified: boolean;
  hasDiscrepancy: boolean;
  discrepancyAmount: number | null;
}

export interface CashDrawerHistory {
  id: string;
  date: string;
  openingBalance: number;
  totalCashSales: number;
  amountCollected: number;
  changeLeft: number;
  expectedClosing: number;
  actualClosing: number | null;
  hasDiscrepancy: boolean;
  discrepancyAmount: number | null;
  discrepancyNote: string | null;
}
