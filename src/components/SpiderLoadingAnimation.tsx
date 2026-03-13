import { useEffect, useRef, useState, useCallback } from 'react';

interface Spider {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  legPhase: number;
  speed: number;
  carryingLetter: Letter | null;
  idle: number;
  eyeGlow: number;
}

interface Letter {
  id: number;
  char: string;
  x: number;
  y: number;
  originX: number;
  originY: number;
  carried: boolean;
  opacity: number;
  rotation: number;
  color: string;
}

const SPIDER_COUNT = 5;
const LETTERS_TEXT = 'OPTIMIZING PROMPT...';
const COLORS = [
  'hsl(221, 83%, 53%)',   // primary blue
  'hsl(160, 84%, 39%)',   // secondary green
  'hsl(200, 80%, 50%)',   // cyan
  'hsl(280, 70%, 55%)',   // purple
  'hsl(45, 90%, 55%)',    // amber
];

export const SpiderLoadingAnimation = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const spidersRef = useRef<Spider[]>([]);
  const lettersRef = useRef<Letter[]>([]);
  const timeRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const initLetters = useCallback((w: number, h: number) => {
    const letters: Letter[] = [];
    const startX = w * 0.15;
    const y = h * 0.5;
    const spacing = Math.min(28, (w * 0.7) / LETTERS_TEXT.length);
    
    LETTERS_TEXT.split('').forEach((char, i) => {
      const lx = startX + i * spacing;
      letters.push({
        id: i,
        char,
        x: lx,
        y: y + (Math.random() - 0.5) * 20,
        originX: lx,
        originY: y,
        carried: false,
        opacity: 0.9,
        rotation: 0,
        color: COLORS[i % COLORS.length],
      });
    });
    return letters;
  }, []);

  const initSpiders = useCallback((w: number, h: number): Spider[] => {
    return Array.from({ length: SPIDER_COUNT }, (_, i) => ({
      id: i,
      x: Math.random() * w,
      y: Math.random() * h,
      targetX: Math.random() * w,
      targetY: Math.random() * h,
      legPhase: Math.random() * Math.PI * 2,
      speed: 1.2 + Math.random() * 1.5,
      carryingLetter: null,
      idle: 0,
      eyeGlow: 0.5 + Math.random() * 0.5,
    }));
  }, []);

  const drawSpider = useCallback((ctx: CanvasRenderingContext2D, spider: Spider, time: number) => {
    const { x, y, legPhase } = spider;
    const scale = 1;
    
    ctx.save();
    ctx.translate(x, y);

    // Body glow
    const gradient = ctx.createRadialGradient(0, 0, 2, 0, 0, 18 * scale);
    gradient.addColorStop(0, `hsla(221, 83%, 53%, ${0.3 + Math.sin(time * 3 + spider.id) * 0.1})`);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, 18 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Legs (8 legs, 4 per side)
    const legLength = 14 * scale;
    const legWidth = 1.5;
    
    for (let side = -1; side <= 1; side += 2) {
      for (let leg = 0; leg < 4; leg++) {
        const baseAngle = (leg * 0.4 + 0.3) * side;
        const walkOffset = Math.sin(legPhase + leg * 1.2 + time * spider.speed * 4) * 0.3;
        const angle = baseAngle + walkOffset;
        
        const midX = Math.cos(angle) * legLength * 0.6;
        const midY = Math.sin(angle) * legLength * 0.6 + 3;
        const endX = Math.cos(angle + 0.4 * side) * legLength;
        const endY = Math.sin(angle + 0.4 * side) * legLength + 5;
        
        ctx.strokeStyle = `hsla(221, 60%, 45%, 0.8)`;
        ctx.lineWidth = legWidth;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(midX, midY, endX, endY);
        ctx.stroke();
        
        // Leg joint dot
        ctx.fillStyle = 'hsla(221, 83%, 53%, 0.6)';
        ctx.beginPath();
        ctx.arc(midX, midY, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Abdomen
    ctx.fillStyle = 'hsl(240, 5%, 12%)';
    ctx.strokeStyle = 'hsl(221, 60%, 40%)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(-6 * scale, 0, 6 * scale, 5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cephalothorax (head)
    ctx.fillStyle = 'hsl(240, 5%, 15%)';
    ctx.strokeStyle = 'hsl(221, 70%, 50%)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(4 * scale, 0, 5 * scale, 4.5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Circuit pattern on body
    ctx.strokeStyle = `hsla(221, 83%, 53%, ${0.3 + Math.sin(time * 2 + spider.id * 2) * 0.2})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(-2, -2);
    ctx.lineTo(2, -2);
    ctx.lineTo(2, 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(-6, 0);
    ctx.stroke();

    // Eyes (2 pairs, glowing)
    const eyeGlow = spider.eyeGlow + Math.sin(time * 4 + spider.id) * 0.2;
    for (let ey = -1; ey <= 1; ey += 2) {
      // Main eyes
      ctx.fillStyle = `hsla(160, 84%, 50%, ${eyeGlow})`;
      ctx.shadowColor = 'hsl(160, 84%, 50%)';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(7 * scale, ey * 2.5, 1.8, 0, Math.PI * 2);
      ctx.fill();
      
      // Secondary smaller eyes
      ctx.fillStyle = `hsla(45, 90%, 55%, ${eyeGlow * 0.6})`;
      ctx.shadowColor = 'hsl(45, 90%, 55%)';
      ctx.shadowBlur = 2;
      ctx.beginPath();
      ctx.arc(8 * scale, ey * 1, 1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Carrying letter indicator — thread from mouth
    if (spider.carryingLetter) {
      ctx.strokeStyle = 'hsla(221, 83%, 53%, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(9, 0);
      ctx.lineTo(spider.carryingLetter.x - x, spider.carryingLetter.y - y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, []);

  const drawLetter = useCallback((ctx: CanvasRenderingContext2D, letter: Letter, time: number) => {
    ctx.save();
    ctx.translate(letter.x, letter.y);
    ctx.rotate(letter.rotation);
    
    ctx.font = `bold 20px 'Space Grotesk', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Glow effect for carried letters
    if (letter.carried) {
      ctx.shadowColor = letter.color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = letter.color;
    } else {
      ctx.shadowBlur = 0;
      ctx.fillStyle = `hsla(0, 0%, 95%, ${letter.opacity})`;
    }
    
    ctx.fillText(letter.char, 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();
  }, []);

  // Silk thread trail
  const drawThread = useCallback((ctx: CanvasRenderingContext2D, spider: Spider) => {
    ctx.strokeStyle = 'hsla(221, 83%, 53%, 0.08)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(spider.x, spider.y);
    ctx.lineTo(spider.targetX, spider.targetY);
    ctx.stroke();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      
      lettersRef.current = initLetters(rect.width, rect.height);
      spidersRef.current = initSpiders(rect.width, rect.height);
    };

    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      
      timeRef.current += 0.016;
      const time = timeRef.current;

      ctx.clearRect(0, 0, w, h);

      const spiders = spidersRef.current;
      const letters = lettersRef.current;

      // Update spiders
      spiders.forEach((spider) => {
        const dx = spider.targetX - spider.x;
        const dy = spider.targetY - spider.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 5) {
          spider.idle += 0.016;
          
          if (spider.idle > 0.5) {
            // If carrying a letter, drop it at random position
            if (spider.carryingLetter) {
              spider.carryingLetter.carried = false;
              spider.carryingLetter.rotation = (Math.random() - 0.5) * 0.5;
              spider.carryingLetter = null;
            }
            
            // Pick new target
            // 60% chance to go to a letter
            if (Math.random() < 0.6 && !spider.carryingLetter) {
              const freeLetter = letters.filter(l => !l.carried)[Math.floor(Math.random() * letters.filter(l => !l.carried).length)];
              if (freeLetter) {
                spider.targetX = freeLetter.x;
                spider.targetY = freeLetter.y;
              } else {
                spider.targetX = Math.random() * w;
                spider.targetY = Math.random() * h;
              }
            } else {
              spider.targetX = 30 + Math.random() * (w - 60);
              spider.targetY = 30 + Math.random() * (h - 60);
            }
            spider.idle = 0;
          }
        } else {
          spider.x += (dx / dist) * spider.speed;
          spider.y += (dy / dist) * spider.speed;
          spider.legPhase += 0.1;
        }

        // Check if near a free letter — pick it up
        if (!spider.carryingLetter) {
          letters.forEach((letter) => {
            if (!letter.carried) {
              const ld = Math.sqrt((spider.x - letter.x) ** 2 + (spider.y - letter.y) ** 2);
              if (ld < 15) {
                spider.carryingLetter = letter;
                letter.carried = true;
                // Set new target to carry letter somewhere
                spider.targetX = 30 + Math.random() * (w - 60);
                spider.targetY = 30 + Math.random() * (h - 60);
                spider.idle = 0;
              }
            }
          });
        }

        // Move carried letter
        if (spider.carryingLetter) {
          spider.carryingLetter.x += (spider.x + 12 - spider.carryingLetter.x) * 0.15;
          spider.carryingLetter.y += (spider.y + 10 - spider.carryingLetter.y) * 0.15;
          spider.carryingLetter.rotation = Math.sin(time * 3 + spider.id) * 0.2;
        }
      });

      // Letters slowly drift back to origin when not carried
      letters.forEach((letter) => {
        if (!letter.carried) {
          letter.x += (letter.originX - letter.x) * 0.003;
          letter.y += (letter.originY - letter.y) * 0.003;
          letter.rotation *= 0.98;
        }
      });

      // Draw threads
      spiders.forEach(s => drawThread(ctx, s));
      
      // Draw letters
      letters.forEach(l => drawLetter(ctx, l, time));
      
      // Draw spiders on top
      spiders.forEach(s => drawSpider(ctx, s, time));

      // Status text
      ctx.fillStyle = 'hsla(0, 0%, 95%, 0.4)';
      ctx.font = `12px 'Space Grotesk', sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('robo-spiders are rearranging your prompt...', w / 2, h - 16);

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [initLetters, initSpiders, drawSpider, drawLetter, drawThread]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-48 sm:h-56 rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden relative"
    >
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};
