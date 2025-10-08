import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Sparkles, Home, BarChart3, LogOut, Bot, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface PromptAssistantPageProps {
  hideHeader?: boolean;
}

const PromptAssistantPage = ({ hideHeader = false }: PromptAssistantPageProps) => {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: t('promptAssistant.initialMessage')
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [useEfmnb, setUseEfmnb] = useState(true);
  const [useErikson, setUseErikson] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('prompt-assistant', {
        body: { 
          messages: [...messages, userMessage],
          useEfmnb,
          useErikson,
          language
        }
      });

      if (error) throw error;

      const assistantMessage: Message = { 
        role: 'assistant', 
        content: data.response 
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('promptAssistant.errorMessage'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      {!hideHeader && (
        <div className="border-b glass-effect sticky top-0 z-10 flex-shrink-0">
          <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow flex-shrink-0">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent truncate">
                    {t('promptAssistant.title')}
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">
                    {t('promptAssistant.subtitle')}
                  </p>
                </div>
              </div>
              <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                <LanguageSwitcher />
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1 sm:gap-2"
                  onClick={() => navigate('/')}
                >
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('common.main')}</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1 sm:gap-2"
                  onClick={() => navigate('/analytics')}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('common.analytics')}</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1 sm:gap-2"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    navigate('/auth');
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('common.logout')}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Container */}
      <div className="flex-1 container mx-auto px-4 sm:px-6 py-6 flex flex-col max-w-4xl">
        {/* Messages */}
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-4 pb-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <Card
                  className={`max-w-[80%] p-4 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </Card>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <Card className="bg-muted p-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="pt-4 border-t mt-4 space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="efmnb-filter"
                checked={useEfmnb}
                onCheckedChange={setUseEfmnb}
              />
              <Label htmlFor="efmnb-filter" className="cursor-pointer">
                {t('promptAssistant.filterEfmnb')}
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="erikson-filter"
                checked={useErikson}
                onCheckedChange={setUseErikson}
              />
              <Label htmlFor="erikson-filter" className="cursor-pointer">
                {t('promptAssistant.filterErikson')}
              </Label>
            </div>
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Textarea
              placeholder={t('promptAssistant.placeholder')}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              rows={3}
              className="resize-none"
            />
            <Button
              onClick={handleSubmit}
              disabled={loading || !input.trim()}
              size="icon"
              className="h-auto"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('promptAssistant.sendHint')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PromptAssistantPage;
