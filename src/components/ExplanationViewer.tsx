import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, TrendingUp, Wrench, Zap } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useLanguage } from '@/contexts/LanguageContext';

interface ExplanationData {
  mainIssues: string[];
  keyTransformations: string[];
  expectedEffects: string[];
  fullExplanation: string;
}

interface ExplanationViewerProps {
  explanations: ExplanationData[];
}

export const ExplanationViewer = ({ explanations }: ExplanationViewerProps) => {
  const { t } = useLanguage();
  
  if (explanations.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          {t('explanation.title')}
        </CardTitle>
        <CardDescription>
          {t('explanation.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible defaultValue="iteration-1" className="w-full">
          {explanations.map((explanation, index) => (
            <AccordionItem key={index} value={`iteration-${index + 1}`}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    {t('explanation.iteration')} {index + 1}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {explanation.mainIssues.length} {t('explanation.issuesDetected')}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <TrendingUp className="h-4 w-4 text-red-500" />
                      {t('explanation.mainIssues')}
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {explanation.mainIssues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Wrench className="h-4 w-4 text-blue-500" />
                      {t('explanation.keyTransformations')}
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {explanation.keyTransformations.map((transform, i) => (
                        <li key={i}>{transform}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Zap className="h-4 w-4 text-green-500" />
                      {t('explanation.expectedEffects')}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {explanation.expectedEffects.map((effect, i) => (
                        <Badge key={i} variant="secondary" className="font-mono text-xs">
                          {effect}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <pre className="text-xs whitespace-pre-wrap font-mono">
                      {explanation.fullExplanation}
                    </pre>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-xs text-muted-foreground">
            <strong>{t('explanation.cumulativeNote')}</strong>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
