import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { GitCompare, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ComparisonModalProps {
  originalPrompt: string;
  optimizedPrompt: string;
  originalTokens: number;
  optimizedTokens: number;
  improvementPercentage: number;
  iterations: number;
}

export const ComparisonModal = ({
  originalPrompt,
  optimizedPrompt,
  originalTokens,
  optimizedTokens,
  improvementPercentage,
  iterations,
}: ComparisonModalProps) => {
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [copiedOptimized, setCopiedOptimized] = useState(false);
  const { toast } = useToast();

  const handleCopy = async (text: string, type: 'original' | 'optimized') => {
    try {
      await navigator.clipboard.writeText(text);
      
      if (type === 'original') {
        setCopiedOriginal(true);
        setTimeout(() => setCopiedOriginal(false), 2000);
      } else {
        setCopiedOptimized(true);
        setTimeout(() => setCopiedOptimized(false), 2000);
      }

      toast({
        title: 'Copied',
        description: 'Prompt copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy text',
        variant: 'destructive',
      });
    }
  };

  const tokenChange = optimizedTokens - originalTokens;
  const isTokenIncrease = tokenChange > 0;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <GitCompare className="w-4 h-4" />
          Compare
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-primary" />
            Side-by-Side Comparison
          </DialogTitle>
          <DialogDescription>
            Detailed comparison of original and optimized prompts
          </DialogDescription>
        </DialogHeader>

        {/* Metrics */}
        <div className="grid grid-cols-4 gap-3 py-4 border-y">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              +{Math.abs(improvementPercentage)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">Quality Improvement</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{iterations}</p>
            <p className="text-xs text-muted-foreground mt-1">Iterations</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{originalTokens}</p>
            <p className="text-xs text-muted-foreground mt-1">Tokens Before</p>
          </div>
          <div className="text-center">
            <p className={`text-xl font-bold ${isTokenIncrease ? 'text-blue-600' : 'text-green-600'}`}>
              {optimizedTokens}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Tokens After ({isTokenIncrease ? '+' : ''}{tokenChange})
            </p>
          </div>
        </div>

        {/* Side by side comparison */}
        <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
          {/* Original */}
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Original Prompt</h3>
                <Badge variant="secondary">{originalTokens} tokens</Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(originalPrompt, 'original')}
              >
                {copiedOriginal ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <ScrollArea className="flex-1 h-[400px] border rounded-lg p-4 bg-muted/30">
              <p className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                {originalPrompt}
              </p>
            </ScrollArea>
          </div>

          {/* Optimized */}
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-primary">Optimized Prompt</h3>
                <Badge variant="default">{optimizedTokens} tokens</Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(optimizedPrompt, 'optimized')}
              >
                {copiedOptimized ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <ScrollArea className="flex-1 h-[400px] border-2 border-primary/30 rounded-lg p-4 bg-primary/5">
              <p className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                {optimizedPrompt}
              </p>
            </ScrollArea>
          </div>
        </div>

        {/* Info */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Important:</strong> TRI/TFM optimizes AI response quality, not token count. 
            The optimized prompt may contain more tokens but delivers significantly better results.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};