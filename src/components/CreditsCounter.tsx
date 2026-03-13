import { useState } from 'react';
import { Coins, Infinity, ShoppingCart, KeyRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface CreditsCounterProps {
  credits: number | null;
  isMaker: boolean;
  onActivateMaker?: (password: string) => boolean;
}

export const CreditsCounter = ({ credits, isMaker, onActivateMaker }: CreditsCounterProps) => {
  const [showMakerInput, setShowMakerInput] = useState(false);
  const [makerPassword, setMakerPassword] = useState('');
  const { toast } = useToast();

  const isLow = credits !== null && credits <= 1;

  const handleMakerActivate = () => {
    if (onActivateMaker?.(makerPassword)) {
      toast({ title: '🚀 Maker Mode', description: 'Unlimited credits enabled!' });
      setShowMakerInput(false);
      setMakerPassword('');
    } else {
      toast({ title: 'Access denied', variant: 'destructive' });
    }
  };

  const badgeContent = isMaker ? (
    <>
      <Infinity className="w-4 h-4 text-primary" />
      <span className="text-xs font-semibold text-primary">∞</span>
    </>
  ) : (
    <>
      <Coins className="w-4 h-4" />
      <span className="text-xs font-semibold">{credits ?? 0}</span>
    </>
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="focus:outline-none">
          <Badge
            variant="outline"
            className={`gap-1.5 px-3 py-1 cursor-pointer hover:opacity-80 transition-opacity ${
              isMaker
                ? 'border-primary/30 bg-primary/5'
                : isLow
                  ? 'border-destructive/30 bg-destructive/5 text-destructive'
                  : 'border-primary/30 bg-primary/5 text-primary'
            }`}
          >
            {badgeContent}
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="end">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => window.open('https://your-lemonsqueezy-link.com', '_blank')}
          >
            <ShoppingCart className="w-4 h-4" />
            Buy Credits
          </Button>

          {!isMaker && (
            !showMakerInput ? (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-muted-foreground"
                onClick={() => setShowMakerInput(true)}
              >
                <KeyRound className="w-4 h-4" />
                Maker Access
              </Button>
            ) : (
              <div className="flex gap-1 p-1">
                <Input
                  type="password"
                  placeholder="Password"
                  value={makerPassword}
                  onChange={(e) => setMakerPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleMakerActivate()}
                  className="h-8 text-xs"
                />
                <Button size="sm" className="h-8" onClick={handleMakerActivate}>
                  OK
                </Button>
              </div>
            )
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
