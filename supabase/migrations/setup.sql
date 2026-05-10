-- ============================================================
-- ServiceScout: Complete Supabase Setup Script
-- Run this ONCE on a fresh Supabase project.
-- Sets up all tables, policies, functions, and seed data.
-- ============================================================

-- ─────────────────────────────────────────────────────
-- 1. Enums
-- ─────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'provider', 'customer');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
    CREATE TYPE public.booking_status AS ENUM ('pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'disputed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE public.payment_status AS ENUM ('unpaid', 'escrow', 'released', 'refunded');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dispute_status') THEN
    CREATE TYPE public.dispute_status AS ENUM ('open', 'resolved', 'refunded');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'provider_status') THEN
    CREATE TYPE public.provider_status AS ENUM ('pending', 'approved', 'suspended', 'rejected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'txn_type') THEN
    CREATE TYPE public.txn_type AS ENUM ('credit', 'debit', 'commission', 'withdrawal', 'refund');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'withdrawal_status') THEN
    CREATE TYPE public.withdrawal_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END $$;

-- ─────────────────────────────────────────────────────
-- 2. Utility functions
-- ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

-- ─────────────────────────────────────────────────────
-- 3. Core tables
-- ─────────────────────────────────────────────────────

-- user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  address TEXT,
  city TEXT,
  zip_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- service_categories
CREATE TABLE IF NOT EXISTS public.service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

-- services (price = hourly rate)
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.service_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- providers
CREATE TABLE IF NOT EXISTS public.providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  bio TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  city TEXT,
  zip_code TEXT,
  commission_rate NUMERIC(5,2),
  rating NUMERIC(3,2) DEFAULT 0,
  total_jobs INTEGER DEFAULT 0,
  wallet_balance NUMERIC(10,2) DEFAULT 0,
  status public.provider_status NOT NULL DEFAULT 'pending',
  verification_doc_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- provider_schedules
CREATE TABLE IF NOT EXISTS public.provider_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL DEFAULT '09:00',
  end_time TIME NOT NULL DEFAULT '17:00',
  is_off_day BOOLEAN NOT NULL DEFAULT false
);
ALTER TABLE public.provider_schedules ENABLE ROW LEVEL SECURITY;

-- provider_services (which providers can fulfill which services)
CREATE TABLE IF NOT EXISTS public.provider_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider_id, service_id)
);
ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;

-- bookings (provider_id nullable — admin assigns later)
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  service_address TEXT,
  service_city TEXT,
  service_zip TEXT,
  notes TEXT,
  booking_duration_minutes INTEGER,
  total_amount NUMERIC(10,2) NOT NULL,
  commission_amount NUMERIC(10,2) DEFAULT 0,
  provider_earning NUMERIC(10,2) DEFAULT 0,
  status public.booking_status NOT NULL DEFAULT 'pending',
  payment_status public.payment_status NOT NULL DEFAULT 'unpaid',
  customer_confirmed BOOLEAN NOT NULL DEFAULT false,
  transaction_id TEXT,
  payway_transaction_id TEXT,
  payway_receipt_number TEXT,
  payway_response_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- reviews (one per booking)
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (booking_id)
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- payment_transactions
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  payway_transaction_id TEXT,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase','authorise','capture','refund','query')),
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  response_code TEXT,
  response_message TEXT,
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- disputes
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  raised_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status public.dispute_status NOT NULL DEFAULT 'open',
  resolution_note TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- wallet_transactions
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  type public.txn_type NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  balance_after NUMERIC(10,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- withdrawal_requests
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  method TEXT,
  account_details TEXT,
  status public.withdrawal_status NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- platform_settings
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id SERIAL PRIMARY KEY,
  site_name TEXT NOT NULL DEFAULT 'ServiceScout',
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 10,
  currency TEXT NOT NULL DEFAULT 'AUD',
  currency_symbol TEXT NOT NULL DEFAULT '$',
  payment_mode TEXT NOT NULL DEFAULT 'sale' CHECK (payment_mode IN ('sale', 'pre_auth')),
  payway_merchant_id TEXT,
  payway_test_mode BOOLEAN NOT NULL DEFAULT true
);

