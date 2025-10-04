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
  // Text types
  {
    id: '1',
    name: 'Creative Text',
    category: 'Text',
    description: 'Generate artistic and engaging creative content',
    prompt: 'Write creative, artistic text with vivid imagery and emotional depth. Use literary devices, metaphors, and engaging narrative style. Focus on storytelling, character development, and creating an immersive experience for the reader.',
  },
  {
    id: '2',
    name: 'Scientific Text',
    category: 'Text',
    description: 'Create precise and evidence-based scientific content',
    prompt: 'Generate scientific text with precise terminology, logical structure, and evidence-based arguments. Use formal academic language, cite relevant concepts, maintain objectivity, and ensure technical accuracy. Structure with clear introduction, methodology, results, and conclusions.',
  },
  {
    id: '3',
    name: 'Journalistic Text',
    category: 'Text',
    description: 'Write informative and engaging news content',
    prompt: 'Create journalistic content that is factual, balanced, and engaging. Use the inverted pyramid structure, lead with the most important information, maintain objectivity, include relevant context and quotes. Write in clear, accessible language suitable for a general audience.',
  },
  
  // Programming languages
  {
    id: '4',
    name: 'JavaScript Code',
    category: 'Code',
    description: 'Generate modern JavaScript/TypeScript code',
    prompt: 'Write clean, modern JavaScript/TypeScript code following ES6+ standards. Use proper async/await patterns, implement error handling, follow functional programming principles where appropriate. Include JSDoc comments, use meaningful variable names, and ensure code is modular and testable.',
  },
  {
    id: '5',
    name: 'Python Code',
    category: 'Code',
    description: 'Generate Pythonic and efficient Python code',
    prompt: 'Write Pythonic code following PEP 8 style guidelines. Use type hints, implement proper error handling with try-except blocks, leverage built-in functions and standard library. Include docstrings, use list comprehensions appropriately, and ensure code is readable and maintainable.',
  },
  {
    id: '6',
    name: 'CSS Styles',
    category: 'Code',
    description: 'Create modern and responsive CSS',
    prompt: 'Generate modern CSS using best practices. Implement responsive design with flexbox/grid, use CSS variables for theming, follow BEM or similar naming conventions. Ensure cross-browser compatibility, optimize for performance, and write maintainable, reusable styles.',
  },
  {
    id: '7',
    name: 'Java Code',
    category: 'Code',
    description: 'Generate enterprise-grade Java code',
    prompt: 'Write robust Java code following SOLID principles and design patterns. Use proper encapsulation, implement interfaces where appropriate, handle exceptions correctly. Include JavaDoc comments, follow naming conventions, and ensure code is thread-safe when needed.',
  },
  {
    id: '8',
    name: 'C++ Code',
    category: 'Code',
    description: 'Generate efficient and modern C++ code',
    prompt: 'Write modern C++ code (C++17/20) following best practices. Use RAII principles, smart pointers for memory management, implement proper move semantics. Ensure const-correctness, avoid memory leaks, and optimize for performance while maintaining code clarity.',
  },
  
  // Images
  {
    id: '9',
    name: 'Image Analysis',
    category: 'Images',
    description: 'Create detailed and accurate image descriptions',
    prompt: 'Analyze and describe the image in comprehensive detail. Cover visual elements, composition, colors, lighting, mood, and context. Identify key subjects, their relationships, and spatial arrangement. Be precise and objective while capturing all important aspects of the image.',
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