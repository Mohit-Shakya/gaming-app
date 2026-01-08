-- Database Migrations for Membership and Tournament Features
-- Run this script in your Supabase SQL Editor

-- ============================================
-- 1. MEMBERSHIP TABLES
-- ============================================

-- Create membership_tiers table
CREATE TABLE IF NOT EXISTS public.membership_tiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  icon VARCHAR(10),
  color VARCHAR(20),
  monthly_price DECIMAL(10, 2) NOT NULL,
  yearly_price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  badge VARCHAR(50),
  features JSONB DEFAULT '[]'::jsonb,
  discount_percentage INTEGER DEFAULT 0,
  priority_hours INTEGER DEFAULT 24,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_memberships table
CREATE TABLE IF NOT EXISTS public.user_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_id UUID REFERENCES public.membership_tiers(id) ON DELETE SET NULL,
  billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  amount_paid DECIMAL(10, 2),
  payment_method VARCHAR(50),
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default membership tiers
INSERT INTO public.membership_tiers (name, icon, color, monthly_price, yearly_price, description, badge, discount_percentage, priority_hours, features) VALUES
('Bronze', '🥉', '#cd7f32', 299, 2870, 'Perfect for casual gamers', 'Popular', 10, 24,
  '["Access to all cafes", "10% discount on bookings", "Priority booking (24 hours)", "Monthly exclusive tournaments", "Member-only events", "Digital member badge"]'::jsonb),
('Silver', '🥈', '#c0c0c0', 599, 5750, 'For serious gamers', 'Best Value', 20, 48,
  '["Everything in Bronze +", "20% discount on bookings", "Priority booking (48 hours)", "Unlimited guest passes", "Monthly exclusive items", "Premium support (24/7)", "Leaderboard ranking", "Sponsor perks & discounts"]'::jsonb),
('Gold', '🏆', '#ffd700', 999, 9590, 'For pro gamers & enthusiasts', 'Pro Choice', 30, 72,
  '["Everything in Silver +", "30% discount on all services", "VIP priority booking", "Private game room access", "Exclusive merchandise", "Tournament priority entry", "Personal account manager", "Quarterly special events", "Referral rewards program"]'::jsonb),
('Platinum', '💎', '#e5e4e2', 1999, 19190, 'Ultimate gaming experience', 'Elite', 40, 168,
  '["Everything in Gold +", "40% discount on everything", "24/7 VIP concierge service", "Dedicated gaming setup", "All exclusive perks", "First access to new events", "Custom tournament hosting", "Annual luxury retreat", "Lifetime benefits card"]'::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================
-- 2. TOURNAMENT TABLES
-- ============================================

-- Create tournaments table
CREATE TABLE IF NOT EXISTS public.tournaments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  game VARCHAR(100) NOT NULL,
  icon VARCHAR(10),
  status VARCHAR(20) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  tournament_date DATE NOT NULL,
  tournament_time TIME NOT NULL,
  prize_amount DECIMAL(10, 2),
  prize_currency VARCHAR(10) DEFAULT '₹',
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  location VARCHAR(200),
  cafe_id UUID REFERENCES public.cafes(id) ON DELETE SET NULL,
  description TEXT,
  rules TEXT,
  color VARCHAR(20),
  registration_fee DECIMAL(10, 2) DEFAULT 0,
  registration_deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tournament_registrations table
CREATE TABLE IF NOT EXISTS public.tournament_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  player_name VARCHAR(100) NOT NULL,
  player_email VARCHAR(255) NOT NULL,
  player_phone VARCHAR(20),
  team_name VARCHAR(100),
  registration_status VARCHAR(20) DEFAULT 'pending' CHECK (registration_status IN ('pending', 'confirmed', 'cancelled', 'waitlisted')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_amount DECIMAL(10, 2),
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  UNIQUE(tournament_id, user_id)
);

-- Insert demo tournaments
INSERT INTO public.tournaments (name, game, icon, status, tournament_date, tournament_time, prize_amount, max_participants, current_participants, location, description, color) VALUES
('PS5 Pro League', 'FIFA 25', '🎮', 'upcoming', '2026-01-25', '18:00:00', 50000, 32, 12, 'Mumbai Gaming Hub', 'Competitive FIFA tournament for PS5 enthusiasts. Best teams from across Mumbai!', '#0070d1'),
('Racing Champions', 'Gran Turismo 7', '🏎️', 'ongoing', '2026-01-15', '20:00:00', 35000, 24, 18, 'Delhi Speed Track', 'High-speed racing tournament with live commentary and exciting prizes!', '#e10600'),
('VR Extreme', 'Half-Life: Alyx', '🥽', 'upcoming', '2026-02-10', '19:00:00', 40000, 16, 5, 'Bangalore VR Arena', 'Immersive VR gaming tournament with cutting-edge technology!', '#9945ff'),
('PC Gaming Masters', 'Counter-Strike 2', '💻', 'upcoming', '2026-02-05', '17:00:00', 60000, 16, 8, 'Hyderabad Cyber Cafe', 'Elite competitive gaming tournament for professional and amateur players!', '#ff073a')
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_memberships_user_id ON public.user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_status ON public.user_memberships(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON public.tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_date ON public.tournaments(tournament_date);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_tournament ON public.tournament_registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_user ON public.tournament_registrations(user_id);

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on tables
ALTER TABLE public.membership_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;

-- Membership tiers: Everyone can read
CREATE POLICY "Anyone can view membership tiers" ON public.membership_tiers
  FOR SELECT USING (true);

-- User memberships: Users can view their own
CREATE POLICY "Users can view own memberships" ON public.user_memberships
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memberships" ON public.user_memberships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memberships" ON public.user_memberships
  FOR UPDATE USING (auth.uid() = user_id);

-- Tournaments: Everyone can read
CREATE POLICY "Anyone can view tournaments" ON public.tournaments
  FOR SELECT USING (true);

-- Tournament registrations: Users can view their own
CREATE POLICY "Users can view own registrations" ON public.tournament_registrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can register for tournaments" ON public.tournament_registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own registrations" ON public.tournament_registrations
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 5. FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_membership_tiers_updated_at BEFORE UPDATE ON public.membership_tiers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_memberships_updated_at BEFORE UPDATE ON public.user_memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON public.tournaments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update tournament participant count
CREATE OR REPLACE FUNCTION update_tournament_participants()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.registration_status = 'confirmed') OR
     (TG_OP = 'UPDATE' AND NEW.registration_status = 'confirmed' AND OLD.registration_status != 'confirmed') THEN
    UPDATE public.tournaments
    SET current_participants = current_participants + 1
    WHERE id = NEW.tournament_id;
  ELSIF (TG_OP = 'UPDATE' AND NEW.registration_status != 'confirmed' AND OLD.registration_status = 'confirmed') OR
        (TG_OP = 'DELETE' AND OLD.registration_status = 'confirmed') THEN
    UPDATE public.tournaments
    SET current_participants = GREATEST(0, current_participants - 1)
    WHERE id = COALESCE(NEW.tournament_id, OLD.tournament_id);
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tournament_participant_count
  AFTER INSERT OR UPDATE OR DELETE ON public.tournament_registrations
  FOR EACH ROW EXECUTE FUNCTION update_tournament_participants();

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Next steps:
-- 1. Run this script in Supabase SQL Editor
-- 2. Verify tables were created successfully
-- 3. Check that demo data was inserted
-- 4. Test RLS policies by querying as authenticated user
