
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_lifetime_access boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_api_key text;
