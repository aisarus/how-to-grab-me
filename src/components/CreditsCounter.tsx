import { Coins, Infinity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CreditsCounterProps {
  credits: number | null;
  isMaker: boolean;
}

export const CreditsCounter = ({ credits, isMaker }: CreditsCounterProps) => {
  if (isMaker) {
    return (
      <Badge variant="outline" className="gap-1.5 px-3 py-1 border-primary/30 bg-primary/5">
        <Infinity className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold text-primary">∞</span>
      </Badge>
    );
  }

  const isLow = credits !== null && credits <= 1;

  return (
    <Badge 
      variant="outline" 
      className={`gap-1.5 px-3 py-1 ${
        isLow 
          ? 'border-destructive/30 bg-destructive/5 text-destructive' 
          : 'border-primary/30 bg-primary/5 text-primary'
      }`}
    >
      <Coins className="w-4 h-4" />
      <span className="text-xs font-semibold">{credits ?? 0}</span>
    </Badge>
  );
};
