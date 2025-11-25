import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GitBranch, CheckCircle2, XCircle, RotateCcw, Clock, Hash } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface VersionLogEntry {
  originalId: string;
  newId: string;
  iterationNumber: number;
  previousContentHash: string;
  contentHash: string;
  promptContent: string;
  reviewerAction: 'pending' | 'accept' | 'reject' | 'rollback';
  timestamp: string;
}

interface VersionHistoryViewerProps {
  versionLog: VersionLogEntry[];
  onAccept?: (versionId: string) => void;
  onReject?: (versionId: string) => void;
  onRollback?: (versionId: string) => void;
}

export const VersionHistoryViewer = ({ 
  versionLog, 
  onAccept, 
  onReject, 
  onRollback 
}: VersionHistoryViewerProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [localVersionLog, setLocalVersionLog] = useState(versionLog);

  if (versionLog.length === 0) {
    return null;
  }

  const handleAccept = (versionId: string, index: number) => {
    setLocalVersionLog(prev => 
      prev.map((v, i) => 
        i === index ? { ...v, reviewerAction: 'accept' as const } : v
      )
    );
    toast({
      title: t('versionHistory.versionAccepted'),
      description: `${t('versionHistory.versionAcceptedDesc')} ${versionId}`,
    });
    onAccept?.(versionId);
  };

  const handleReject = (versionId: string, index: number) => {
    setLocalVersionLog(prev => 
      prev.map((v, i) => 
        i === index ? { ...v, reviewerAction: 'reject' as const } : v
      )
    );
    toast({
      title: t('versionHistory.versionRejected'),
      description: `${versionId} ${t('versionHistory.versionRejectedDesc')}`,
      variant: "destructive",
    });
    onReject?.(versionId);
  };

  const handleRollback = (versionId: string, index: number) => {
    setLocalVersionLog(prev => 
      prev.map((v, i) => 
        i === index ? { ...v, reviewerAction: 'rollback' as const } : v
      )
    );
    toast({
      title: t('versionHistory.rollbackInitiated'),
      description: `${t('versionHistory.rollbackDesc')} ${versionId}.`,
    });
    onRollback?.(versionId);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'accept':
        return <Badge className="bg-green-500/20 text-green-700 border-green-500/30">{t('versionHistory.accepted')}</Badge>;
      case 'reject':
        return <Badge className="bg-red-500/20 text-red-700 border-red-500/30">{t('versionHistory.rejected')}</Badge>;
      case 'rollback':
        return <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30">{t('versionHistory.rolledBack')}</Badge>;
      default:
        return <Badge variant="outline">{t('versionHistory.pending')}</Badge>;
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary" />
          {t('versionHistory.title')}
        </CardTitle>
        <CardDescription>
          {t('versionHistory.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {localVersionLog.map((version, index) => (
            <AccordionItem key={version.newId} value={version.newId}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 flex-1">
                  <Badge variant="outline" className="font-mono">
                    v{version.iterationNumber}
                  </Badge>
                  <span className="text-sm font-medium">{version.newId}</span>
                  {getActionBadge(version.reviewerAction)}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs">{t('versionHistory.timestamp')}</span>
                      </div>
                      <p className="font-mono text-xs">
                        {new Date(version.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Hash className="h-3 w-3" />
                        <span className="text-xs">{t('versionHistory.contentHash')}</span>
                      </div>
                      <p className="font-mono text-xs truncate" title={version.contentHash}>
                        {version.contentHash.substring(0, 16)}...
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">{t('versionHistory.promptContent')}</p>
                    <div className="p-3 bg-muted/50 rounded-lg max-h-32 overflow-y-auto">
                      <p className="text-sm whitespace-pre-wrap">{version.promptContent}</p>
                    </div>
                  </div>

                  {version.previousContentHash && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">{t('versionHistory.previousHash')}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {version.previousContentHash}
                      </p>
                    </div>
                  )}

                  {version.reviewerAction === 'pending' && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-green-500/30 hover:bg-green-500/10"
                        onClick={() => handleAccept(version.newId, index)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        {t('versionHistory.accept')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-red-500/30 hover:bg-red-500/10"
                        onClick={() => handleReject(version.newId, index)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        {t('versionHistory.reject')}
                      </Button>
                    </div>
                  )}

                  {version.reviewerAction === 'accept' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-blue-500/30 hover:bg-blue-500/10"
                      onClick={() => handleRollback(version.newId, index)}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      {t('versionHistory.rollback')}
                    </Button>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-xs text-muted-foreground">
            <strong>{t('versionHistory.stateNote')}</strong>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
