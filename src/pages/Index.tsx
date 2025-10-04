import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Index() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Card className="text-center p-12 bg-background/95 backdrop-blur-sm border-primary/20 max-w-2xl mx-4">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          AI LAB
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Экспериментальная лаборатория для работы с ИИ
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-4 text-left text-sm text-muted-foreground border border-primary/20 rounded-lg p-4">
            <h3 className="font-semibold text-lg text-foreground">Rotifer Lab</h3>
            <p>✨ 4 аквариума с псевдо-3D визуализацией</p>
            <p>🌊 Физическая симуляция воды</p>
            <p>🔬 Микроскоп с depth-of-field</p>
            <p>🦠 До 2400 коловраток</p>
            <Link to="/lab">
              <Button size="lg" className="w-full mt-4">
                Открыть Rotifer Lab
              </Button>
            </Link>
          </div>

          <div className="space-y-4 text-left text-sm text-muted-foreground border border-primary/20 rounded-lg p-4">
            <h3 className="font-semibold text-lg text-foreground">TFM Controller</h3>
            <p>⚡ Оптимизация ответов LLM</p>
            <p>🔄 Итеративный D→S контроллер</p>
            <p>📊 Сокращение до 86% токенов</p>
            <p>💰 Экономия на API вызовах</p>
            <Link to="/tfm">
              <Button size="lg" className="w-full mt-4" variant="outline">
                Открыть TFM Controller
              </Button>
            </Link>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Модульная React-архитектура для безопасного редактирования через ИИ
        </p>
      </Card>
    </div>
  );
}
