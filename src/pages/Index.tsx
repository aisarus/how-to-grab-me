import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Index() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Card className="text-center p-12 bg-background/95 backdrop-blur-sm border-primary/20 max-w-2xl mx-4">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          ROTIFER LAB
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Интерактивная лаборатория для симуляции коловраток
        </p>
        <div className="space-y-4 text-left mb-8 text-sm text-muted-foreground">
          <p>✨ 4 аквариума с псевдо-3D визуализацией</p>
          <p>🌊 Физическая симуляция воды (волны, рябь)</p>
          <p>🔬 Микроскоп с depth-of-field эффектом</p>
          <p>🦠 До 2400 коловраток с биологической моделью кинезиса</p>
          <p>🎨 Морской и пресноводный режимы</p>
          <p>⚡ React-архитектура с изолированными компонентами</p>
        </div>
        <Link to="/lab">
          <Button size="lg" className="text-lg px-8 py-6">
            Открыть лабораторию
          </Button>
        </Link>
        <p className="text-xs text-muted-foreground mt-6">
          Портировано из монолита в модульный React для безопасного редактирования через ИИ
        </p>
      </Card>
    </div>
  );
}
