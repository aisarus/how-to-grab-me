import { useState, useRef, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TFMController } from '@/components/TFMController';
import PromptAssistantPage from './PromptAssistantPage';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sparkles, MessageSquare } from 'lucide-react';

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
        <div className="border-b glass-effect sticky top-0 z-10">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <TabsList className="w-full max-w-md mx-auto grid grid-cols-2">
              <TabsTrigger value="tfm" className="text-sm sm:text-base gap-2">
                <Sparkles className="w-4 h-4" />
                {t('common.main')}
              </TabsTrigger>
              <TabsTrigger value="assistant" className="text-sm sm:text-base gap-2">
                <MessageSquare className="w-4 h-4" />
                {t('common.assistant')}
              </TabsTrigger>
            </TabsList>
          </div>
        </div>
        
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
