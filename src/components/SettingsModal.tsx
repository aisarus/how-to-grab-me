import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import type { ApiProvider } from "@/hooks/useCredits";
import {
  Key, Check, X, Eye, EyeOff, ExternalLink,
  Sparkles, Shield, Infinity,
} from "lucide-react";

/* ─── Provider metadata ────────────────────────────────────────────────────── */

const PROVIDERS: { value: ApiProvider; label: string; placeholder: string; docsUrl: string; color: string }[] = [
  {
    value: "openai",
    label: "OpenAI (GPT-4o)",
    placeholder: "sk-...",
    docsUrl: "https://platform.openai.com/api-keys",
    color: "#10a37f",
  },
  {
    value: "google",
    label: "Google AI (Gemini)",
    placeholder: "AIza...",
    docsUrl: "https://aistudio.google.com/app/apikey",
    color: "#4285f4",
  },
  {
    value: "anthropic",
    label: "Anthropic (Claude)",
    placeholder: "sk-ant-...",
    docsUrl: "https://console.anthropic.com/settings/keys",
    color: "#d97706",
  },
];

/* ─── Props ────────────────────────────────────────────────────────────────── */

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customApiKey: string | null;
  apiProvider: ApiProvider;
  hasLifetimeAccess: boolean;
  isMaker: boolean;
  onSaveApiKey: (key: string, provider: ApiProvider) => Promise<boolean>;
  onRemoveApiKey: () => Promise<boolean>;
}

/* ─── SettingsModal ────────────────────────────────────────────────────────── */

export function SettingsModal({
  open,
  onOpenChange,
  customApiKey,
  apiProvider,
  hasLifetimeAccess,
  isMaker,
  onSaveApiKey,
  onRemoveApiKey,
}: SettingsModalProps) {
  const { toast } = useToast();

  const [selectedProvider, setSelectedProvider] = useState<ApiProvider>(apiProvider || "openai");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const currentProvider = PROVIDERS.find(p => p.value === selectedProvider) ?? PROVIDERS[0];
  const activeProvider = PROVIDERS.find(p => p.value === apiProvider);

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    setSaving(true);
    const ok = await onSaveApiKey(apiKey.trim(), selectedProvider);
    setSaving(false);
    if (ok) {
      toast({ title: "API Key saved", description: `${currentProvider.label} key is now active.` });
      setApiKey("");
    } else {
      toast({ title: "Failed to save key", variant: "destructive" });
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    const ok = await onRemoveApiKey();
    setRemoving(false);
    if (ok) toast({ title: "API Key removed" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-1">

          {/* ── Access status ── */}
          {(isMaker || hasLifetimeAccess || customApiKey) && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Access</p>
              {isMaker && (
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-primary/30 bg-primary/5 text-sm text-primary">
                  <Infinity className="w-4 h-4" />
                  <span>Maker Mode — unlimited access</span>
                </div>
              )}
              {hasLifetimeAccess && !isMaker && (
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-sm text-emerald-400">
                  <Check className="w-4 h-4" />
                  <span>Lifetime access active</span>
                </div>
              )}
              {customApiKey && activeProvider && (
                <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-cyan-500/30 bg-cyan-500/5">
                  <div className="flex items-center gap-2.5 text-sm text-cyan-400">
                    <Key className="w-4 h-4" />
                    <span>{activeProvider.label} · •••{customApiKey.slice(-4)}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={handleRemove}
                    disabled={removing}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ── BYOK ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Bring Your Own Key
              </p>
              <a
                href={currentProvider.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Get key <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Connect your own API key to skip the credit system. You pay the provider directly —
              TRI-TFM only handles optimization.
            </p>

            {!customApiKey ? (
              <div className="space-y-2">
                <Select
                  value={selectedProvider}
                  onValueChange={(v) => setSelectedProvider(v as ApiProvider)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map(p => (
                      <SelectItem key={p.value} value={p.value}>
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                          {p.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative">
                  <Input
                    type={showKey ? "text" : "password"}
                    placeholder={currentProvider.placeholder}
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSave()}
                    className="h-9 text-sm pr-9 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(s => !s)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <Button
                  size="sm"
                  className="w-full h-9 text-sm"
                  onClick={handleSave}
                  disabled={!apiKey.trim() || saving}
                >
                  {saving ? "Saving…" : "Save API Key"}
                </Button>

                {/* Security note */}
                <div className="flex items-start gap-2 text-xs text-muted-foreground/70 mt-1">
                  <Shield className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>Key is stored encrypted in your profile. Never shared or logged.</span>
                </div>
              </div>
            ) : (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-cyan-500/30 bg-cyan-500/5"
                >
                  <div className="flex items-center gap-2.5 text-sm text-cyan-400">
                    <Key className="w-4 h-4" />
                    <span>{activeProvider?.label} key active</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={handleRemove}
                    disabled={removing}
                  >
                    {removing ? "Removing…" : "Remove"}
                  </Button>
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* ── Lifetime ── */}
          {!hasLifetimeAccess && !isMaker && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Lifetime Access</p>
              <div className="flex items-center justify-between px-3 py-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
                <div>
                  <p className="text-sm font-semibold text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Lifetime — $15
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Unlimited optimizations, one-time payment</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                  onClick={() => window.open("https://arielwave403.gumroad.com/l/TRI-TFMstudio", "_blank")}
                >
                  Buy now
                </Button>
              </div>
            </div>
          )}

          {/* ── Appearance ── */}
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Appearance</p>
            <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-border/40">
              <span className="text-sm">Theme</span>
              <ThemeToggle />
            </div>
            <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-border/40">
              <span className="text-sm">Language</span>
              <LanguageSwitcher />
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
