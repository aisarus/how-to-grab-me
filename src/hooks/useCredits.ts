import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const MAKER_PASSWORD = 'Oggnom228';
const MAKER_KEY = 'tfm_maker_mode';

export const useCredits = () => {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMaker, setIsMaker] = useState(() => {
    return localStorage.getItem(MAKER_KEY) === 'true';
  });

  const fetchCredits = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setCredits(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      setCredits((data as any).credits ?? 3);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCredits();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchCredits();
    });

    return () => subscription.unsubscribe();
  }, [fetchCredits]);

  const deductCredit = useCallback(async (): Promise<boolean> => {
    if (isMaker) return true;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    const currentCredits = (data as any)?.credits ?? 0;
    if (currentCredits <= 0) return false;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credits: currentCredits - 1 } as any)
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to deduct credit:', updateError);
      return false;
    }

    setCredits(currentCredits - 1);
    return true;
  }, [isMaker]);

  const activateMakerMode = useCallback((password: string): boolean => {
    if (password === MAKER_PASSWORD) {
      localStorage.setItem(MAKER_KEY, 'true');
      setIsMaker(true);
      return true;
    }
    return false;
  }, []);

  const hasCredits = isMaker || (credits !== null && credits > 0);

  return { credits, loading, hasCredits, isMaker, deductCredit, fetchCredits, activateMakerMode };
};
