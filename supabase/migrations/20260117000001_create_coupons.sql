-- Recreate coupons table for V2 design
DROP TABLE IF EXISTS coupon_usage CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;

CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  
  -- Discount Details
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'flat')),
  discount_value DECIMAL(10,2) NOT NULL,
  max_discount_amount DECIMAL(10,2), -- Optional cap for percentage discounts
  bonus_minutes INTEGER DEFAULT 0,   -- Extra free time (can be combined with discount)
  
  -- Eligibility Conditions
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  new_customer_only BOOLEAN DEFAULT false,
  min_visits INTEGER DEFAULT 0,      -- For loyalty
  inactive_days_required INTEGER DEFAULT 0, -- For win-back campaigns
  
  -- Usage Limits
  max_uses INTEGER,                  -- Total global uses
  uses_count INTEGER DEFAULT 0,
  single_use_per_customer BOOLEAN DEFAULT false,
  
  -- Validity
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(cafe_id, code)
);

-- Recreate coupon_usage table
CREATE TABLE coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  user_phone VARCHAR(20),
  user_email VARCHAR(255),
  discount_applied DECIMAL(10,2),
  extra_minutes_applied INTEGER,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Update bookings table columns if they don't exist (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'coupon_id') THEN
        ALTER TABLE bookings ADD COLUMN coupon_id UUID REFERENCES coupons(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'coupon_discount') THEN
        ALTER TABLE bookings ADD COLUMN coupon_discount DECIMAL(10,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'coupon_extra_minutes') THEN
        ALTER TABLE bookings ADD COLUMN coupon_extra_minutes INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create indexes
CREATE INDEX idx_coupons_cafe_id ON coupons(cafe_id);
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_is_active ON coupons(is_active);
CREATE INDEX idx_coupon_usage_coupon_id ON coupon_usage(coupon_id);
CREATE INDEX idx_coupon_usage_user_phone ON coupon_usage(user_phone);

-- Enable RLS
-- Disable RLS explicitly as we are using custom auth
ALTER TABLE coupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage DISABLE ROW LEVEL SECURITY;

-- RLS Policies (Commented out as RLS is disabled)
/*
CREATE POLICY "Cafe owners can manage their coupons"
  ON coupons FOR ALL
  USING (
    cafe_id IN (SELECT id FROM cafes WHERE user_id = auth.uid())
  );

CREATE POLICY "Public can read active coupons"
  ON coupons FOR SELECT
  USING (is_active = true);

CREATE POLICY "Cafe owners can view coupon usage"
  ON coupon_usage FOR SELECT
  USING (
    coupon_id IN (
      SELECT c.id FROM coupons c
      JOIN cafes ca ON c.cafe_id = ca.id
      WHERE ca.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert coupon usage"
  ON coupon_usage FOR INSERT
  WITH CHECK (true);
*/

-- Updated validation function for V2
CREATE OR REPLACE FUNCTION validate_coupon(
  p_code VARCHAR,
  p_cafe_id UUID,
  p_order_amount DECIMAL,
  p_user_phone VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  is_valid BOOLEAN,
  coupon_id UUID,
  discount_type VARCHAR,
  discount_value DECIMAL,
  max_discount_amount DECIMAL,
  bonus_minutes INTEGER,
  error_message VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_coupon RECORD;
  v_usage_count INTEGER;
  v_customer_bookings INTEGER;
  v_last_booking TIMESTAMP;
BEGIN
  -- Find the coupon
  SELECT * INTO v_coupon
  FROM coupons
  WHERE code = UPPER(p_code)
    AND cafe_id = p_cafe_id
    AND is_active = true;

  -- Existence check
  IF v_coupon IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::VARCHAR, NULL::DECIMAL, NULL::DECIMAL, NULL::INTEGER, 'Invalid coupon code'::VARCHAR;
    RETURN;
  END IF;

  -- Date checks
  IF v_coupon.valid_from > now() THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::VARCHAR, NULL::DECIMAL, NULL::DECIMAL, NULL::INTEGER, 'Coupon not yet valid'::VARCHAR;
    RETURN;
  END IF;

  IF v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < now() THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::VARCHAR, NULL::DECIMAL, NULL::DECIMAL, NULL::INTEGER, 'Coupon has expired'::VARCHAR;
    RETURN;
  END IF;

  -- Global usage limit
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.uses_count >= v_coupon.max_uses THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::VARCHAR, NULL::DECIMAL, NULL::DECIMAL, NULL::INTEGER, 'Coupon usage limit reached'::VARCHAR;
    RETURN;
  END IF;

  -- Min order amount
  IF p_order_amount < v_coupon.min_order_amount THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::VARCHAR, NULL::DECIMAL, NULL::DECIMAL, NULL::INTEGER, 
      ('Minimum order amount is ₹' || v_coupon.min_order_amount)::VARCHAR;
    RETURN;
  END IF;

  -- Customer-specific checks (if phone provided)
  IF p_user_phone IS NOT NULL THEN
    -- Single use check
    IF v_coupon.single_use_per_customer THEN
      SELECT COUNT(*) INTO v_usage_count
      FROM coupon_usage
      WHERE coupon_id = v_coupon.id AND user_phone = p_user_phone;
      
      IF v_usage_count > 0 THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::VARCHAR, NULL::DECIMAL, NULL::DECIMAL, NULL::INTEGER, 'You have already used this coupon'::VARCHAR;
        RETURN;
      END IF;
    END IF;

    -- New customer check
    IF v_coupon.new_customer_only THEN
      SELECT COUNT(*) INTO v_customer_bookings
      FROM bookings
      WHERE customer_phone = p_user_phone AND status != 'cancelled';
      
      IF v_customer_bookings > 0 THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::VARCHAR, NULL::DECIMAL, NULL::DECIMAL, NULL::INTEGER, 'Coupon valid for new customers only'::VARCHAR;
        RETURN;
      END IF;
    END IF;

    -- Min visits (Loyalty) check
    IF v_coupon.min_visits > 0 THEN
      SELECT COUNT(*) INTO v_customer_bookings
      FROM bookings
      WHERE customer_phone = p_user_phone AND status = 'completed';
      
      IF v_customer_bookings < v_coupon.min_visits THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::VARCHAR, NULL::DECIMAL, NULL::DECIMAL, NULL::INTEGER, 
          ('Requires at least ' || v_coupon.min_visits || ' previous visits')::VARCHAR;
        RETURN;
      END IF;
    END IF;
  END IF;

  -- Valid
  RETURN QUERY SELECT 
    true,
    v_coupon.id,
    v_coupon.discount_type,
    v_coupon.discount_value,
    v_coupon.max_discount_amount,
    v_coupon.bonus_minutes,
    NULL::VARCHAR;
END;
$$;
