import { useState } from 'react';
import { Key, Infinity, ShoppingCart, KeyRound, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { ApiProvider } from '@/hooks/useCredits';

interface CreditsCounterProps {
  hasLifetimeAccess: boolean;
  customApiKey: string | null;
  apiProvider: ApiProvider;
  isMaker: boolean;
  onActivateMaker?: (password: string) => boolean;
  onSaveApiKey?: (key: string, provider: ApiProvider) => Promise<boolean>;
  onRemoveApiKey?: () => Promise<boolean>;
}

const PROVIDER_LABELS: Record<ApiProvider, string> = {
  openai: 'OpenAI',
  google: 'Google AI',
  anthropic: 'Anthropic',
};

const PROVIDER_PLACEHOLDERS: Record<ApiProvider, string> = {
  openai: 'sk-...',
  google: 'AIza...',
  anthropic: 'sk-ant-...',
};

export const CreditsCounter = ({ 
  hasLifetimeAccess, customApiKey, apiProvider, isMaker, 
  onActivateMaker, onSaveApiKey, onRemoveApiKey 
}: CreditsCounterProps) => {
  const [showMakerInput, setShowMakerInput] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [makerPassword, setMakerPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<ApiProvider>('openai');
  const { toast } = useToast();

  const hasAccess = isMaker || hasLifetimeAccess || !!customApiKey;

  const handleMakerActivate = () => {
    if (onActivateMaker?.(makerPassword)) {
      toast({ title: '🚀 Maker Mode', description: 'Unlimited access enabled!' });
      setShowMakerInput(false);
      setMakerPassword('');
    } else {
      toast({ title: 'Access denied', variant: 'destructive' });
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) return;
    const success = await onSaveApiKey?.(apiKey.trim(), selectedProvider);
    if (success) {
      toast({ title: '🔑 API Key saved', description: `${PROVIDER_LABELS[selectedProvider]} key activated.` });
      setShowApiKeyInput(false);
      setApiKey('');
    } else {
      toast({ title: 'Failed to save', variant: 'destructive' });
    }
  };

  const handleRemoveApiKey = async () => {
    const success = await onRemoveApiKey?.();
    if (success) {
      toast({ title: 'API Key removed' });
    }
  };

  const statusIcon = isMaker ? (
    <Infinity className="w-4 h-4 text-primary" />
  ) : hasLifetimeAccess ? (
    <Check className="w-4 h-4 text-emerald-400" />
  ) : customApiKey ? (
    <Key className="w-4 h-4 text-amber-400" />
  ) : null;

  const statusLabel = isMaker ? '∞' : hasLifetimeAccess ? 'PRO' : customApiKey ? 'BYOK' : 'FREE';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="focus:outline-none">
          <Badge
            variant="outline"
            className={`gap-1.5 px-3 py-1 cursor-pointer hover:opacity-80 transition-opacity ${
              hasAccess
                ? 'border-primary/30 bg-primary/5 text-primary'
                : 'border-muted-foreground/30 bg-muted/5 text-muted-foreground'
            }`}
          >
            {statusIcon}
            <span className="text-xs font-semibold">{statusLabel}</span>
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider px-1">Access</p>

          {/* Lifetime Purchase */}
          {!hasLifetimeAccess && !isMaker && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => window.open('https://arielwave403.gumroad.com/l/TRI-TFMstudio', '_blank')}
            >
              <ShoppingCart className="w-4 h-4" />
              Buy Lifetime Access — $15
            </Button>
          )}

          {hasLifetimeAccess && (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-emerald-400">
              <Check className="w-4 h-4" />
              Lifetime Access Active
            </div>
          )}

          {/* BYOK */}
          {!customApiKey ? (
            !showApiKeyInput ? (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => setShowApiKeyInput(true)}
              >
                <Key className="w-4 h-4" />
                Bring Your Own Key
              </Button>
            ) : (
              <div className="space-y-1.5 p-1">
                <Select value={selectedProvider} onValueChange={(v) => setSelectedProvider(v as ApiProvider)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI (GPT-4o)</SelectItem>
                    <SelectItem value="google">Google AI (Gemini)</SelectItem>
                    <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="password"
                  placeholder={PROVIDER_PLACEHOLDERS[selectedProvider]}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveApiKey()}
                  className="h-8 text-xs"
                />
                <div className="flex gap-1">
                  <Button size="sm" className="h-7 flex-1 text-xs" onClick={handleSaveApiKey}>
                    Save Key
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setShowApiKeyInput(false); setApiKey(''); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )
          ) : (
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2 text-sm text-amber-400">
                <Key className="w-4 h-4" />
                <span className="text-xs">{PROVIDER_LABELS[apiProvider]}: •••{customApiKey.slice(-4)}</span>
              </div>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={handleRemoveApiKey}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}

          {/* Maker Access */}
          {!isMaker && (
            <div className="border-t border-border pt-2 mt-2">
              {!showMakerInput ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-muted-foreground/50 text-xs"
                  onClick={() => setShowMakerInput(true)}
                >
                  <KeyRound className="w-3 h-3" />
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
                    className="h-7 text-xs"
                  />
                  <Button size="sm" className="h-7 text-xs" onClick={handleMakerActivate}>
                    OK
                  </Button>
                </div>
              )}
            </div>
          )}

          {isMaker && (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-primary">
              <Infinity className="w-4 h-4" />
              Maker Mode Active
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
