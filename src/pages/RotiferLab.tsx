import { useRef, useEffect, useState, useCallback } from 'react';
import { Tank, Species, SimulationConfig, RandomizerConfig, Injection } from '@/types/rotifer';
import { HUDPanel } from '@/components/HUDPanel';
import { ControlPanel } from '@/components/ControlPanel';
import { useCamera } from '@/hooks/useCamera';
import { useWaterSurface } from '@/hooks/useWaterSurface';
import { useRotifers } from '@/hooks/useRotifers';
import { clamp } from '@/utils/motilityModel';
import { toast } from 'sonner';

const BASE_PX = 10;
const TANK_W = 100, TANK_H = 100, TANK_D = 10, GAP = 20, HEADSPACE_CM = 1.6;
const SAL_LIM_MIN = 0, SAL_LIM_MAX = 60, SAL_WATER_SCALE = 35;
const PROJ = { angle: Math.PI / 4, scale: 0.5 };

const SPECIES: Species[] = [
  { name: 'Brachionus plicatilis', color: [0, 0, 0], freshwater: false },
  { name: 'Keratella cochlearis', color: [220, 32, 32], freshwater: true },
  { name: 'Asplanchna priodonta', color: [20, 150, 60], freshwater: true },
];

const initialTanks: Tank[] = [
  { id: 1, x: 0, y: 0, w: TANK_W, h: TANK_H, d: TANK_D, water: HEADSPACE_CM, salTarget: 10, salSensor: 10, tmpTarget: 22.5, tmpSensor: 22.5 },
  { id: 2, x: TANK_W + GAP, y: 0, w: TANK_W, h: TANK_H, d: TANK_D, water: HEADSPACE_CM, salTarget: 10, salSensor: 10, tmpTarget: 22.5, tmpSensor: 22.5 },
  { id: 3, x: 0, y: TANK_H + GAP, w: TANK_W, h: TANK_H, d: TANK_D, water: HEADSPACE_CM, salTarget: 10, salSensor: 10, tmpTarget: 22.5, tmpSensor: 22.5 },
  { id: 4, x: TANK_W + GAP, y: TANK_H + GAP, w: TANK_W, h: TANK_H, d: TANK_D, water: HEADSPACE_CM, salTarget: 10, salSensor: 10, tmpTarget: 22.5, tmpSensor: 22.5 },
];

const worldBounds = {
  minX: 0,
  minY: 0,
  maxX: TANK_W * 2 + GAP,
  maxY: TANK_H * 2 + GAP,
  w: TANK_W * 2 + GAP,
  h: TANK_H * 2 + GAP,
};

