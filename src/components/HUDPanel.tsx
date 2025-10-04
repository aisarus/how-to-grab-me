import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Species } from '@/types/rotifer';

interface HUDPanelProps {
  species: Species[];
  speciesIdx: number;
  onSpeciesChange: (idx: number) => void;
  density: number;
  dofMM: number;
  threshold: number;
  zoom: number;
}

export function HUDPanel({ species, speciesIdx, onSpeciesChange, density, dofMM, threshold, zoom }: HUDPanelProps) {
  return (
    <Card className="fixed left-3 top-3 bottom-3 w-[280px] bg-background/95 backdrop-blur-sm border-primary/20 p-4 overflow-auto">
      <h1 className="text-sm font-bold mb-2 tracking-wide">ROTIFER LAB • React • 4 бака • псевдо-3D</h1>
      <p className="text-xs text-muted-foreground mb-3">
        Зум колёсиком; панорама ПКМ; рябь ЛКМ; фокус на бак <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">1–4</kbd>;
        скрыть UI — <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">H</kbd>; вписать всё —{' '}
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">R</kbd>.
      </p>
      <div className="text-xs text-muted-foreground mb-3">
        Плотность: <b>{density}</b> rot/mL • ГРИП: <b>{dofMM.toFixed(1)}</b> мм • Порог микроскопа: <b>{threshold}</b>× • Зум:{' '}
        <b>{zoom.toFixed(2)}</b>×
      </div>
      
      <hr className="my-3 border-primary/20" />
      
      <div>
        <h3 className="text-sm font-bold mb-2">Вид коловраток (меняет цвет и режим воды)</h3>
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Выбор окраски и среды</label>
          <Select value={speciesIdx.toString()} onValueChange={(v) => onSpeciesChange(parseInt(v, 10))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {species.map((s, i) => (
                <SelectItem key={i} value={i.toString()}>
                  {s.name} — {s.freshwater ? 'пресноводные' : 'морские'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}
