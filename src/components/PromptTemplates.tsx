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
    name: 'Контент-модерация',
    category: 'Безопасность',
    description: 'Детекция токсичного контента в текстах',
    prompt: 'Проанализируй следующий текст на наличие токсичного, оскорбительного или неприемлемого контента. Оцени уровень токсичности от 0 до 10 и объясни свою оценку.',
  },
  {
    id: '2',
    name: 'Генерация описаний',
    category: 'Контент',
    description: 'Создание SEO-оптимизированных описаний',
    prompt: 'Создай привлекательное и SEO-оптимизированное описание для товара/услуги. Включи ключевые преимущества, уникальные характеристики и призыв к действию.',
  },
  {
    id: '3',
    name: 'Анализ тональности',
    category: 'Аналитика',
    description: 'Определение эмоциональной окраски текста',
    prompt: 'Определи тональность следующего текста (положительная, нейтральная, отрицательная). Укажи степень уверенности в процентах и выдели ключевые фразы, которые повлияли на оценку.',
  },
  {
    id: '4',
    name: 'Извлечение сущностей',
    category: 'NLP',
    description: 'Извлечение именованных сущностей из текста',
    prompt: 'Извлеки из текста все именованные сущности: людей, организации, места, даты, денежные суммы. Представь результат в структурированном виде.',
  },
  {
    id: '5',
    name: 'Суммаризация',
    category: 'Контент',
    description: 'Краткое резюме длинного текста',
    prompt: 'Создай краткое резюме следующего текста. Выдели 3-5 ключевых пунктов. Сохрани основную идею и важные детали.',
  },
  {
    id: '6',
    name: 'Классификация',
    category: 'ML',
    description: 'Категоризация текста по темам',
    prompt: 'Классифицируй следующий текст по категориям: технологии, спорт, политика, развлечения, наука, бизнес, здоровье. Укажи степень уверенности для каждой категории.',
  },
  {
    id: '7',
    name: 'Перефразирование',
    category: 'Контент',
    description: 'Альтернативные формулировки текста',
    prompt: 'Перефразируй следующий текст, сохранив его смысл. Предложи 3 варианта с разной стилистикой: формальный, разговорный, технический.',
  },
  {
    id: '8',
    name: 'Q&A извлечение',
    category: 'Аналитика',
    description: 'Ответы на вопросы по тексту',
    prompt: 'Прочитай следующий текст и ответь на вопросы к нему. Если ответа нет в тексте, честно укажи это. Цитируй соответствующие части текста в своих ответах.',
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
          Шаблоны промптов
        </CardTitle>
        <CardDescription>
          Готовые промпты для популярных задач
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
            Все
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