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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
  const [improvements, setImprovements] = useState({
    successAtOne: false,
    reducedTTA: false,
    reducedCostVariance: false,
    policySafe: false,
  });
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

        {/* Improvement Reasons */}
        <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
          <Label className="text-sm font-semibold">Mark reasons for improvement:</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="success-at-one" 
                checked={improvements.successAtOne}
                onCheckedChange={(checked) => 
                  setImprovements({ ...improvements, successAtOne: checked as boolean })
                }
              />
              <label htmlFor="success-at-one" className="text-sm cursor-pointer">
                ✔ Success@1
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="reduced-tta" 
                checked={improvements.reducedTTA}
                onCheckedChange={(checked) => 
                  setImprovements({ ...improvements, reducedTTA: checked as boolean })
                }
              />
              <label htmlFor="reduced-tta" className="text-sm cursor-pointer">
                ↓ TTA
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="reduced-cost-variance" 
                checked={improvements.reducedCostVariance}
                onCheckedChange={(checked) => 
                  setImprovements({ ...improvements, reducedCostVariance: checked as boolean })
                }
              />
              <label htmlFor="reduced-cost-variance" className="text-sm cursor-pointer">
                ↓ cost variance
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="policy-safe" 
                checked={improvements.policySafe}
                onCheckedChange={(checked) => 
                  setImprovements({ ...improvements, policySafe: checked as boolean })
                }
              />
              <label htmlFor="policy-safe" className="text-sm cursor-pointer">
                policy-safe
              </label>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
          <p className="text-xs text-muted-foreground">
            <strong>Important:</strong> Мы осознанно покупаем +{tokenChange > 0 ? tokenChange : 0} refine-токенов, 
            чтобы сэкономить 1–2 итерации и сократить разброс стоимости. 
            В проде это даёт <em>предсказуемый бюджет</em> и выше Success@1.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};