import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const MAKER_PASSWORD = 'Oggnom228';
const MAKER_KEY = 'tfm_maker_mode';

export type ApiProvider = 'openai' | 'google' | 'anthropic';

export const useCredits = () => {
  const [hasLifetimeAccess, setHasLifetimeAccess] = useState(false);
  const [customApiKey, setCustomApiKey] = useState<string | null>(null);
  const [apiProvider, setApiProvider] = useState<ApiProvider>('openai');
  const [loading, setLoading] = useState(true);
  const [isMaker, setIsMaker] = useState(() => {
    return localStorage.getItem(MAKER_KEY) === 'true';
  });

  const fetchProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setHasLifetimeAccess(false);
      setCustomApiKey(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('is_maker, has_lifetime_access, custom_api_key, api_provider')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      setHasLifetimeAccess((data as any).has_lifetime_access ?? false);
      setCustomApiKey((data as any).custom_api_key ?? null);
      setApiProvider((data as any).api_provider ?? 'openai');
      if ((data as any).is_maker) {
        setIsMaker(true);
        localStorage.setItem(MAKER_KEY, 'true');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchProfile();
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const saveCustomApiKey = useCallback(async (apiKey: string, provider: ApiProvider = 'openai'): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Ensure profile exists, then update
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({ id: user.id, email: user.email ?? '', custom_api_key: apiKey, api_provider: provider } as any, { onConflict: 'id' });

    if (upsertError) {
      console.error('Failed to save API key:', upsertError);
      return false;
    }

    setCustomApiKey(apiKey);
    setApiProvider(provider);
    return true;
  }, []);

  const removeCustomApiKey = useCallback(async (): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('profiles')
      .update({ custom_api_key: null } as any)
      .eq('id', user.id);

    if (error) return false;
    setCustomApiKey(null);
    return true;
  }, []);

  const activateMakerMode = useCallback((password: string): boolean => {
    if (password === MAKER_PASSWORD) {
      localStorage.setItem(MAKER_KEY, 'true');
      setIsMaker(true);
      return true;
    }
    return false;
  }, []);

  const hasAccess = isMaker || hasLifetimeAccess || !!customApiKey;

  return {
    loading,
    hasAccess,
    hasLifetimeAccess,
    customApiKey,
    apiProvider,
    isMaker,
    saveCustomApiKey,
    removeCustomApiKey,
    fetchCredits: fetchProfile,
    activateMakerMode,
  };
};
