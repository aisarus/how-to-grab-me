import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Template {
  id: string;
  name: string;
  category: string;
  prompt: string;
  description: string;
}

const templates: Template[] = [
  {
    id: '1',
    name: 'Text Generation',
    category: 'Text',
    description: 'Create compelling and well-structured text content',
    prompt: 'Generate high-quality, engaging text content. Focus on clarity, coherence, and purpose. Ensure the text is well-structured with proper flow and addresses the target audience effectively.',
  },
  {
    id: '2',
    name: 'Code Generation',
    category: 'Code',
    description: 'Generate clean and efficient code',
    prompt: 'Write clean, efficient, and well-documented code. Follow best practices and design patterns. Include comments explaining complex logic and ensure the code is maintainable and scalable.',
  },
  {
    id: '3',
    name: 'Image Description',
    category: 'Images',
    description: 'Create detailed and accurate image descriptions',
    prompt: 'Describe the image in detail, including visual elements, composition, colors, mood, and context. Be precise and objective while capturing all important aspects of the image.',
  },
];

interface PromptTemplatesProps {
  onSelectTemplate: (prompt: string) => void;
}

export const PromptTemplates = ({ onSelectTemplate }: PromptTemplatesProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(templates.map(t => t.category)));
  const filteredTemplates = selectedCategory
    ? templates.filter(t => t.category === selectedCategory)
    : templates;

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Prompt Templates
        </CardTitle>
        <CardDescription>
          Ready-to-use prompts for common tasks
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Templates list */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="p-4 border rounded-lg hover:border-primary transition-colors cursor-pointer bg-card"
                onClick={() => onSelectTemplate(template.prompt)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">{template.name}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {template.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {template.description}
                    </p>
                    <p className="text-xs font-mono text-muted-foreground line-clamp-2 bg-muted/50 p-2 rounded">
                      {template.prompt}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};