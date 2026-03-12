import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Zap, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OutOfCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActivateMaker: (password: string) => boolean;
}

export const OutOfCreditsModal = ({ open, onOpenChange, onActivateMaker }: OutOfCreditsModalProps) => {
  const [showMakerInput, setShowMakerInput] = useState(false);
  const [makerPassword, setMakerPassword] = useState('');
  const { toast } = useToast();

  const handleMakerActivate = () => {
    if (onActivateMaker(makerPassword)) {
      toast({
        title: '🚀 Maker Mode Activated',
        description: 'Unlimited credits enabled. Build without limits!',
      });
      onOpenChange(false);
      setShowMakerInput(false);
      setMakerPassword('');
    } else {
      toast({
        title: 'Invalid password',
        description: 'Access denied.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold">
            You're out of credits
          </DialogTitle>
          <DialogDescription className="text-base">
            Upgrade to continue optimizing your AI pipelines. Get more credits and unlock the full power of prompt optimization.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-semibold text-lg">100 Credits</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ 100 prompt optimizations</li>
              <li>✓ Full PCA loop with all modules</li>
              <li>✓ Priority processing</li>
            </ul>
            <div className="text-3xl font-bold text-primary">$15</div>
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          <Button 
            className="w-full h-12 text-base gradient-primary hover:opacity-90 shadow-glow"
            onClick={() => window.open('https://your-lemonsqueezy-link.com', '_blank')}
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Buy 100 Credits for $15
          </Button>
          
          {!showMakerInput ? (
            <button
              onClick={() => setShowMakerInput(true)}
              className="text-xs text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors mt-2 self-center"
            >
              <Lock className="w-3 h-3 inline mr-1" />
              Maker access
            </button>
          ) : (
            <div className="flex gap-2 mt-2">
              <Input
                type="password"
                placeholder="Enter maker password"
                value={makerPassword}
                onChange={(e) => setMakerPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleMakerActivate()}
                className="text-sm"
              />
              <Button size="sm" variant="outline" onClick={handleMakerActivate}>
                Activate
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