-- ─────────────────────────────────────────────────────
-- 4. Triggers: updated_at
-- ─────────────────────────────────────────────────────
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_services_updated BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_providers_updated BEFORE UPDATE ON public.providers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_bookings_updated BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────
-- 5. Booking lifecycle functions & triggers
-- ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_booking()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE prov_user UUID;
BEGIN
  IF NEW.provider_id IS NOT NULL THEN
    SELECT user_id INTO prov_user FROM public.providers WHERE id = NEW.provider_id;
    IF FOUND THEN
      INSERT INTO public.notifications(user_id, title, message, link)
      VALUES (prov_user, 'New booking assigned',
              'You have been assigned a booking scheduled for ' || NEW.scheduled_at::text,
              '/provider/bookings');
    END IF;
  END IF;
  INSERT INTO public.notifications(user_id, title, message, link)
  VALUES (NEW.customer_id, 'Booking confirmed',
          'Your service booking has been confirmed. Booking #' || substr(NEW.id::text,1,8),
          '/dashboard');
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.handle_new_booking() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_booking_completion()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE prov_user UUID; new_bal NUMERIC;
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' AND NEW.provider_id IS NOT NULL THEN
    SELECT user_id, wallet_balance + NEW.provider_earning
      INTO prov_user, new_bal
      FROM public.providers WHERE id = NEW.provider_id;

    UPDATE public.providers
       SET wallet_balance = new_bal,
           total_jobs = COALESCE(total_jobs,0) + 1
     WHERE id = NEW.provider_id;

    INSERT INTO public.wallet_transactions(provider_id, booking_id, type, amount, balance_after, description)
    VALUES (NEW.provider_id, NEW.id, 'credit', NEW.provider_earning, new_bal,
            'Earnings for booking #' || substr(NEW.id::text,1,8));

    NEW.payment_status := 'released';

    INSERT INTO public.notifications(user_id, title, message, link)
    VALUES (prov_user, 'Payment released',
            '$' || NEW.provider_earning || ' added to your wallet',
            '/provider/earnings');
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications(user_id, title, message, link)
    VALUES (NEW.customer_id, 'Booking ' || NEW.status,
            'Your booking status changed to ' || NEW.status, '/dashboard');
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.handle_booking_completion() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_new_booking AFTER INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.handle_new_booking();
CREATE TRIGGER trg_booking_completion BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.handle_booking_completion();

-- ─────────────────────────────────────────────────────
-- 6. Profile auto-create on signup
-- ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────
-- 7. has_role helper function
-- ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ─────────────────────────────────────────────────────
-- 8. Row Level Security Policies
-- ─────────────────────────────────────────────────────

-- ── user_roles ──
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System insert roles" ON public.user_roles FOR INSERT WITH CHECK (true);

