import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Copy, Check, Download, Code } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface IntegrationReadinessData {
  optimizedPrompt: string;
  explain: string;
  metrics: {
    QGPercent: number;
    RGIPercent: number;
    EffPercent: number;
    Iterations: number;
  };
  versionLog: {
    originalId: string;
    finalId: string;
    finalIterationNumber: number;
    reviewerAction: string;
    timestamp: string;
    hashOfContent: string;
  };
}

interface IntegrationReadinessOutputProps {
  data: IntegrationReadinessData;
}

export const IntegrationReadinessOutput = ({ data }: IntegrationReadinessOutputProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const jsonOutput = JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonOutput);
      setCopied(true);
      toast({
        title: t('integration.copied'),
        description: t('integration.copiedSuccess'),
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: t('integration.copyFailed'),
        description: t('integration.copiedFailed'),
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonOutput], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-optimization-${data.versionLog.finalId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: t('integration.downloaded'),
      description: t('integration.downloadSuccess'),
    });
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          {t('integration.title')}
        </CardTitle>
        <CardDescription>
          {t('integration.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                {t('integration.copied')}
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                {t('integration.copyJson')}
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4 mr-2" />
            {t('integration.download')}
          </Button>
        </div>

        <div className="relative">
          <div className="absolute top-2 right-2 z-10">
            <Code className="h-4 w-4 text-muted-foreground" />
          </div>
          <pre className="p-4 bg-muted/50 rounded-lg overflow-x-auto max-h-96 text-xs font-mono border border-border">
            {jsonOutput}
          </pre>
        </div>

        <div className="space-y-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-sm font-medium">{t('integration.examples')}</p>
          
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{t('integration.cicdPipeline')}</p>
            <code className="block p-2 bg-muted/50 rounded text-xs">
              {`# Quality gate check
if [ $(jq -r '.metrics.QGPercent' output.json) -lt 80 ]; then
  echo "Quality below 80% threshold"
  exit 1
fi`}
            </code>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{t('integration.idePlugin')}</p>
            <code className="block p-2 bg-muted/50 rounded text-xs">
              {`// Parse JSON and show inline tooltip
const explain = data.explain;
editor.showInformationMessage(explain);`}
            </code>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{t('integration.artifactVerification')}</p>
            <code className="block p-2 bg-muted/50 rounded text-xs">
              {`# Verify content integrity
sha256sum -c <<< "${data.versionLog.hashOfContent} prompt.txt"`}
            </code>
          </div>
        </div>

        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>{t('integration.machineReadability')}</strong>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
