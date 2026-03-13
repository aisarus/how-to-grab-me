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
import { Sparkles, Zap, Lock, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OutOfCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActivateMaker: (password: string) => boolean;
  onSaveApiKey: (key: string) => Promise<boolean>;
}

export const OutOfCreditsModal = ({ open, onOpenChange, onActivateMaker, onSaveApiKey }: OutOfCreditsModalProps) => {
  const [showMakerInput, setShowMakerInput] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [makerPassword, setMakerPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const { toast } = useToast();

  const handleMakerActivate = () => {
    if (onActivateMaker(makerPassword)) {
      toast({ title: '🚀 Maker Mode Activated', description: 'Unlimited access enabled!' });
      onOpenChange(false);
      setShowMakerInput(false);
      setMakerPassword('');
    } else {
      toast({ title: 'Invalid password', description: 'Access denied.', variant: 'destructive' });
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) return;
    const success = await onSaveApiKey(apiKey.trim());
    if (success) {
      toast({ title: '🔑 API Key saved', description: 'You can now use the optimizer with your own key.' });
      onOpenChange(false);
      setShowApiKeyInput(false);
      setApiKey('');
    } else {
      toast({ title: 'Failed to save key', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
            <Zap className="w-8 h-8 text-primary-foreground" />
          </div>
          <DialogTitle className="text-2xl font-bold">
            Unlock Full Access
          </DialogTitle>
          <DialogDescription className="text-base">
            Choose how you want to use the optimizer — buy lifetime access or bring your own API key.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          {/* Lifetime Purchase */}
          <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-semibold text-lg">Lifetime Access</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ Unlimited prompt optimizations</li>
              <li>✓ All modules & features</li>
              <li>✓ Priority processing</li>
              <li>✓ One-time payment, forever</li>
            </ul>
            <div className="text-3xl font-bold text-primary">$29</div>
            <Button
              className="w-full h-11 text-base gradient-primary hover:opacity-90 shadow-glow"
              onClick={() => window.open('https://your-lemonsqueezy-link.com', '_blank')}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Buy Lifetime Access
            </Button>
          </div>

          {/* BYOK */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-400" />
              <span className="font-semibold">Bring Your Own Key</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Use your own OpenAI API key. You pay OpenAI directly for usage.
            </p>
            {!showApiKeyInput ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowApiKeyInput(true)}
              >
                <Key className="mr-2 h-4 w-4" />
                Enter API Key
              </Button>
            ) : (
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveApiKey()}
                />
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={handleSaveApiKey}>Save & Activate</Button>
                  <Button variant="ghost" onClick={() => { setShowApiKeyInput(false); setApiKey(''); }}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-col">
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