-- ── profiles ──
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "System insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- ── service_categories ──
CREATE POLICY "Anyone view categories" ON public.service_categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.service_categories FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ── services ──
CREATE POLICY "Anyone view services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Admins manage services" ON public.services FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ── providers ──
CREATE POLICY "Anyone view approved providers" ON public.providers FOR SELECT USING (status = 'approved');
CREATE POLICY "Providers manage own profile" ON public.providers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Providers update own profile" ON public.providers FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Providers insert own profile" ON public.providers FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins manage providers" ON public.providers FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ── provider_schedules ──
CREATE POLICY "Providers manage own schedules" ON public.provider_schedules FOR ALL USING (
  EXISTS (SELECT 1 FROM public.providers WHERE providers.id = provider_schedules.provider_id AND providers.user_id = auth.uid())
);
CREATE POLICY "Admins manage schedules" ON public.provider_schedules FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ── provider_services ──
CREATE POLICY "Anyone view provider services" ON public.provider_services FOR SELECT USING (true);
CREATE POLICY "Providers manage own service links" ON public.provider_services FOR ALL USING (
  EXISTS (SELECT 1 FROM public.providers WHERE providers.id = provider_services.provider_id AND providers.user_id = auth.uid())
);
CREATE POLICY "Admins manage provider services" ON public.provider_services FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ── bookings ──
CREATE POLICY "Customers view own bookings" ON public.bookings FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "Customers create bookings" ON public.bookings FOR INSERT WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Customers update own bookings" ON public.bookings FOR UPDATE USING (customer_id = auth.uid());
CREATE POLICY "Providers view assigned bookings" ON public.bookings FOR SELECT USING (
  provider_id IS NOT NULL AND EXISTS(
    SELECT 1 FROM public.providers WHERE providers.id = bookings.provider_id AND providers.user_id = auth.uid()
  )
);
CREATE POLICY "Providers update own bookings" ON public.bookings FOR UPDATE USING (
  provider_id IS NOT NULL AND EXISTS(
    SELECT 1 FROM public.providers WHERE providers.id = bookings.provider_id AND providers.user_id = auth.uid()
  )
);
CREATE POLICY "Admins manage bookings" ON public.bookings FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ── reviews ──
CREATE POLICY "Anyone view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Customers create reviews" ON public.reviews FOR INSERT WITH CHECK (reviewer_id = auth.uid());
CREATE POLICY "Customers update own reviews" ON public.reviews FOR UPDATE USING (reviewer_id = auth.uid());
CREATE POLICY "Admins manage reviews" ON public.reviews FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ── payment_transactions ──
CREATE POLICY "Users view own payment transactions" ON public.payment_transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bookings WHERE bookings.id = payment_transactions.booking_id AND bookings.customer_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.bookings b JOIN public.providers p ON p.id = b.provider_id WHERE b.id = payment_transactions.booking_id AND p.user_id = auth.uid())
);
CREATE POLICY "System insert payment transactions" ON public.payment_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins manage payment transactions" ON public.payment_transactions FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ── notifications ──
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "System insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins manage notifications" ON public.notifications FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ── disputes ──
CREATE POLICY "Users view own disputes" ON public.disputes FOR SELECT USING (
  raised_by = auth.uid()
  OR EXISTS (SELECT 1 FROM public.bookings WHERE bookings.id = disputes.booking_id AND bookings.customer_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Customers create disputes" ON public.disputes FOR INSERT WITH CHECK (raised_by = auth.uid());
CREATE POLICY "Admins manage disputes" ON public.disputes FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ── wallet_transactions ──
CREATE POLICY "Providers view own wallet transactions" ON public.wallet_transactions FOR SELECT USING (
  provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "System insert wallet transactions" ON public.wallet_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins manage wallet transactions" ON public.wallet_transactions FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ── withdrawal_requests ──
CREATE POLICY "Providers view own withdrawals" ON public.withdrawal_requests FOR SELECT USING (
  provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
);
CREATE POLICY "Providers create withdrawals" ON public.withdrawal_requests FOR INSERT WITH CHECK (
  provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
);
CREATE POLICY "Admins manage withdrawals" ON public.withdrawal_requests FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ─────────────────────────────────────────────────────
-- 9. Seed data
-- ─────────────────────────────────────────────────────

-- Platform settings
INSERT INTO public.platform_settings (site_name, commission_rate, currency, currency_symbol, payment_mode, payway_test_mode)
VALUES ('ServiceScout', 10, 'AUD', '$', 'sale', true) ON CONFLICT DO NOTHING;

-- Service categories
INSERT INTO public.service_categories (name, slug, description, icon, is_active) VALUES
  ('Cleaning', 'cleaning', 'Home and office cleaning services', '🧹', true),
  ('Plumbing', 'plumbing', 'Professional plumbing solutions', '🔧', true),
  ('Electrical', 'electrical', 'Electrical repairs and installations', '⚡', true),
  ('Handyman', 'handyman', 'General maintenance and repairs', '🔨', true),
  ('Beauty', 'beauty', 'Hair, nails, massage and more', '💇', true),
  ('Tutoring', 'tutoring', 'Academic and language tutoring', '📚', true),
  ('Moving', 'moving', 'Local and long-distance relocation', '🚚', true),
  ('Gardening', 'gardening', 'Lawn care and landscape design', '🌿', true)
ON CONFLICT (slug) DO NOTHING;

-- Services (price = hourly rate)
-- Cleaning
DO $$
DECLARE _cat_id UUID;
BEGIN
  SELECT id INTO _cat_id FROM public.service_categories WHERE slug = 'cleaning';
  IF FOUND THEN
    INSERT INTO public.services (category_id, title, description, price, duration_minutes, is_active) VALUES
      (_cat_id, 'Standard Home Cleaning', 'Regular cleaning for your home. Includes dusting, vacuuming, and sanitizing.', 59.33, 90, true),
      (_cat_id, 'Deep Cleaning', 'Thorough deep clean of every room, including hard-to-reach areas.', 49.67, 180, true),
      (_cat_id, 'Office Cleaning', 'Professional office cleaning service for businesses.', 59.50, 120, true),
      (_cat_id, 'Move-in/Move-out Cleaning', 'Complete cleaning for properties being moved in or out.', 71.60, 150, true);
  END IF;
END $$;

-- Plumbing
DO $$
DECLARE _cat_id UUID;
BEGIN
  SELECT id INTO _cat_id FROM public.service_categories WHERE slug = 'plumbing';
  IF FOUND THEN
    INSERT INTO public.services (category_id, title, description, price, duration_minutes, is_active) VALUES
      (_cat_id, 'Emergency Plumbing', '24/7 emergency plumbing service for urgent issues.', 150.00, 60, true),
      (_cat_id, 'Leak Repair', 'Fix leaks in pipes, faucets, and toilets.', 126.67, 45, true),
      (_cat_id, 'Drain Unclogging', 'Remove blockages from drains and pipes.', 150.00, 30, true),
      (_cat_id, 'Fixture Installation', 'Install or replace plumbing fixtures professionally.', 120.00, 60, true);
  END IF;
END $$;

-- Electrical
DO $$
DECLARE _cat_id UUID;
BEGIN
  SELECT id INTO _cat_id FROM public.service_categories WHERE slug = 'electrical';
  IF FOUND THEN
    INSERT INTO public.services (category_id, title, description, price, duration_minutes, is_active) VALUES
      (_cat_id, 'Electrical Repair', 'Fix electrical faults and wiring issues.', 110.00, 60, true),
      (_cat_id, 'Outlet Installation', 'Install new outlets, switches, and panels.', 130.00, 30, true),
      (_cat_id, 'Lighting Setup', 'Set up indoor and outdoor lighting.', 96.67, 90, true),
      (_cat_id, 'Wiring Inspection', 'Comprehensive electrical safety inspection.', 113.33, 45, true);
  END IF;
END $$;

-- Handyman
DO $$
DECLARE _cat_id UUID;
BEGIN
  SELECT id INTO _cat_id FROM public.service_categories WHERE slug = 'handyman';
  IF FOUND THEN
    INSERT INTO public.services (category_id, title, description, price, duration_minutes, is_active) VALUES
      (_cat_id, 'Furniture Assembly', 'Assemble IKEA and other furniture.', 73.33, 45, true),
      (_cat_id, 'Wall Mounting', 'Mount TVs, shelves, and artwork on walls.', 90.00, 30, true),
      (_cat_id, 'Door Repair', 'Repair sticking or broken doors.', 86.67, 45, true),
      (_cat_id, 'General Maintenance', 'General home maintenance and small repairs.', 75.00, 60, true);
  END IF;
END $$;

-- Beauty
DO $$
DECLARE _cat_id UUID;
BEGIN
  SELECT id INTO _cat_id FROM public.service_categories WHERE slug = 'beauty';
  IF FOUND THEN
    INSERT INTO public.services (category_id, title, description, price, duration_minutes, is_active) VALUES
      (_cat_id, 'Hair Styling', 'Professional hair cut, style, and coloring.', 75.00, 60, true),
      (_cat_id, 'Manicure & Pedicure', 'Complete nail care for hands and feet.', 73.33, 45, true),
      (_cat_id, 'Massage Therapy', 'Relaxing therapeutic massage session.', 63.33, 90, true),
      (_cat_id, 'Facial Treatment', 'Rejuvenating facial treatment.', 65.00, 60, true);
  END IF;
END $$;

-- Tutoring
DO $$
DECLARE _cat_id UUID;
BEGIN
  SELECT id INTO _cat_id FROM public.service_categories WHERE slug = 'tutoring';
  IF FOUND THEN
    INSERT INTO public.services (category_id, title, description, price, duration_minutes, is_active) VALUES
      (_cat_id, 'Math Tutoring', 'One-on-one math tutoring for all levels.', 50.00, 60, true),
      (_cat_id, 'Science Tutoring', 'Science tutoring including physics, chemistry, biology.', 50.00, 60, true),
      (_cat_id, 'Language Lessons', 'Private language lessons in multiple languages.', 60.00, 60, true),
      (_cat_id, 'Test Prep', 'SAT, ACT, and other standardized test preparation.', 46.67, 90, true);
  END IF;
END $$;

-- Moving
DO $$
DECLARE _cat_id UUID;
BEGIN
  SELECT id INTO _cat_id FROM public.service_categories WHERE slug = 'moving';
  IF FOUND THEN
    INSERT INTO public.services (category_id, title, description, price, duration_minutes, is_active) VALUES
      (_cat_id, 'Local Move', 'Local moving within the same city or metro area.', 83.33, 180, true),
      (_cat_id, 'Long Distance Move', 'Long distance relocation services.', 75.00, 360, true),
      (_cat_id, 'Packing Service', 'Professional packing of all your belongings.', 75.00, 120, true),
      (_cat_id, 'Furniture Moving', 'Safe transportation of heavy furniture.', 80.00, 150, true);
  END IF;
END $$;

-- Gardening
DO $$
DECLARE _cat_id UUID;
BEGIN
  SELECT id INTO _cat_id FROM public.service_categories WHERE slug = 'gardening';
  IF FOUND THEN
    INSERT INTO public.services (category_id, title, description, price, duration_minutes, is_active) VALUES
      (_cat_id, 'Lawn Mowing', 'Regular lawn mowing and edging.', 90.00, 30, true),
      (_cat_id, 'Garden Design', 'Custom garden design and planting.', 60.00, 120, true),
      (_cat_id, 'Tree Trimming', 'Professional tree and shrub trimming.', 85.00, 60, true),
      (_cat_id, 'Irrigation Setup', 'Install or repair irrigation systems.', 100.00, 90, true);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────
-- 10. Indexes
-- ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category_id);
CREATE INDEX IF NOT EXISTS idx_providers_status ON public.providers(status);
CREATE INDEX IF NOT EXISTS idx_providers_user ON public.providers(user_id);
CREATE INDEX IF NOT EXISTS idx_provider_services_provider ON public.provider_services(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_services_service ON public.provider_services(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider ON public.bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service ON public.bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payway_txn ON public.bookings(payway_transaction_id);
CREATE INDEX IF NOT EXISTS idx_reviews_provider ON public.reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking ON public.reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_booking ON public.payment_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_provider ON public.wallet_transactions(provider_id);

-- Add PayWay configuration columns to platform_settings for existing databases.

ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS payway_merchant_id TEXT;

ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS payway_test_mode BOOLEAN NOT NULL DEFAULT true;

UPDATE public.platform_settings
SET payway_test_mode = COALESCE(payway_test_mode, true)
WHERE payway_test_mode IS NULL;