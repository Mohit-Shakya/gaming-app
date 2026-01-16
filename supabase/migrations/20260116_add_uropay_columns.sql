-- Add UROPAY payment columns to bookings table
-- Run this in your Supabase SQL Editor

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS uropay_order_id TEXT,
ADD COLUMN IF NOT EXISTS upi_reference TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_uropay_order_id ON bookings(uropay_order_id);

-- Optional: Create payment_logs table for webhook logging
CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,
  reference_number TEXT,
  amount DECIMAL(10,2),
  from_name TEXT,
  vpa TEXT,
  webhook_id TEXT,
  environment TEXT,
  raw_payload TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for deduplication
CREATE INDEX IF NOT EXISTS idx_payment_logs_webhook_id ON payment_logs(webhook_id);
