import { useState } from 'react';
import { X } from 'lucide-react';

const DISMISSED_KEY = 'ph-banner-dismissed';

export const ProductHuntBanner = () => {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISSED_KEY) === '1');

  if (dismissed) return null;

  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-medium text-white">
      <a
        href="https://www.producthunt.com/posts/tri-tfm-prompt-optimization-engine"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline"
      >
        🚀 We are launching on Product Hunt soon! Support us here
      </a>
      <button
        onClick={() => { localStorage.setItem(DISMISSED_KEY, '1'); setDismissed(true); }}
        className="ml-2 rounded p-0.5 hover:bg-white/20 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
