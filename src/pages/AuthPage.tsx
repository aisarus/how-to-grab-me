import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { z } from 'zod';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const authSchema = z.object({
  email: z.string().email('Invalid email address').max(255, 'Email too long'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password too long'),
});

export default function AuthPage() {
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Preserve OAuth-consent (or any) return target across sign-in.
  const rawNext = searchParams.get('next');
  const next = rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/app';

  const goNext = () => {
    if (next.startsWith('/')) window.location.href = next;
    else navigate('/app');
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) goNext();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) goNext();
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [next]);

  const handleSkip = () => navigate('/app');

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: t('auth.validationError'), description: t('auth.invalidEmail'), variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({ title: t('auth.checkEmail'), description: t('auth.resetLinkSent') });
      setIsForgotPassword(false);
    } catch (error) {
      toast({ title: t('common.error'), description: error instanceof Error ? error.message : t('auth.authenticationFailed'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      toast({ title: t('auth.validationError'), description: validation.error.issues[0].message, variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) {
          if (error.message.includes('Invalid login credentials')) throw new Error(t('auth.invalidCredentials'));
          if (error.message.includes('Email not confirmed')) throw new Error(t('auth.emailNotConfirmed'));
          throw error;
        }
        toast({ title: t('auth.welcome'), description: t('auth.successfullyLoggedIn') });
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) {
          if (error.message.includes('already registered')) throw new Error(t('auth.emailAlreadyRegistered'));
          throw error;
        }
        toast({ title: t('auth.checkEmail'), description: t('auth.confirmationEmailSent') });
      }
    } catch (error) {
      toast({ title: t('common.error'), description: error instanceof Error ? error.message : t('auth.authenticationFailed'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 enterprise-grid">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-sm space-y-6">
        {/* Brand */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg gradient-primary">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold font-display tracking-tight text-foreground">TRI/TFM</h1>
            <p className="text-xs text-muted-foreground mt-1">Enterprise Prompt Optimization</p>
          </div>
        </div>

        <Card className="border shadow-md">
          <CardHeader className="pb-4 space-y-1">
            <CardTitle className="text-base font-semibold text-center">
              {isForgotPassword ? t('auth.resetPassword') : isLogin ? t('auth.signIn') : t('auth.signUp')}
            </CardTitle>
            <CardDescription className="text-center text-xs">
              {isForgotPassword ? t('auth.forgotPasswordDesc') : t('auth.welcome')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isForgotPassword ? (
              <>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-medium">{t('auth.email')}</Label>
                    <Input id="email" type="email" placeholder="you@company.com" value={email}
                      onChange={(e) => setEmail(e.target.value)} required disabled={loading} className="h-9 text-sm" />
                  </div>
                  <Button type="submit" className="w-full h-9 text-sm gradient-primary" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                    {t('auth.sendResetLink')}
                  </Button>
                </form>
                <div className="mt-4 text-center">
                  <button type="button" onClick={() => setIsForgotPassword(false)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    {t('auth.backToLogin')}
                  </button>
                </div>
              </>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-medium">{t('auth.email')}</Label>
                    <Input id="email" type="email" placeholder="you@company.com" value={email}
                      onChange={(e) => setEmail(e.target.value)} required maxLength={255} disabled={loading} className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-medium">{t('auth.password')}</Label>
                    <Input id="password" type="password" placeholder="••••••••" value={password}
                      onChange={(e) => setPassword(e.target.value)} required minLength={6} maxLength={100} disabled={loading} className="h-9 text-sm" />
                    {!isLogin && (
                      <p className="text-[11px] text-muted-foreground">{t('auth.passwordHint')}</p>
                    )}
                  </div>
                  {isLogin && (
                    <div className="text-right">
                      <button type="button" onClick={() => setIsForgotPassword(true)}
                        className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                        {t('auth.forgotPassword')}
                      </button>
                    </div>
                  )}
                  <Button type="submit" className="w-full h-9 text-sm gradient-primary" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                    {isLogin ? t('auth.signInButton') : t('auth.signUpButton')}
                  </Button>
                </form>
                <div className="mt-4 space-y-2 text-center">
                  <button type="button" onClick={() => setIsLogin(!isLogin)} disabled={loading}
                    className="text-xs text-primary hover:underline block w-full">
                    {isLogin ? t('auth.noAccount') : t('auth.haveAccount')}
                  </button>
                  <button onClick={handleSkip} disabled={loading}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    {t('auth.skip')} <ArrowRight className="w-3 h-3" />
                  </button>
                  <p className="text-[10px] text-muted-foreground">{t('auth.guestModeNote')}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-[10px] text-muted-foreground">
          Enterprise-grade prompt optimization
        </p>
      </div>
    </div>
  );
}
