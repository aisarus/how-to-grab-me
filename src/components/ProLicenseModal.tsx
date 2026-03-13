import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Loader2, KeyRound, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProLicenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActivatePro: () => void;
}

const GUMROAD_LINK = 'https://arielwave403.gumroad.com/l/TRI-TFMstudio';

export const ProLicenseModal = ({ open, onOpenChange, onActivatePro }: ProLicenseModalProps) => {
  const [licenseKey, setLicenseKey] = useState('');
  const [verifying, setVerifying] = useState(false);
  const { toast } = useToast();

  const handleVerify = async () => {
    const key = licenseKey.trim();
    if (!key) return;

    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-license', {
        body: { license_key: key },
      });

      if (error) throw error;

      if (data?.success) {
        onActivatePro();
        toast({ title: '🎉 License Activated!', description: 'You now have unlimited access.' });
        onOpenChange(false);
        setLicenseKey('');
      } else {
        toast({
          title: 'Invalid License Key',
          description: data?.message || 'Please check your key and try again.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('License verification failed:', err);
      toast({
        title: 'Verification Failed',
        description: 'Could not verify license. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <DialogTitle className="text-2xl font-bold">
            Pro License Required
          </DialogTitle>
          <DialogDescription className="text-base">
            You've used your free optimization. Unlock unlimited access with a Pro license.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Buy License */}
          <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-semibold text-lg">Pro License</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ Unlimited prompt optimizations</li>
              <li>✓ All modules & features</li>
              <li>✓ A/B testing</li>
              <li>✓ One-time payment, forever</li>
            </ul>
            <div className="text-3xl font-bold text-primary">$15</div>
            <Button
              className="w-full h-11 text-base gradient-primary hover:opacity-90 shadow-glow"
              onClick={() => window.open(GUMROAD_LINK, '_blank')}
            >
              <ExternalLink className="mr-2 h-5 w-5" />
              Buy License
            </Button>
          </div>

          {/* Verify Key */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-muted-foreground" />
              <span className="font-semibold text-sm">Already have a License Key?</span>
            </div>
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Enter your license key..."
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !verifying && handleVerify()}
                disabled={verifying}
              />
              <Button
                className="w-full"
                onClick={handleVerify}
                disabled={verifying || !licenseKey.trim()}
              >
                {verifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
