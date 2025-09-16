-- ELITE BARBER BOOKING - Database Schema
-- Execute this SQL in Supabase SQL Editor

-- Create custom types
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Companies/Barber Shops
CREATE TABLE public.companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Units (branches of barber shops)
CREATE TABLE public.units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  image_url TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  opening_hours JSONB, -- {"monday": {"open": "09:00", "close": "18:00"}, ...}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Professionals (barbers)
CREATE TABLE public.professionals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  specialty TEXT,
  description TEXT,
  image_url TEXT,
  rating DECIMAL(2,1) DEFAULT 0,
  experience_years INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services offered
CREATE TABLE public.services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL, -- duration in minutes
  price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Professional availability
CREATE TABLE public.availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Time slots (specific available times)
CREATE TABLE public.time_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments
CREATE TABLE public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status appointment_status DEFAULT 'pending',
  payment_status payment_status DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointment services (many-to-many)
CREATE TABLE public.appointment_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL, -- price at the time of booking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews/Ratings
CREATE TABLE public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample data
INSERT INTO companies (name, description) VALUES 
('BookIA Elite Barber', 'Rede de barbearias premium com agendamento inteligente');

-- Insert sample units
INSERT INTO units (company_id, name, address, phone, image_url) 
SELECT 
  c.id,
  'BookIA - Boulevard Shopping Camaçari',
  'BA-535, s/n - Industrial, s/n, Camaçari',
  '(71) 99999-0001',
  'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
FROM companies c WHERE c.name = 'BookIA Elite Barber';

INSERT INTO units (company_id, name, address, phone, image_url)
SELECT 
  c.id,
  'BookIA - Salvador Norte Shopping', 
  'BA-535, s/n, Salvador',
  '(71) 99999-0002',
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
FROM companies c WHERE c.name = 'BookIA Elite Barber';

INSERT INTO units (company_id, name, address, phone, image_url)
SELECT 
  c.id,
  'BookIA - Centro Camaçari',
  'Radial B, 80, Camaçari', 
  '(71) 99999-0003',
  'https://images.unsplash.com/photo-1562004760-aceed7bb0fe3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
FROM companies c WHERE c.name = 'BookIA Elite Barber';

-- Insert sample professionals
INSERT INTO professionals (unit_id, name, specialty, image_url, rating, experience_years)
SELECT 
  u.id,
  'Carlos Silva',
  'Especialista em Cortes',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  4.9,
  8
FROM units u WHERE u.name = 'BookIA - Boulevard Shopping Camaçari';

INSERT INTO professionals (unit_id, name, specialty, image_url, rating, experience_years)
SELECT 
  u.id,
  'Ana Santos',
  'Coloração e Design',
  'https://images.unsplash.com/photo-1494790108755-2616b332ab55?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  4.8,
  6
FROM units u WHERE u.name = 'BookIA - Boulevard Shopping Camaçari';

INSERT INTO professionals (unit_id, name, specialty, image_url, rating, experience_years)
SELECT 
  u.id,
  'João Costa',
  'Cortes Masculinos',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  4.7,
  5
FROM units u WHERE u.name = 'BookIA - Boulevard Shopping Camaçari';

-- Insert sample services
INSERT INTO services (professional_id, name, duration_minutes, price)
SELECT 
  p.id,
  'Corte Masculino',
  30,
  45.00
FROM professionals p WHERE p.name = 'Carlos Silva';

INSERT INTO services (professional_id, name, duration_minutes, price)
SELECT 
  p.id,
  'Barba Completa',
  20,
  25.00
FROM professionals p WHERE p.name = 'Carlos Silva';

INSERT INTO services (professional_id, name, duration_minutes, price)
SELECT 
  p.id,
  'Corte + Barba',
  45,
  65.00
FROM professionals p WHERE p.name = 'Carlos Silva';

INSERT INTO services (professional_id, name, duration_minutes, price)
SELECT 
  p.id,
  'Corte Feminino',
  60,
  80.00
FROM professionals p WHERE p.name = 'Ana Santos';

INSERT INTO services (professional_id, name, duration_minutes, price)
SELECT 
  p.id,
  'Coloração',
  120,
  150.00
FROM professionals p WHERE p.name = 'Ana Santos';

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see/edit their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Public read access for companies, units, professionals, services
CREATE POLICY "Public read access" ON companies FOR SELECT USING (true);
CREATE POLICY "Public read access" ON units FOR SELECT USING (true);
CREATE POLICY "Public read access" ON professionals FOR SELECT USING (true);
CREATE POLICY "Public read access" ON services FOR SELECT USING (true);

-- Users can manage their own appointments
CREATE POLICY "Users manage own appointments" ON appointments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users view own appointment services" ON appointment_services 
FOR SELECT USING (EXISTS (
  SELECT 1 FROM appointments a WHERE a.id = appointment_id AND a.user_id = auth.uid()
));

-- Users can manage their own reviews
CREATE POLICY "Users manage own reviews" ON reviews FOR ALL USING (auth.uid() = user_id);

-- Function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  RETURN new;
END;
$$ language plpgsql security definer;

-- Trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
