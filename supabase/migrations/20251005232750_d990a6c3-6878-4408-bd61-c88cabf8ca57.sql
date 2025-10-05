-- Add DELETE policy to profiles table for complete RLS protection
CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = id);