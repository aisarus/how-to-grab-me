import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselApi,
} from '@/components/ui/carousel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OptimizationResult {
  id: string;
  created_at: string;
  original_prompt: string;
  optimized_prompt: string;
  original_tokens: number;
  optimized_tokens: number;
  improvement_percentage: number;
  a_parameter: number;
  b_parameter: number;
  iterations: number;
  ab_test_winner: string | null;
  ab_test_notes: string | null;
  erikson_stage: number | null;
}

interface PromptCarouselModalProps {
  results: OptimizationResult[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PromptCarouselModal({
  results,
  initialIndex,
  open,
  onOpenChange,
}: PromptCarouselModalProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(initialIndex);

  useEffect(() => {
    if (!api) return;

    // Set initial index when API is ready
    api.scrollTo(initialIndex, true);

    // Listen for selection changes
    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    api.on('select', onSelect);

    return () => {
      api.off('select', onSelect);
    };
  }, [api, initialIndex]);

  const currentResult = results[current];

  if (!currentResult) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">
              Prompt Analysis
              <span className="text-sm text-muted-foreground ml-3">
                {current + 1} / {results.length}
              </span>
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Carousel
          setApi={setApi}
          opts={{
            startIndex: initialIndex,
            loop: false,
            align: 'start',
            dragFree: true,
          }}
          className="w-full h-full"
        >
          <CarouselContent className="h-full">
            {results.map((result, index) => (
              <CarouselItem key={result.id} className="h-full">
                <div className="px-6 pb-6 h-full">
                  <ScrollArea className="h-[calc(90vh-120px)]">
                    <div className="space-y-6 pr-4">
                      {/* Metadata */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {new Date(result.created_at).toLocaleString('ru-RU')}
                        </Badge>
                        {result.erikson_stage && (
                          <Badge variant="secondary" className="text-xs">
                            Erikson Stage {result.erikson_stage}
                          </Badge>
                        )}
                        {result.ab_test_winner && (
                          <Badge
                            variant={result.ab_test_winner === 'optimized' ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            Winner: {result.ab_test_winner}
                          </Badge>
                        )}
                      </div>

                      {/* Key Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="border-2">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground">
                              Improvement
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-primary">
                              {result.improvement_percentage.toFixed(1)}%
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-2">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground">
                              Iterations
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{result.iterations}</div>
                          </CardContent>
                        </Card>

                        <Card className="border-2">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground">
                              Tokens Before
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{result.original_tokens}</div>
                          </CardContent>
                        </Card>

                        <Card className="border-2">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground">
                              Tokens After
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                              {result.optimized_tokens}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Parameters */}
                      <Card className="border-2">
                        <CardHeader>
                          <CardTitle className="text-sm">Parameters</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">A Parameter:</span>
                            <span className="text-sm font-mono">{result.a_parameter}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">B Parameter:</span>
                            <span className="text-sm font-mono">{result.b_parameter}</span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Prompts Side by Side */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Card className="border-2 border-muted">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center justify-between">
                              <span>Original Prompt</span>
                              <Badge variant="outline" className="text-xs">
                                {result.original_tokens} tokens
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ScrollArea className="h-[300px]">
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {result.original_prompt}
                              </p>
                            </ScrollArea>
                          </CardContent>
                        </Card>

                        <Card className="border-2 border-primary/30 bg-primary/5">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center justify-between">
                              <span className="text-primary">Optimized Prompt</span>
                              <Badge variant="default" className="text-xs">
                                {result.optimized_tokens} tokens
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ScrollArea className="h-[300px]">
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {result.optimized_prompt}
                              </p>
                            </ScrollArea>
                          </CardContent>
                        </Card>
                      </div>

                      {/* A/B Test Notes */}
                      {result.ab_test_notes && (
                        <Card className="border-2 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
                          <CardHeader>
                            <CardTitle className="text-sm">A/B Test Notes</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm leading-relaxed">{result.ab_test_notes}</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            <CarouselPrevious className="relative left-0 translate-y-0" />
            <CarouselNext className="relative right-0 translate-y-0" />
          </div>
        </Carousel>
      </DialogContent>
    </Dialog>
  );
}
