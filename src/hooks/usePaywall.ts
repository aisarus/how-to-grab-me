import { useState, useCallback } from 'react';

const FREE_USES_KEY = 'tfm_free_uses';
const PRO_KEY = 'tfm_is_pro';
const MAX_FREE_USES = 3;

export const usePaywall = () => {
  const [isPro, setIsPro] = useState(() => {
    return localStorage.getItem(PRO_KEY) === 'true';
  });

  const [freeUsesLeft, setFreeUsesLeft] = useState(() => {
    const used = parseInt(localStorage.getItem(FREE_USES_KEY) || '0', 10);
    return Math.max(0, MAX_FREE_USES - used);
  });

  const canOptimize = isPro || freeUsesLeft > 0;

  const consumeFreeUse = useCallback(() => {
    if (isPro) return;
    const used = parseInt(localStorage.getItem(FREE_USES_KEY) || '0', 10) + 1;
    localStorage.setItem(FREE_USES_KEY, String(used));
    setFreeUsesLeft(Math.max(0, MAX_FREE_USES - used));
  }, [isPro]);

  const activatePro = useCallback(() => {
    localStorage.setItem(PRO_KEY, 'true');
    setIsPro(true);
  }, []);

  return { isPro, canOptimize, freeUsesLeft, consumeFreeUse, activatePro };
};
