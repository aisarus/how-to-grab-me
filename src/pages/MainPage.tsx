import { useState, useRef, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TFMController } from '@/components/TFMController';
import PromptAssistantPage from './PromptAssistantPage';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sparkles, Bot } from 'lucide-react';

const MainPage = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>('tfm');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && activeTab === 'tfm') {
      setActiveTab('assistant');
    }
    if (isRightSwipe && activeTab === 'assistant') {
      setActiveTab('tfm');
    }
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen flex flex-col bg-background overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <header className="border-b border-border glass-effect sticky top-0 z-10">
          <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
            <TabsList className="flex-1 max-w-xs mx-auto grid grid-cols-2 bg-muted/50 border border-border rounded-lg h-9">
              <TabsTrigger 
                value="tfm" 
                className="text-xs sm:text-sm gap-1.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {t('common.main')}
              </TabsTrigger>
              <TabsTrigger 
                value="assistant" 
                className="text-xs sm:text-sm gap-1.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Bot className="w-3.5 h-3.5" />
                {t('common.assistant')}
              </TabsTrigger>
            </TabsList>
            <Link to="/data-room">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                <Database className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Data Room</span>
              </Button>
            </Link>
          </div>
        </header>
        
        <TabsContent value="tfm" className="flex-1 m-0">
          <TFMController />
        </TabsContent>
        
        <TabsContent value="assistant" className="flex-1 m-0">
          <PromptAssistantPage hideHeader />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MainPage;
