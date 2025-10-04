import { Tank, SimulationConfig, RandomizerConfig } from '@/types/rotifer';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface ControlPanelProps {
  tanks: Tank[];
  config: SimulationConfig;
  randConfig: RandomizerConfig;
  onConfigChange: (config: Partial<SimulationConfig>) => void;
  onRandConfigChange: (config: Partial<RandomizerConfig>) => void;
  onAdjustSalinity: (idx: number, delta: number) => void;
  onAdjustTemperature: (idx: number, delta: number) => void;
  onRandomize: () => void;
  onExportPNG: () => void;
  onShareState: () => void;
  onToggleFullscreen: () => void;
  isFresh: boolean;
}

export function ControlPanel({
  tanks,
  config,
  randConfig,
  onConfigChange,
  onRandConfigChange,
  onAdjustSalinity,
  onAdjustTemperature,
  onRandomize,
  onExportPNG,
  onShareState,
  onToggleFullscreen,
  isFresh,
}: ControlPanelProps) {
  return (
    <Card className="fixed right-3 top-3 bottom-3 min-w-[340px] max-w-[380px] overflow-auto bg-background/95 backdrop-blur-sm border-primary/20 p-4">
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-bold mb-2">Параметры микроскопа</h3>
          <div className="space-y-4">
            <div>
              <div className="text-xs text-muted-foreground mb-2">
                Плотность (rot/mL): <b>{config.density}</b>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => onConfigChange({ density: Math.max(20, config.density - 10) })}>
                  ◄ −10
                </Button>
                <Button size="sm" variant="outline" onClick={() => onConfigChange({ density: Math.min(500, config.density + 10) })}>
                  +10 ►
                </Button>
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-2">
                Глубина резкости (мм): <b>{config.dofMM.toFixed(1)}</b>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => onConfigChange({ dofMM: Math.max(0.3, +(config.dofMM - 0.1).toFixed(1)) })}>
                  ◄ −0.1
                </Button>
                <Button size="sm" variant="outline" onClick={() => onConfigChange({ dofMM: Math.min(2.0, +(config.dofMM + 0.1).toFixed(1)) })}>
                  +0.1 ►
                </Button>
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-2">
                Порог микроскопа (×): <b>{config.threshold}</b>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => onConfigChange({ threshold: Math.max(4, config.threshold - 1) })}>
                  ◄ −1
                </Button>
                <Button size="sm" variant="outline" onClick={() => onConfigChange({ threshold: Math.min(60, config.threshold + 1) })}>
                  +1 ►
                </Button>
              </div>
            </div>
          </div>
        </div>

        {!isFresh && (
          <div>
            <h3 className="text-sm font-bold mb-2">Солёность и датчик</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Стрелки по ±0.5 ppt. LED: зелёный 5–15, жёлтый 20–35, красный &lt;5 или &gt;35.
            </p>
            <div className="space-y-3">
              {tanks.map((tank, i) => (
                <Card key={tank.id} className="p-3 bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs">
                      Бак {tank.id}: <b>{tank.salTarget.toFixed(1)}</b> ppt • датчик: <b>{tank.salSensor.toFixed(1)}</b> ppt
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => onAdjustSalinity(i, -0.5)}>
                      ◄ −0.5
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onAdjustSalinity(i, 0.5)}>
                      +0.5 ►
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-sm font-bold mb-2">Температура (°C) и датчик</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Стрелки по ±0.5 °C. LED: зелёный 20–25, жёлтый ±2 °C, красный вне диапазона.
          </p>
          <div className="space-y-3">
            {tanks.map((tank, i) => (
              <Card key={tank.id} className="p-3 bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs">
                    Бак {tank.id}: <b>{tank.tmpTarget.toFixed(1)}</b> °C • датчик: <b>{tank.tmpSensor.toFixed(1)}</b> °C
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => onAdjustTemperature(i, -0.5)}>
                    ◄ −0.5
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onAdjustTemperature(i, 0.5)}>
                    +0.5 ►
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold mb-2">Авто-рандом T/S</h3>
          <Card className="p-3 bg-muted/50 space-y-3">
            <div className="flex items-center space-x-2">
              <Switch checked={randConfig.enabled} onCheckedChange={(checked) => onRandConfigChange({ enabled: checked })} />
              <Label className="text-xs">Включить авто-рандом</Label>
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-2">
                Интервал (с): <b>{randConfig.every}</b>
              </div>
              <Slider
                value={[randConfig.every]}
                onValueChange={([value]) => onRandConfigChange({ every: value })}
                min={10}
                max={120}
                step={5}
              />
            </div>

            {!isFresh && (
              <div>
                <div className="text-xs text-muted-foreground mb-2">
                  ΔS, ppt (амплитуда): <b>{randConfig.dS.toFixed(1)}</b>
                </div>
                <Slider
                  value={[randConfig.dS]}
                  onValueChange={([value]) => onRandConfigChange({ dS: value })}
                  min={0}
                  max={5}
                  step={0.5}
                />
              </div>
            )}

            <div>
              <div className="text-xs text-muted-foreground mb-2">
                ΔT, °C (амплитуда): <b>{randConfig.dT.toFixed(1)}</b>
              </div>
              <Slider
                value={[randConfig.dT]}
                onValueChange={([value]) => onRandConfigChange({ dT: value })}
                min={0}
                max={3}
                step={0.1}
              />
            </div>

            <Button size="sm" onClick={onRandomize} className="w-full">
              Случайно сейчас
            </Button>
          </Card>
        </div>

        <div>
          <h3 className="text-sm font-bold mb-2">Экспорт и шэринг</h3>
          <div className="flex flex-col gap-2">
            <Button size="sm" variant="outline" onClick={onExportPNG}>
              Снимок PNG
            </Button>
            <Button size="sm" variant="outline" onClick={onShareState}>
              Скопировать ссылку-состояние
            </Button>
            <Button size="sm" variant="outline" onClick={onToggleFullscreen}>
              Во весь экран
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Горячие клавиши: <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">P</kbd> PNG,{' '}
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">S</kbd> share,{' '}
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">F</kbd> fullscreen,{' '}
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">M</kbd> рамка микроскопа.
          </p>
        </div>
      </div>
    </Card>
  );
}
