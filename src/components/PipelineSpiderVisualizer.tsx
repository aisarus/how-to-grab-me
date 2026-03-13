import { useEffect, useRef, useCallback, useState } from 'react';

// Pipeline stages
const STAGES = [
  { id: 'parser', label: 'Parser', status: 'Parsing prompt…' },
  { id: 'proposer', label: 'Proposer', status: 'Generating structured proposal…' },
  { id: 'critic', label: 'Critic', status: 'Critic evaluating prompt quality…' },
  { id: 'verifier', label: 'Verifier', status: 'Verifier checking consistency…' },
  { id: 'arbiter', label: 'Arbiter', status: 'Arbiter determining convergence…' },
];

const STAGE_DURATION = 5500; // ms per stage
const ITERATION_DURATION = STAGE_DURATION * STAGES.length;

interface NodePos {
  x: number;
  y: number;
  label: string;
}

interface Spider {
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  targetX: number;
  targetY: number;
  legPhase: number;
  active: boolean;
  arrived: boolean;
  trail: { x: number; y: number; alpha: number }[];
}

interface PipelineSpiderVisualizerProps {
  maxIterations?: number;
}

export const PipelineSpiderVisualizer = ({ maxIterations = 3 }: PipelineSpiderVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef(Date.now());
  const [statusText, setStatusText] = useState(STAGES[0].status);
  const [currentIteration, setCurrentIteration] = useState(1);
  const [activeStageIdx, setActiveStageIdx] = useState(0);

  const getNodePositions = useCallback((w: number, h: number): NodePos[] => {
    const centerY = h * 0.45;
    const padding = w * 0.1;
    const usableW = w - padding * 2;
    const gap = usableW / (STAGES.length - 1);
    return STAGES.map((s, i) => ({
      x: padding + i * gap,
      y: centerY + Math.sin(i * 0.8) * 18,
      label: s.label,
    }));
  }, []);

  const drawRoboSpider = useCallback((
    ctx: CanvasRenderingContext2D, 
    spider: Spider, 
    time: number, 
    idx: number
  ) => {
    const { x, y, legPhase, active } = spider;
    const scale = active ? 1.1 : 0.85;
    const glowAlpha = active ? 0.5 + Math.sin(time * 4 + idx) * 0.2 : 0.15;

    ctx.save();
    ctx.translate(x, y);

    // Glow
    if (active) {
      const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, 22 * scale);
      grad.addColorStop(0, `hsla(221, 83%, 53%, ${glowAlpha})`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, 22 * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    // Legs
    const legLen = 12 * scale;
    for (let side = -1; side <= 1; side += 2) {
      for (let leg = 0; leg < 4; leg++) {
        const baseAngle = (leg * 0.45 + 0.25) * side;
        const walkAmt = active ? Math.sin(legPhase + leg * 1.3 + time * 6) * 0.35 : Math.sin(time * 0.5 + leg) * 0.05;
        const angle = baseAngle + walkAmt;
        const midX = Math.cos(angle) * legLen * 0.55;
        const midY = Math.sin(angle) * legLen * 0.55 + 2;
        const endX = Math.cos(angle + 0.45 * side) * legLen;
        const endY = Math.sin(angle + 0.45 * side) * legLen + 4;

        ctx.strokeStyle = active 
          ? `hsla(221, 70%, 55%, 0.9)` 
          : `hsla(221, 40%, 40%, 0.5)`;
        ctx.lineWidth = 1.2 * scale;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(midX, midY, endX, endY);
        ctx.stroke();

        // Joint
        ctx.fillStyle = `hsla(221, 83%, 53%, ${active ? 0.7 : 0.3})`;
        ctx.beginPath();
        ctx.arc(midX, midY, 1.2 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Abdomen
    ctx.fillStyle = active ? 'hsl(240, 8%, 14%)' : 'hsl(240, 5%, 11%)';
    ctx.strokeStyle = active ? 'hsl(221, 70%, 50%)' : 'hsl(221, 30%, 30%)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(-5 * scale, 0, 5.5 * scale, 4.5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Head
    ctx.fillStyle = active ? 'hsl(240, 8%, 17%)' : 'hsl(240, 5%, 13%)';
    ctx.strokeStyle = active ? 'hsl(260, 60%, 55%)' : 'hsl(260, 20%, 30%)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(3.5 * scale, 0, 4.5 * scale, 4 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Circuit lines
    if (active) {
      ctx.strokeStyle = `hsla(260, 70%, 60%, ${0.3 + Math.sin(time * 3 + idx * 2) * 0.2})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(-2, -1.5);
      ctx.lineTo(1, -1.5);
      ctx.lineTo(1, 1.5);
      ctx.stroke();
    }

    // Eyes
    const eyeBright = active ? 0.9 : 0.3;
    for (let ey = -1; ey <= 1; ey += 2) {
      ctx.fillStyle = `hsla(280, 80%, 65%, ${eyeBright})`;
      ctx.shadowColor = 'hsl(280, 80%, 65%)';
      ctx.shadowBlur = active ? 6 : 0;
      ctx.beginPath();
      ctx.arc(6.5 * scale, ey * 2, 1.6 * scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `hsla(200, 90%, 60%, ${eyeBright * 0.5})`;
      ctx.shadowColor = 'hsl(200, 90%, 60%)';
      ctx.shadowBlur = active ? 3 : 0;
      ctx.beginPath();
      ctx.arc(7.5 * scale, ey * 0.8, 0.9 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    ctx.restore();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let nodes: NodePos[] = [];
    let spiders: Spider[] = [];
    let dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      nodes = getNodePositions(rect.width, rect.height);
      // Initialize spiders at their home nodes
      spiders = nodes.map((n, i) => ({
        x: n.x,
        y: n.y - 35,
        homeX: n.x,
        homeY: n.y - 35,
        targetX: n.x,
        targetY: n.y - 35,
        legPhase: Math.random() * Math.PI * 2,
        active: false,
        arrived: true,
        trail: [],
      }));
    };

    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const elapsed = Date.now() - startTimeRef.current;
      const time = elapsed / 1000;

      // Determine current stage and iteration
      const totalStageTime = elapsed % ITERATION_DURATION;
      const stageIdx = Math.min(Math.floor(totalStageTime / STAGE_DURATION), STAGES.length - 1);
      const iteration = Math.min(Math.floor(elapsed / ITERATION_DURATION) + 1, maxIterations);

      // Update React state (only when changed)
      if (stageIdx !== activeStageIdx) setActiveStageIdx(stageIdx);
      setStatusText(STAGES[stageIdx].status);
      setCurrentIteration(iteration);

      ctx.clearRect(0, 0, w, h);

      if (nodes.length === 0) {
        animRef.current = requestAnimationFrame(animate);
        return;
      }

      // Draw web strands between nodes
      for (let i = 0; i < nodes.length - 1; i++) {
        const from = nodes[i];
        const to = nodes[i + 1];
        const isActive = i === stageIdx || i === stageIdx - 1;
        const pulseAlpha = isActive 
          ? 0.4 + Math.sin(time * 3 + i) * 0.15 
          : 0.12;

        // Main strand
        ctx.strokeStyle = isActive 
          ? `hsla(260, 70%, 60%, ${pulseAlpha})` 
          : `hsla(221, 40%, 40%, ${pulseAlpha})`;
        ctx.lineWidth = isActive ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        // Curved strand
        const cpx = (from.x + to.x) / 2;
        const cpy = Math.min(from.y, to.y) - 20;
        ctx.quadraticCurveTo(cpx, cpy, to.x, to.y);
        ctx.stroke();

        // Secondary web threads
        ctx.strokeStyle = `hsla(221, 40%, 45%, ${pulseAlpha * 0.4})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.quadraticCurveTo(cpx, cpy + 30, to.x, to.y);
        ctx.stroke();
      }

      // Cross strands for web effect
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 2; j < nodes.length && j <= i + 3; j++) {
          if (j >= nodes.length) break;
          const a = nodes[i];
          const b = nodes[j];
          ctx.strokeStyle = `hsla(221, 30%, 40%, 0.06)`;
          ctx.lineWidth = 0.5;
          ctx.setLineDash([4, 8]);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Draw nodes
      nodes.forEach((node, i) => {
        const isActive = i === stageIdx;
        const isPast = i < stageIdx;
        const nodeRadius = isActive ? 18 : 14;

        // Node glow
        if (isActive) {
          const glow = ctx.createRadialGradient(node.x, node.y, 4, node.x, node.y, 36);
          glow.addColorStop(0, `hsla(260, 80%, 60%, ${0.3 + Math.sin(time * 2.5) * 0.1})`);
          glow.addColorStop(1, 'transparent');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 36, 0, Math.PI * 2);
          ctx.fill();
        }

        // Node circle
        ctx.fillStyle = isActive 
          ? 'hsl(260, 30%, 18%)' 
          : isPast 
            ? 'hsl(160, 30%, 14%)' 
            : 'hsl(240, 5%, 10%)';
        ctx.strokeStyle = isActive 
          ? 'hsl(260, 70%, 55%)' 
          : isPast 
            ? 'hsl(160, 60%, 40%)' 
            : 'hsl(221, 30%, 25%)';
        ctx.lineWidth = isActive ? 2 : 1.5;
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Inner indicator
        if (isPast) {
          // Checkmark
          ctx.strokeStyle = 'hsl(160, 84%, 45%)';
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(node.x - 5, node.y);
          ctx.lineTo(node.x - 1, node.y + 4);
          ctx.lineTo(node.x + 6, node.y - 4);
          ctx.stroke();
        } else if (isActive) {
          // Pulsing dot
          const dotR = 3 + Math.sin(time * 4) * 1.5;
          ctx.fillStyle = `hsla(260, 80%, 65%, ${0.8 + Math.sin(time * 3) * 0.2})`;
          ctx.shadowColor = 'hsl(260, 80%, 65%)';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(node.x, node.y, dotR, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          // Dim dot
          ctx.fillStyle = 'hsla(221, 30%, 40%, 0.4)';
          ctx.beginPath();
          ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Label
        ctx.font = `${isActive ? '600 12px' : '500 11px'} 'Space Grotesk', sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = isActive 
          ? 'hsla(260, 80%, 80%, 0.95)' 
          : isPast 
            ? 'hsla(160, 60%, 70%, 0.8)' 
            : 'hsla(0, 0%, 70%, 0.5)';
        ctx.fillText(node.label, node.x, node.y + nodeRadius + 16);
      });

      // Update spiders
      spiders.forEach((spider, i) => {
        const isActive = i === stageIdx;
        spider.active = isActive;

        if (isActive && spider.arrived) {
          // Move spider to node
          spider.targetX = nodes[i].x;
          spider.targetY = nodes[i].y - 30;
          spider.arrived = false;
        }

        // Move toward target
        const dx = spider.targetX - spider.x;
        const dy = spider.targetY - spider.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = isActive ? 2.5 : 0.3;

        if (dist > 1) {
          spider.x += (dx / dist) * Math.min(speed, dist);
          spider.y += (dy / dist) * Math.min(speed, dist);
          spider.legPhase += 0.15;

          // Trail
          if (isActive) {
            spider.trail.push({ x: spider.x, y: spider.y, alpha: 0.6 });
          }
        }

        // Idle wobble for inactive
        if (!isActive) {
          spider.x = spider.homeX + Math.sin(time * 0.7 + i * 2) * 3;
          spider.y = spider.homeY + Math.cos(time * 0.5 + i * 1.5) * 2;
        }

        // Fade trail
        spider.trail = spider.trail.filter(t => {
          t.alpha -= 0.015;
          return t.alpha > 0;
        });

        // Draw trail
        spider.trail.forEach(t => {
          ctx.fillStyle = `hsla(260, 70%, 60%, ${t.alpha * 0.3})`;
          ctx.beginPath();
          ctx.arc(t.x, t.y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        });

        // Draw spider
        drawRoboSpider(ctx, spider, time, i);
      });

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [getNodePositions, drawRoboSpider, maxIterations]);

  return (
    <div className="w-full space-y-3">
      <div 
        ref={containerRef}
        className="w-full h-52 sm:h-64 rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden relative"
      >
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-card/80 border border-border">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
          </span>
          <span className="text-sm text-foreground/80 font-medium">
            {statusText}
          </span>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          Iteration {currentIteration} / {maxIterations}
        </span>
      </div>
    </div>
  );
};
