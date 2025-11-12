import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Copy, Check, Download, Code } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

  const jsonOutput = JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonOutput);
      setCopied(true);
      toast({
        title: "Copied to Clipboard",
        description: "Integration Readiness JSON copied successfully.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard.",
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
      title: "Downloaded",
      description: "Integration Readiness JSON downloaded successfully.",
    });
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Integration Readiness: API + IDE Output
        </CardTitle>
        <CardDescription>
          Standardized JSON for CI/CD pipelines and IDE plugins
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
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy JSON
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
            Download
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
          <p className="text-sm font-medium">Integration Examples:</p>
          
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">CI/CD Pipeline:</p>
            <code className="block p-2 bg-muted/50 rounded text-xs">
              {`# Quality gate check
if [ $(jq -r '.metrics.QGPercent' output.json) -lt 80 ]; then
  echo "Quality below 80% threshold"
  exit 1
fi`}
            </code>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">IDE Plugin (VSCode):</p>
            <code className="block p-2 bg-muted/50 rounded text-xs">
              {`// Parse JSON and show inline tooltip
const explain = data.explain;
editor.showInformationMessage(explain);`}
            </code>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Artifact Verification:</p>
            <code className="block p-2 bg-muted/50 rounded text-xs">
              {`# Verify content integrity
sha256sum -c <<< "${data.versionLog.hashOfContent} prompt.txt"`}
            </code>
          </div>
        </div>

        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Machine Readability:</strong> All fields use consistent types (numbers for metrics, 
            ISO 8601 for timestamps). The 'explain' field concatenates all accepted iteration explanations 
            with '\n' separators. Version log includes immutable content hashes for audit trails.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