export default function RotiferLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tanks, setTanks] = useState<Tank[]>(initialTanks);
  const [config, setConfig] = useState<SimulationConfig>({
    density: 120,
    dofMM: 1.0,
    threshold: 10,
    microscopeHUD: true,
    speciesIdx: 0,
  });
  const [randConfig, setRandConfig] = useState<RandomizerConfig>({
    enabled: true,
    every: 30,
    dS: 1.5,
    dT: 0.8,
  });
  const [injections, setInjections] = useState<Injection[]>([]);
  const [fps, setFps] = useState(0);
  const [hidden, setHidden] = useState(false);

  const DPR = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
  
  const { camera, worldToScreen, screenToWorld, zoomAt, fitAll, focusTank, panRef, mouseRef } = useCamera(worldBounds, canvasRef);
  const { surfaces, stepSurfaces, disturbSurface } = useWaterSurface(tanks);
  
  const isFresh = SPECIES[config.speciesIdx].freshwater;
  
  const project = useCallback((wx: number, wy: number, wz: number) => {
    const p = worldToScreen(wx, wy);
    const dx = wz * PROJ.scale * Math.cos(PROJ.angle) * camera.zoom * BASE_PX;
    const dy = -wz * PROJ.scale * Math.sin(PROJ.angle) * camera.zoom * BASE_PX;
    return { x: p.x + dx, y: p.y + dy };
  }, [worldToScreen, camera.zoom]);

  const { pools, stepRotifers, clearRotifers, microscopeActive } = useRotifers(
    tanks,
    surfaces,
    camera,
    config.threshold,
    config.density,
    config.dofMM,
    isFresh,
    BASE_PX
  );

  // Resize handler
  useEffect(() => {
    const resize = () => {
      if (!canvasRef.current) return;
      const w = Math.floor(window.innerWidth);
      const h = Math.floor(window.innerHeight);
      canvasRef.current.width = Math.floor(w * DPR);
      canvasRef.current.height = Math.floor(h * DPR);
      canvasRef.current.style.width = w + 'px';
      canvasRef.current.style.height = h + 'px';
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [DPR]);

  // Mouse handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      if (panRef.current.active) {
        camera.x -= e.movementX / (camera.zoom * BASE_PX);
        camera.y -= e.movementY / (camera.zoom * BASE_PX);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2) {
        panRef.current.active = true;
      } else if (e.button === 0) {
        const wpt = screenToWorld(e.clientX, e.clientY);
        const tank = tanks.find(t => wpt.x >= t.x && wpt.x <= t.x + t.w && wpt.y >= t.y && wpt.y <= t.y + t.h);
        if (tank) {
          const srf = surfaces.get(tank.id);
          if (srf) {
            const relX = wpt.x - tank.x;
            const i = Math.max(0, Math.min(srf.n - 1, Math.floor((relX / tank.w) * (srf.n - 1))));
            disturbSurface(tank.id, i, -2.5);
          }
        }
      }
    };

    const handleMouseUp = () => {
      panRef.current.active = false;
    };

    const handleWheel = (e: WheelEvent) => {
      const f = Math.pow(0.95, e.deltaY * 0.1);
      zoomAt(f, e.clientX, e.clientY);
    };

    canvas.addEventListener('contextmenu', handleContextMenu);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel);

    return () => {
      canvas.removeEventListener('contextmenu', handleContextMenu);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [camera, screenToWorld, zoomAt, tanks, surfaces, disturbSurface, panRef, mouseRef]);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        fitAll();
        clearRotifers();
      }
      if (e.key === 'h' || e.key === 'H') {
        setHidden(prev => !prev);
      }
      if (e.key === 'm' || e.key === 'M') {
        setConfig(prev => ({ ...prev, microscopeHUD: !prev.microscopeHUD }));
      }
      if (['1', '2', '3', '4'].includes(e.key)) {
        const tid = parseInt(e.key, 10);
        const tank = tanks.find(t => t.id === tid);
        if (tank) {
          focusTank(tank.x, tank.y, tank.w, tank.h);
          clearRotifers();
        }
      }
      if (e.key === 'p' || e.key === 'P') {
        exportPNG();
      }
      if (e.key === 's' || e.key === 'S') {
        shareState();
      }
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fitAll, clearRotifers, focusTank, tanks]);

  // Sensor updates
  useEffect(() => {
    const tauSal = 1.6, tauTmp = 1.8;
    const interval = setInterval(() => {
      setTanks(prev => prev.map(t => {
        const dt = 0.016;
        const errS = t.salTarget - t.salSensor;
        let newSalSensor = t.salSensor;
        if (!isFresh) {
          newSalSensor += errS * dt / tauSal + (Math.random() - 0.5) * 0.10 * dt;
          newSalSensor = clamp(newSalSensor, SAL_LIM_MIN, SAL_LIM_MAX);
        } else {
          newSalSensor = 0;
        }
        const errT = t.tmpTarget - t.tmpSensor;
        let newTmpSensor = t.tmpSensor + errT * dt / tauTmp + (Math.random() - 0.5) * 0.06 * dt;
        newTmpSensor = clamp(newTmpSensor, 0, 40);
        return { ...t, salSensor: newSalSensor, tmpSensor: newTmpSensor };
      }));
    }, 16);
    return () => clearInterval(interval);
  }, [isFresh]);

  // Auto-randomizer
  useEffect(() => {
    if (!randConfig.enabled) return;
    const interval = setInterval(() => {
      doRandomize();
    }, randConfig.every * 1000);
    return () => clearInterval(interval);
  }, [randConfig]);

  const doRandomize = useCallback(() => {
    setTanks(prev => prev.map(t => {
      const dT = (Math.random() * 2 - 1) * randConfig.dT;
      let newSalTarget = t.salTarget;
      if (!isFresh) {
        const dS = (Math.random() * 2 - 1) * randConfig.dS;
        newSalTarget = clamp(+(t.salTarget + dS).toFixed(1), SAL_LIM_MIN, SAL_LIM_MAX);
        if (Math.abs(dS) > 0.25) {
          triggerInjection(t);
        }
      }
      const newTmpTarget = clamp(+(t.tmpTarget + dT).toFixed(1), 0, 40);
      return { ...t, salTarget: newSalTarget, tmpTarget: newTmpTarget };
    }));
  }, [randConfig, isFresh]);

  const triggerInjection = useCallback((t: Tank) => {
    if (isFresh) return;
    const x = t.x + t.w * 0.82;
    const yStart = t.y - 6;
    setInjections(prev => [...prev, { tankId: t.id, t0: performance.now(), x, yStart }]);
    const srf = surfaces.get(t.id);
    if (srf) {
      const idx = Math.max(0, Math.min(srf.n - 1, Math.floor(((x - t.x) / t.w) * (srf.n - 1))));
      for (let k = -3; k <= 3; k++) srf.disturb(idx + k, -3 + Math.random() * 1.2);
    }
    toast(`Инъекция соли в бак ${t.id}`);
  }, [isFresh, surfaces]);

  // Animation loop
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let last = performance.now();
    let frames = 0;
    let tFPS = 0;
    let rafId: number;

    const frame = (ts: number) => {
      const dt = Math.min(0.033, (ts - last) / 1000);
      last = ts;

      stepSurfaces(dt);
      stepRotifers(dt, canvas.width, canvas.height, DPR, project);

      // Draw
      drawLabBackdrop(ctx, canvas.width / DPR, canvas.height / DPR);
      for (const tank of tanks) {
        drawTank3D(ctx, tank);
      }
      drawInjections(ctx);
      renderRotifers(ctx, canvas.width, canvas.height);

      // FPS
      frames++;
      tFPS += dt;
      if (tFPS >= 0.5) {
        setFps(Math.round(frames / tFPS));
        frames = 0;
        tFPS = 0;
      }

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [tanks, stepSurfaces, stepRotifers, project, DPR]);

  // Drawing functions
  const drawLabBackdrop = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0e1636');
    g.addColorStop(0.4, '#0a1330');
    g.addColorStop(1, '#081026');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = '#5ea1ff';
    for (let x = 0; x < w; x += 40) ctx.fillRect(x, 0, 1, h);
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(w * 0.1, h * 0.12, w * 0.8, 6);
    const benchY = h * 0.82;
    ctx.fillStyle = 'rgba(12,22,54,0.95)';
    ctx.fillRect(0, benchY, w, h - benchY);
  };

  const waterColorsFor = (t: Tank) => {
    if (isFresh) {
      const rgba = (r: number, g: number, b: number, a: number) => `rgba(${r},${g},${b},${a.toFixed(3)})`;
      const col = [22, 54, 110];
      return { front: rgba(col[0], col[1], col[2], 0.45), front2: rgba(col[0], col[1], col[2], 0.32), top: rgba(col[0], col[1], col[2], 0.22) };
    } else {
      const s = Math.min(1, Math.max(0, t.salSensor / SAL_WATER_SCALE));
      const a1 = 0.24 + 0.2 * s, a2 = 0.12 + 0.18 * s, topA = 0.12 + 0.12 * s;
      const heat = Math.max(0, Math.min(1, (t.tmpSensor - 25) / 10));
      const mix = (a: number[], b: number[], k: number) => [
        Math.round(a[0] * (1 - k) + b[0] * k),
        Math.round(a[1] * (1 - k) + b[1] * k),
        Math.round(a[2] * (1 - k) + b[2] * k),
      ];
      const col = mix([47, 128, 255], [255, 64, 48], heat);
      const rgba = (r: number, g: number, b: number, a: number) => `rgba(${r},${g},${b},${a.toFixed(3)})`;
      return { front: rgba(col[0], col[1], col[2], a1), front2: rgba(col[0], col[1], col[2], a2), top: rgba(col[0], col[1], col[2], topA) };
    }
  };

  const drawTank3D = (ctx: CanvasRenderingContext2D, t: Tank) => {
    const srf = surfaces.get(t.id);
    if (!srf) return;
    const cols = waterColorsFor(t);
    const surfFront: { x: number; y: number }[] = [];
    for (let i = 0; i < srf.n; i++) {
      const xcm = t.x + (i / (srf.n - 1)) * t.w;
      const ycm = t.y + Math.max(0.5, Math.min(t.h - 1, srf.base + srf.y[i]));
      surfFront.push({ x: xcm, y: ycm });
    }

    // Top plane
    ctx.beginPath();
    for (let i = 0; i < surfFront.length; i++) {
      const p = worldToScreen(surfFront[i].x, surfFront[i].y);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    for (let i = surfFront.length - 1; i >= 0; i--) {
      const q = project(surfFront[i].x, surfFront[i].y, t.d);
      ctx.lineTo(q.x, q.y);
    }
    ctx.closePath();
    ctx.fillStyle = cols.top;
    ctx.fill();

    // Front face
    ctx.beginPath();
    for (let i = 0; i < surfFront.length; i++) {
      const p = worldToScreen(surfFront[i].x, surfFront[i].y);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    const bottomRight = worldToScreen(t.x + t.w, t.y + t.h - 0.5);
    const bottomLeft = worldToScreen(t.x, t.y + t.h - 0.5);
    ctx.lineTo(bottomRight.x, bottomRight.y);
    ctx.lineTo(bottomLeft.x, bottomLeft.y);
    ctx.closePath();
    ctx.fillStyle = cols.front;
    ctx.fill();

    // Frame
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1.5;
    const tl = worldToScreen(t.x, t.y);
    const tr = worldToScreen(t.x + t.w, t.y);
    const br = worldToScreen(t.x + t.w, t.y + t.h);
    const bl = worldToScreen(t.x, t.y + t.h);
    ctx.beginPath();
    ctx.moveTo(tl.x, tl.y);
    ctx.lineTo(tr.x, tr.y);
    ctx.lineTo(br.x, br.y);
    ctx.lineTo(bl.x, bl.y);
    ctx.closePath();
    ctx.stroke();
  };

  const drawInjections = (ctx: CanvasRenderingContext2D) => {
    const now = performance.now();
    setInjections(prev => prev.filter(ev => {
      const age = now - ev.t0;
      if (age > 2000) return false;

      const tnk = tanks.find(t => t.id === ev.tankId);
      const srf = surfaces.get(ev.tankId);
      if (!tnk || !srf) return false;

      const dropTime = 600, plumeTime = 1400;
      const surfIdx = Math.max(0, Math.min(srf.n - 1, Math.round(((ev.x - tnk.x) / tnk.w) * (srf.n - 1))));
      const surfYcm = tnk.y + Math.max(0.5, Math.min(tnk.h - 1, srf.base + srf.y[surfIdx]));

      if (age < dropTime) {
        const p = age / dropTime;
        const y = ev.yStart + (surfYcm - ev.yStart) * p * p;
        const s = worldToScreen(ev.x, y);
        ctx.fillStyle = 'rgba(0,120,255,0.85)';
        ctx.beginPath();
        ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      if (age >= dropTime) {
        const p = Math.min(1, (age - dropTime) / plumeTime);
        const px = worldToScreen(ev.x, surfYcm).x;
        const py = worldToScreen(ev.x, surfYcm).y;
        const h = worldToScreen(ev.x, tnk.y + tnk.h - 1).y - py;
        const w = 6 + 40 * p;
        const alpha = 0.18 * (1 - p);
        const g = ctx.createLinearGradient(px, py, px, py + h * 0.5);
        g.addColorStop(0, `rgba(0,120,255,${alpha})`);
        g.addColorStop(1, `rgba(0,120,255,0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(px - w / 2, py);
        ctx.lineTo(px + w / 2, py);
        ctx.lineTo(px + w * 0.35, py + h * 0.5);
        ctx.lineTo(px - w * 0.35, py + h * 0.5);
        ctx.closePath();
        ctx.fill();
      }

      return true;
    }));
  };

  const renderRotifers = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    if (!microscopeActive()) return;
    const cx = camera.scrCx;
    const cy = camera.scrCy;
    const rCss = (Math.min(canvasWidth, canvasHeight) * 0.28) / DPR;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, rCss, 0, Math.PI * 2);
    ctx.clip();

    for (const t of tanks) {
      const arr = pools.get(t.id);
      if (!arr) continue;
      for (const r of arr) {
        const s = project(r.x, r.y, r.z || 0);
        const depthK = 1 - (r.z || 0) / t.d;
        const size = Math.max(2, Math.min(10, Math.round(1.6 + camera.zoom * 0.28)));
        const sc = SPECIES[config.speciesIdx].color;
        const alpha = 0.38 + 0.42 * depthK;
        ctx.fillStyle = `rgba(${sc[0]},${sc[1]},${sc[2]},${alpha.toFixed(3)})`;
        ctx.fillRect(Math.round(s.x - size / 2), Math.round(s.y - size / 2), size, size);
      }
    }

    ctx.restore();

    if (config.microscopeHUD) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1.5;
      const rDev = Math.min(canvasWidth, canvasHeight) * 0.28;
      ctx.beginPath();
      ctx.arc(canvasWidth * 0.5, canvasHeight * 0.5, rDev, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  };

  // Control handlers
  const handleConfigChange = (partial: Partial<SimulationConfig>) => {
    setConfig(prev => ({ ...prev, ...partial }));
  };

  const handleRandConfigChange = (partial: Partial<RandomizerConfig>) => {
    setRandConfig(prev => ({ ...prev, ...partial }));
  };

  const handleAdjustSalinity = (idx: number, delta: number) => {
    if (isFresh) return;
    setTanks(prev => {
      const newTanks = [...prev];
      const t = newTanks[idx];
      t.salTarget = clamp(+(t.salTarget + delta).toFixed(1), SAL_LIM_MIN, SAL_LIM_MAX);
      triggerInjection(t);
      return newTanks;
    });
  };

  const handleAdjustTemperature = (idx: number, delta: number) => {
    setTanks(prev => {
      const newTanks = [...prev];
      const t = newTanks[idx];
      t.tmpTarget = clamp(+(t.tmpTarget + delta).toFixed(1), 0, 40);
      return newTanks;
    });
  };

  const exportPNG = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rotifer-lab-snapshot.png';
    a.click();
    toast('PNG снимок сохранён!');
  };

  const shareState = () => {
    const state = { tanks, config, randConfig, camera };
    const encoded = btoa(JSON.stringify(state));
    const url = `${window.location.origin}${window.location.pathname}#${encoded}`;
    navigator.clipboard.writeText(url);
    toast('Ссылка скопирована в буфер обмена!');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      toast('Полноэкранный режим');
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <canvas ref={canvasRef} className="block w-full h-full cursor-crosshair" />
      
      {!hidden && (
        <>
          <HUDPanel
            species={SPECIES}
            speciesIdx={config.speciesIdx}
            onSpeciesChange={(idx) => handleConfigChange({ speciesIdx: idx })}
            density={config.density}
            dofMM={config.dofMM}
            threshold={config.threshold}
            zoom={camera.zoom}
          />
          
          <ControlPanel
            tanks={tanks}
            config={config}
            randConfig={randConfig}
            onConfigChange={handleConfigChange}
            onRandConfigChange={handleRandConfigChange}
            onAdjustSalinity={handleAdjustSalinity}
            onAdjustTemperature={handleAdjustTemperature}
            onRandomize={doRandomize}
            onExportPNG={exportPNG}
            onShareState={shareState}
            onToggleFullscreen={toggleFullscreen}
            isFresh={isFresh}
          />
        </>
      )}

      <div className="fixed right-3 bottom-3 text-xs font-mono bg-background/80 backdrop-blur-sm border border-primary/20 px-3 py-1.5 rounded">
        fps: {fps}
      </div>

      <div className="fixed left-1/2 bottom-4 -translate-x-1/2 text-xs bg-background/80 backdrop-blur-sm border border-primary/20 px-4 py-2 rounded max-w-4xl">
        React-модульная версия загружена. <b>Изолированные компоненты</b> • <b>Безопасное редактирование через ИИ</b>
      </div>

      {config.microscopeHUD && <div className={`scanlines ${microscopeActive() ? 'on' : ''}`} />}
    </div>
  );
}
