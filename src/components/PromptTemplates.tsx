import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

interface Template {
  id: string;
  name: string;
  category: string;
  prompt: string;
  description: string;
}

const getTemplates = (t: any): Template[] => [
  // Text types
  {
    id: '1',
    name: t('templates.creativeText.name'),
    category: t('templates.categories.text'),
    description: t('templates.creativeText.description'),
    prompt: t('templates.creativeText.prompt'),
  },
  {
    id: '2',
    name: t('templates.scientificText.name'),
    category: t('templates.categories.text'),
    description: t('templates.scientificText.description'),
    prompt: t('templates.scientificText.prompt'),
  },
  {
    id: '3',
    name: t('templates.journalisticText.name'),
    category: t('templates.categories.text'),
    description: t('templates.journalisticText.description'),
    prompt: t('templates.journalisticText.prompt'),
  },
  
  // Programming languages
  {
    id: '4',
    name: t('templates.jsCode.name'),
    category: t('templates.categories.code'),
    description: t('templates.jsCode.description'),
    prompt: t('templates.jsCode.prompt'),
  },
  {
    id: '5',
    name: t('templates.pythonCode.name'),
    category: t('templates.categories.code'),
    description: t('templates.pythonCode.description'),
    prompt: t('templates.pythonCode.prompt'),
  },
  {
    id: '6',
    name: t('templates.cssStyles.name'),
    category: t('templates.categories.code'),
    description: t('templates.cssStyles.description'),
    prompt: t('templates.cssStyles.prompt'),
  },
  {
    id: '7',
    name: t('templates.javaCode.name'),
    category: t('templates.categories.code'),
    description: t('templates.javaCode.description'),
    prompt: t('templates.javaCode.prompt'),
  },
  {
    id: '8',
    name: t('templates.cppCode.name'),
    category: t('templates.categories.code'),
    description: t('templates.cppCode.description'),
    prompt: t('templates.cppCode.prompt'),
  },
  
  // Images
  {
    id: '9',
    name: t('templates.imageAnalysis.name'),
    category: t('templates.categories.images'),
    description: t('templates.imageAnalysis.description'),
    prompt: t('templates.imageAnalysis.prompt'),
  },
];

interface PromptTemplatesProps {
  onSelectTemplate: (prompt: string) => void;
}

export const PromptTemplates = ({ onSelectTemplate }: PromptTemplatesProps) => {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const templates = getTemplates(t);
  const categories = Array.from(new Set(templates.map(t => t.category)));
  const filteredTemplates = selectedCategory
    ? templates.filter(t => t.category === selectedCategory)
    : templates;

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          {t('templates.title')}
        </CardTitle>
        <CardDescription>
          {t('templates.description')}
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
            {t('common.all')}
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