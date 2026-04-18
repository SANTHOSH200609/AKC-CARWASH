
-- Phone OTP storage (hashed codes, expiry, attempts)
CREATE TABLE public.phone_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  code_hash text NOT NULL,
  full_name text,
  expires_at timestamptz NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  consumed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_phone_otps_phone ON public.phone_otps(phone);
CREATE INDEX idx_phone_otps_expires ON public.phone_otps(expires_at);

-- Lock down: only edge functions (service role) touch this table
ALTER TABLE public.phone_otps ENABLE ROW LEVEL SECURITY;

-- No public policies => clients cannot read/write directly
-- (service role bypasses RLS)

-- Add phone column to profiles is already there, ensure unique-ish lookups via index
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
