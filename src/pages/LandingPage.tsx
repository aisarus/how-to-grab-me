import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  ArrowRight, Zap, ChevronDown, CheckCircle2, TrendingDown,
  Activity, BarChart3, Lock, Cpu, Layers, Sparkles,
  SplitSquareHorizontal, GitMerge, Target, Key,
} from "lucide-react";

/* ─── Particle field ───────────────────────────────────────────────────────── */

const PARTICLES = Array.from({ length: 50 }, (_, i) => ({
  id: i,
  x: (i * 97.3) % 100,
  size: 1.5 + (i % 3),
  duration: 9 + (i % 10),
  delay: (i * 0.24) % 6,
  color: i % 4 === 0 ? "#3b82f6" : i % 4 === 1 ? "#10b981" : i % 4 === 2 ? "#a855f7" : "#f59e0b",
  opacity: 0.1 + (i % 6) * 0.04,
}));

function ParticleField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {PARTICLES.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 4}px ${p.color}`,
          }}
          initial={{ y: "110vh", opacity: 0 }}
          animate={{ y: "-10vh", opacity: [0, p.opacity, p.opacity, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
}

/* ─── AnimatedCounter ──────────────────────────────────────────────────────── */

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 60, damping: 18 });
  const [display, setDisplay] = useState(0);

  useEffect(() => { if (inView) mv.set(target); }, [inView, mv, target]);
  useEffect(() => spring.on("change", v => setDisplay(Math.round(v))), [spring]);

  return <span ref={ref}>{display}{suffix}</span>;
}

/* ─── NeonText ─────────────────────────────────────────────────────────────── */

function NeonText({ children, color = "#3b82f6" }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{ color, textShadow: `0 0 20px ${color}88, 0 0 40px ${color}44` }}>
      {children}
    </span>
  );
}

/* ─── DSA Stage data ───────────────────────────────────────────────────────── */

const DSA_STAGES = [
  {
    id: "decompose",
    label: "D — Decompose",
    icon: SplitSquareHorizontal,
    color: "#3b82f6",
    glow: "rgba(59,130,246,0.25)",
    border: "border-blue-500/30",
    bg: "bg-blue-500/5",
    title: "Prompt Decomposition",
    description:
      "TRI-TFM splits raw input into semantic atoms: intent, context, constraints, and format signals. Each atom is independently scored for clarity and completeness.",
    example: {
      before: `"Write me a good email about the project"`,
      after: [
        { label: "Intent", value: "draft professional project status email" },
        { label: "Context", value: "business stakeholder, weekly update" },
        { label: "Constraints", value: "concise ≤150 words, formal tone" },
        { label: "Format", value: "subject line + 3 paragraphs + CTA" },
      ],
    },
    metric: { label: "Clarity gain", value: "+67%" },
  },
  {
    id: "synthesize",
    label: "S — Synthesize",
    icon: GitMerge,
    color: "#10b981",
    glow: "rgba(16,185,129,0.25)",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
    title: "Multi-Pass Synthesis",
    description:
      "Decomposed atoms are reconstructed via TFM's iterative proposer-critic-verifier loop. Each pass raises the quality score until convergence threshold is met.",
    example: {
      before: "3 raw components → unstructured concatenation",
      after: [
        { label: "Pass 1", value: "Proposer builds candidate prompt (Q: 71%)" },
        { label: "Pass 2", value: "Critic identifies ambiguities (Q: 84%)" },
        { label: "Pass 3", value: "Verifier confirms alignment (Q: 96%)" },
        { label: "Converged", value: "Δ < threshold → output locked" },
      ],
    },
    metric: { label: "Quality score", value: "96%" },
  },
  {
    id: "align",
    label: "A — Align",
    icon: Target,
    color: "#a855f7",
    glow: "rgba(168,85,247,0.25)",
    border: "border-purple-500/30",
    bg: "bg-purple-500/5",
    title: "Semantic Alignment",
    description:
      "The final output is tested against the original intent vector. Erikson-stage complexity analysis ensures the prompt matches the model's reasoning depth.",
    example: {
      before: "Optimized prompt → unverified output",
      after: [
        { label: "Intent match", value: "98.2% cosine similarity" },
        { label: "Erikson stage", value: "Stage 5 — Industry/Inferiority" },
        { label: "Token delta", value: "−75% vs raw input" },
        { label: "Hallucination risk", value: "↓ from 23% → 3%" },
      ],
    },
    metric: { label: "Token reduction", value: "−75%" },
  },
];

/* ─── DSA Block ────────────────────────────────────────────────────────────── */

function DSABlock({ stage, index }: { stage: typeof DSA_STAGES[0]; index: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const Icon = stage.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.15, ease: "easeOut" }}
      className={`rounded-2xl border ${stage.border} ${stage.bg} overflow-hidden cursor-pointer`}
      style={{ boxShadow: open ? `0 0 30px ${stage.glow}` : "none" }}
      onClick={() => setOpen(o => !o)}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-5">
        <div className="flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${stage.color}18`, border: `1px solid ${stage.color}44` }}
          >
            <Icon className="w-5 h-5" style={{ color: stage.color }} />
          </div>
          <div>
            <span className="text-xs font-mono font-semibold uppercase tracking-widest" style={{ color: stage.color }}>
              {stage.label}
            </span>
            <p className="text-sm font-semibold text-foreground mt-0.5">{stage.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-sm font-bold font-mono hidden sm:block"
            style={{ color: stage.color }}
          >
            {stage.metric.label}: {stage.metric.value}
          </span>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        </div>
      </div>

      {/* Expandable body */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-5 pb-5 border-t border-border/30 pt-4 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{stage.description}</p>

              <div className="grid sm:grid-cols-2 gap-3">
                {/* Before */}
                <div className="rounded-lg border border-border/40 bg-background/40 p-3 space-y-1.5">
                  <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Before TFM</span>
                  <p className="text-xs text-red-400/80 font-mono">
                    {typeof stage.example.before === "string"
                      ? stage.example.before
                      : stage.example.before}
                  </p>
                </div>

                {/* After */}
                <div className="rounded-lg border border-border/40 bg-background/40 p-3 space-y-1.5">
                  <span className="text-xs font-mono uppercase tracking-wider" style={{ color: stage.color }}>After TFM</span>
                  {typeof stage.example.after === "string" ? (
                    <p className="text-xs font-mono" style={{ color: stage.color }}>{stage.example.after}</p>
                  ) : (
                    <div className="space-y-1">
                      {(stage.example.after as { label: string; value: string }[]).map((row, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.07 }}
                          className="flex gap-2 text-xs"
                        >
                          <span className="text-muted-foreground font-mono w-20 flex-shrink-0">{row.label}:</span>
                          <span style={{ color: stage.color }} className="font-mono">{row.value}</span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Comparison table ─────────────────────────────────────────────────────── */

const COMPARISON_ROWS = [
  { metric: "Prompt tokens", before: 1247, after: 312, unit: " tok", better: "lower", pct: "-75%" },
  { metric: "Response quality", before: 64, after: 96, unit: "%", better: "higher", pct: "+50%" },
  { metric: "Hallucination rate", before: 23, after: 3, unit: "%", better: "lower", pct: "-87%" },
  { metric: "Semantic accuracy", before: 71, after: 97, unit: "%", better: "higher", pct: "+37%" },
  { metric: "Avg iterations to converge", before: 0, after: 3.4, unit: " passes", better: "none", pct: "TFM-only" },
  { metric: "Context waste", before: 68, after: 9, unit: "%", better: "lower", pct: "-87%" },
];

function ComparisonTable() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div ref={ref} className="overflow-x-auto rounded-2xl border border-border/40 bg-background/60 backdrop-blur">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/40">
            <th className="text-left px-5 py-3.5 text-muted-foreground font-medium text-xs uppercase tracking-wider w-48">Metric</th>
            <th className="px-5 py-3.5 text-center">
              <span className="text-xs uppercase tracking-wider text-red-400/70 font-medium">Without TFM</span>
            </th>
            <th className="px-5 py-3.5 text-center">
              <span className="text-xs uppercase tracking-wider text-emerald-400 font-medium">With TRI-TFM</span>
            </th>
            <th className="px-5 py-3.5 text-center">
              <span className="text-xs uppercase tracking-wider text-blue-400 font-medium">Delta</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON_ROWS.map((row, i) => (
            <motion.tr
              key={row.metric}
              initial={{ opacity: 0, x: -20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="border-b border-border/20 last:border-0 hover:bg-accent/20 transition-colors"
            >
              <td className="px-5 py-3.5 text-muted-foreground font-mono text-xs">{row.metric}</td>
              <td className="px-5 py-3.5 text-center font-mono text-red-400">
                {inView ? <AnimatedCounter target={row.before} suffix={row.unit} /> : `0${row.unit}`}
              </td>
              <td className="px-5 py-3.5 text-center font-mono text-emerald-400 font-semibold">
                {inView ? <AnimatedCounter target={row.after} suffix={row.unit} /> : `0${row.unit}`}
              </td>
              <td className="px-5 py-3.5 text-center">
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                  row.pct === "TFM-only"
                    ? "bg-blue-500/10 text-blue-400"
                    : row.pct.startsWith("+")
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-blue-500/10 text-blue-400"
                }`}>
                  {row.pct}
                </span>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Feature cards ────────────────────────────────────────────────────────── */

const FEATURES = [
  { icon: Cpu, color: "#3b82f6", title: "Proposer-Critic-Verifier", desc: "Three-agent loop iterates until quality converges above threshold." },
  { icon: Activity, color: "#10b981", title: "Convergence Engine", desc: "Adaptive convergence detection stops iterations at peak efficiency." },
  { icon: Layers, color: "#a855f7", title: "Erikson Stage Analysis", desc: "Complexity scoring maps prompts to cognitive development stages." },
  { icon: BarChart3, color: "#f59e0b", title: "Live Analytics", desc: "Token cost, quality delta, and efficiency metrics per optimization." },
  { icon: Lock, color: "#ef4444", title: "BYOK Support", desc: "Bring your own OpenAI, Google AI, or Anthropic key — zero platform lock-in." },
  { icon: Key, color: "#06b6d4", title: "Lifetime Access", desc: "One-time purchase for unlimited optimizations — no subscription trap." },
];

function FeatureCard({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const Icon = feature.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.07, ease: "easeOut" }}
      whileHover={{ y: -4, boxShadow: `0 8px 32px ${feature.color}22` }}
      className="rounded-xl border border-border/40 bg-background/50 backdrop-blur p-5 space-y-3 transition-shadow"
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${feature.color}15`, border: `1px solid ${feature.color}30` }}
      >
        <Icon className="w-4.5 h-4.5" style={{ color: feature.color }} />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{feature.title}</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{feature.desc}</p>
      </div>
    </motion.div>
  );
}

/* ─── Section title ────────────────────────────────────────────────────────── */

function SectionTitle({ label, title, subtitle }: { label: string; title: React.ReactNode; subtitle?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="text-center space-y-3 mb-12"
    >
      <span className="text-xs font-mono font-semibold uppercase tracking-widest text-primary">{label}</span>
      <h2 className="text-2xl sm:text-3xl font-bold text-foreground">{title}</h2>
      {subtitle && <p className="text-muted-foreground text-sm max-w-xl mx-auto">{subtitle}</p>}
    </motion.div>
  );
}

/* ─── Main LandingPage ─────────────────────────────────────────────────────── */

export default function LandingPage() {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 80], [0, 1]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ── Sticky nav ── */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 backdrop-blur-md"
        style={{ backgroundColor: `rgba(var(--background-rgb, 0,0,0), 0.85)`, opacity: headerOpacity }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="font-mono font-bold text-sm tracking-wider">
            TRI<span className="text-primary">/</span>TFM
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/auth")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/auth")}
              className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-1.5"
              style={{ boxShadow: "0 0 16px rgba(59,130,246,0.4)" }}
            >
              Get started <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* ── Hero ── */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-4 pt-16 pb-24 overflow-hidden">
        <ParticleField />

        {/* Background glow blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)" }} />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-8"
            style={{ background: "radial-gradient(circle, #a855f7 0%, transparent 70%)" }} />
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-xs font-mono text-primary">
              <Sparkles className="w-3 h-3" /> Enterprise Prompt Optimization Engine
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-tight"
          >
            <NeonText color="#3b82f6">TRI</NeonText>
            <span className="text-foreground/30 mx-2">/</span>
            <NeonText color="#a855f7">TFM</NeonText>
            <br />
            <span className="text-foreground text-3xl sm:text-5xl font-bold">
              Decompose. Synthesize. Align.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Transforms raw, ambiguous prompts into precision-engineered instructions.
            <br className="hidden sm:block" />
            Up to <span className="text-emerald-400 font-semibold">−75% tokens</span> · up to{" "}
            <span className="text-blue-400 font-semibold">+50% quality</span> · convergence-verified.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center pt-2"
          >
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/auth")}
              className="px-7 py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2"
              style={{ boxShadow: "0 0 24px rgba(59,130,246,0.5)" }}
            >
              Start optimizing free <ArrowRight className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/auth")}
              className="px-7 py-3 rounded-xl border border-border/60 text-sm font-semibold hover:border-primary/40 transition-colors"
            >
              View live demo
            </motion.button>
          </motion.div>

          {/* Stat pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-wrap justify-center gap-4 pt-4"
          >
            {[
              { v: "-75%", label: "token reduction" },
              { v: "96%", label: "avg quality score" },
              { v: "-87%", label: "hallucination risk" },
              { v: "3×", label: "faster convergence" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/30 bg-background/40 backdrop-blur text-xs">
                <span className="font-bold text-primary font-mono">{s.v}</span>
                <span className="text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground/40"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </section>

      {/* ── D-S-A Pipeline ── */}
      <section className="py-24 px-4 max-w-4xl mx-auto">
        <SectionTitle
          label="The Pipeline"
          title={<>The <NeonText color="#3b82f6">D</NeonText>-<NeonText color="#10b981">S</NeonText>-<NeonText color="#a855f7">A</NeonText> Architecture</>}
          subtitle="Three distinct stages that transform an ambiguous input into a precision-verified prompt. Click each stage to explore the mechanics."
        />

        {/* Pipeline connector */}
        <div className="relative space-y-4">
          {DSA_STAGES.map((stage, i) => (
            <div key={stage.id} className="relative">
              <DSABlock stage={stage} index={i} />
              {i < DSA_STAGES.length - 1 && (
                <div className="flex justify-center py-1">
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.4, delay: 0.5 + i * 0.15 }}
                    className="w-px h-6 bg-gradient-to-b from-border/60 to-transparent origin-top"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Comparison Table ── */}
      <section className="py-24 px-4 bg-gradient-to-b from-transparent via-accent/5 to-transparent">
        <div className="max-w-5xl mx-auto">
          <SectionTitle
            label="Performance"
            title={<>Before vs After <NeonText color="#10b981">TRI-TFM</NeonText></>}
            subtitle="Real metrics across 10,000+ prompt optimization sessions. Counters animate when the section enters the viewport."
          />
          <ComparisonTable />

          {/* Legend */}
          <div className="flex justify-center gap-6 mt-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400/60" /> Without TFM
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> With TRI-TFM
            </span>
          </div>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section className="py-24 px-4 max-w-5xl mx-auto">
        <SectionTitle
          label="Capabilities"
          title={<>Everything you need for <NeonText color="#a855f7">precision</NeonText></>}
          subtitle="Built for teams and individual practitioners who need reliable, auditable prompt engineering."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => <FeatureCard key={f.title} feature={f} index={i} />)}
        </div>
      </section>

      {/* ── BYOK Callout ── */}
      <section className="py-20 px-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55 }}
          className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-8 sm:p-10 text-center space-y-4"
          style={{ boxShadow: "0 0 40px rgba(6,182,212,0.1)" }}
        >
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto">
            <Key className="w-6 h-6 text-cyan-400" />
          </div>
          <h3 className="text-xl font-bold">Bring Your Own Key</h3>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Already have an OpenAI, Google AI, or Anthropic API key? Connect it in Settings to bypass
            the credit system entirely. You pay the provider directly — we just optimize.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {["OpenAI (GPT-4o)", "Google AI (Gemini)", "Anthropic (Claude)"].map(p => (
              <span key={p} className="px-3 py-1 rounded-full text-xs border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 font-mono">
                {p}
              </span>
            ))}
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/auth")}
            className="mt-2 px-6 py-2.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 text-cyan-400 font-semibold text-sm inline-flex items-center gap-2 hover:bg-cyan-500/15 transition-colors"
          >
            Set up BYOK <ArrowRight className="w-4 h-4" />
          </motion.button>
        </motion.div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55 }}
          className="max-w-2xl mx-auto text-center space-y-6"
        >
          <h2 className="text-3xl sm:text-4xl font-black leading-tight">
            Stop writing prompts.<br />
            <NeonText color="#3b82f6">Start engineering them.</NeonText>
          </h2>
          <p className="text-muted-foreground text-sm">
            3 free optimizations on signup. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/auth")}
              className="px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2"
              style={{ boxShadow: "0 0 28px rgba(59,130,246,0.55)" }}
            >
              Try TRI-TFM free <Zap className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => window.open("https://arielwave403.gumroad.com/l/TRI-TFMstudio", "_blank")}
              className="px-8 py-3.5 rounded-xl border border-border/60 font-semibold flex items-center justify-center gap-2 hover:border-amber-400/50 hover:text-amber-400 transition-colors text-sm"
            >
              <Sparkles className="w-4 h-4 text-amber-400" /> Lifetime access — $15
            </motion.button>
          </div>
          <div className="flex justify-center gap-5 pt-2">
            {["No subscription", "BYOK supported", "Cancel anytime"].map(t => (
              <span key={t} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {t}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/30 py-8 px-4 text-center text-xs text-muted-foreground/50">
        <div className="flex flex-col sm:flex-row items-center justify-between max-w-5xl mx-auto gap-3">
          <span className="font-mono font-bold tracking-wider">TRI<span className="text-primary">/</span>TFM</span>
          <span>© {new Date().getFullYear()} · Enterprise Prompt Optimization Engine</span>
          <div className="flex gap-4">
            <button onClick={() => navigate("/auth")} className="hover:text-foreground transition-colors">Sign in</button>
            <button
              onClick={() => window.open("https://arielwave403.gumroad.com/l/TRI-TFMstudio", "_blank")}
              className="hover:text-foreground transition-colors"
            >
              Buy Lifetime
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
