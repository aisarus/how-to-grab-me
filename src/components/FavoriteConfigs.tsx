import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Star, Trash2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';

interface Config {
  a: number;
  b: number;
  maxIterations: number;
  convergenceThreshold: number;
  useEFMNB: boolean;
  useProposerCriticVerifier: boolean;
}

interface FavoriteConfig {
  id: string;
  name: string;
  created_at: string;
  a_parameter: number;
  b_parameter: number;
  max_iterations: number;
  convergence_threshold: number;
  use_efmnb: boolean;
  use_proposer_critic_verifier: boolean;
}

interface FavoriteConfigsProps {
  currentConfig: Config;
  onLoadConfig: (config: Config) => void;
}

export const FavoriteConfigs = ({ currentConfig, onLoadConfig }: FavoriteConfigsProps) => {
  const { t } = useLanguage();
  const [favorites, setFavorites] = useState<FavoriteConfig[]>([]);
  const [saveName, setSaveName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from('favorite_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const handleSave = async () => {
    if (!saveName.trim()) {
      toast({
        title: t('common.error'),
        description: t('favorites.enterName'),
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: t('common.error'),
          description: t('favorites.mustBeLoggedIn'),
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('favorite_configs')
        .insert({
          user_id: user.id,
          name: saveName,
          a_parameter: currentConfig.a,
          b_parameter: currentConfig.b,
          max_iterations: currentConfig.maxIterations,
          convergence_threshold: currentConfig.convergenceThreshold,
          use_efmnb: currentConfig.useEFMNB,
          use_proposer_critic_verifier: currentConfig.useProposerCriticVerifier,
        });

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('tfmController.configSaved'),
      });

      setSaveName('');
      setIsDialogOpen(false);
      loadFavorites();
    } catch (error) {
      console.error('Error saving favorite:', error);
      toast({
        title: t('common.error'),
        description: t('favorites.errorSaving'),
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('favorite_configs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: t('favorites.deleted'),
        description: t('favorites.configDeleted'),
      });

      loadFavorites();
    } catch (error) {
      console.error('Error deleting favorite:', error);
      toast({
        title: t('common.error'),
        description: t('favorites.errorDeleting'),
        variant: 'destructive',
      });
    }
  };

  const handleLoad = (favorite: FavoriteConfig) => {
    onLoadConfig({
      a: favorite.a_parameter,
      b: favorite.b_parameter,
      maxIterations: favorite.max_iterations,
      convergenceThreshold: favorite.convergence_threshold,
      useEFMNB: favorite.use_efmnb,
      useProposerCriticVerifier: favorite.use_proposer_critic_verifier,
    });

    toast({
      title: t('favorites.loaded'),
      description: `${t('tfmController.configName')}: "${favorite.name}"`,
    });
  };

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              {t('favorites.title')}
            </CardTitle>
            <CardDescription>
              {t('favorites.description')}
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm" className="gap-2">
                <Star className="w-4 h-4" />
                {t('favorites.saveCurrent')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('favorites.saveTitle')}</DialogTitle>
                <DialogDescription>
                  {t('favorites.saveDescription')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>{t('favorites.name')}</Label>
                  <Input
                    placeholder={t('favorites.namePlaceholder')}
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  />
                </div>
                <div className="p-3 bg-muted/50 rounded-lg space-y-1 text-sm">
                  <p className="font-medium">{t('favorites.currentParameters')}</p>
                  <p className="text-xs text-muted-foreground">
                    a: {currentConfig.a} | b: {currentConfig.b} | {t('favorites.iterations')}: {currentConfig.maxIterations}
                  </p>
                  <div className="flex gap-2 flex-wrap mt-2">
                    {currentConfig.useEFMNB && <Badge variant="secondary" className="text-xs">EFMNB</Badge>}
                    {currentConfig.useProposerCriticVerifier && <Badge variant="secondary" className="text-xs">PCV</Badge>}
                  </div>
                </div>
                <Button onClick={handleSave} className="w-full">
                  <Check className="w-4 h-4 mr-2" />
                  {t('common.save')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          {favorites.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Star className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">{t('favorites.noSaved')}</p>
              <p className="text-xs mt-1">{t('favorites.saveYourConfig')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {favorites.map((favorite) => (
                <div
                  key={favorite.id}
                  className="p-3 border rounded-lg hover:border-primary transition-colors bg-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <h4 className="font-semibold text-sm">{favorite.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        a: {favorite.a_parameter} | b: {favorite.b_parameter} | {t('favorites.iterations')}: {favorite.max_iterations}
                      </p>
                      <div className="flex gap-1 flex-wrap">
                        {favorite.use_efmnb && <Badge variant="outline" className="text-xs">EFMNB</Badge>}
                        {favorite.use_proposer_critic_verifier && <Badge variant="outline" className="text-xs">PCV</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(favorite.created_at).toLocaleDateString('en-US')}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLoad(favorite)}
                      >
                        {t('common.load')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(favorite.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};