import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import { ArrowRight, Zap, ChevronRight, CheckCircle2, TrendingDown, Activity, BarChart3, Lock } from "lucide-react";

/* ─── helpers ─────────────────────────────────────────────────────────────── */

function AnimatedCounter({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { damping: 30, stiffness: 60 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (inView) motionVal.set(target);
  }, [inView, target, motionVal]);

  useEffect(() => spring.on("change", v => setDisplay(Math.round(v))), [spring]);

  return (
    <span ref={ref}>
      {prefix}{display}{suffix}
    </span>
  );
}

const GUMROAD = "https://arielwave403.gumroad.com/l/TRI-TFMstudio";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

/* ─── D/S/A block data ────────────────────────────────────────────────────── */

const blocks = [
  {
    id: "D",
    label: "Detailer",
    color: "#3b82f6",
    glow: "rgba(59,130,246,0.25)",
    border: "border-blue-500/40",
    bg: "bg-blue-500/8",
    badge: "α = 0.20",
    badgeColor: "text-blue-400 bg-blue-500/15",
    desc: "Expands intent via EFMNB framing — Emotion · Facts · Meaning · Nuance · Brevity. Adds structured depth without bloat.",
    formula: "P′ = D(P, α)",
    metric: "+20% context depth",
    metricColor: "text-blue-400",
  },
  {
    id: "S",
    label: "Summarizer",
    color: "#10b981",
    glow: "rgba(16,185,129,0.25)",
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/8",
    badge: "β = 0.35",
    badgeColor: "text-emerald-400 bg-emerald-500/15",
    desc: "Compresses P′ to its semantic skeleton — preserving every reasoning signal while eliminating redundancy.",
    formula: "P″ = S(P′, β)",
    metric: "−35% token load",
    metricColor: "text-emerald-400",
  },
  {
    id: "A",
    label: "Arbiter",
    color: "#a855f7",
    glow: "rgba(168,85,247,0.25)",
    border: "border-purple-500/40",
    bg: "bg-purple-500/8",
    badge: "5-metric gate",
    badgeColor: "text-purple-400 bg-purple-500/15",
    desc: "Governs convergence. Stops when ≥3 of 5 similarity metrics stabilize for 2 consecutive iterations.",
    formula: "stop if |Δmetrics| < ε",
    metric: "Auto-converges",
    metricColor: "text-purple-400",
  },
];

const arbiterMetrics = [
  { name: "Semantic similarity", short: "cos(v₁,v₂)" },
  { name: "Lexical similarity", short: "Levenshtein" },
  { name: "Length change", short: "Δlen" },
  { name: "Style deviation", short: "Δstyle" },
  { name: "EFMNB quality delta", short: "ΔEFMN" },
];

const stopStates = [
  { state: "STOP_ACCEPT", color: "text-emerald-400", desc: "Converged — stable, high-quality result" },
  { state: "STOP_BEST", color: "text-blue-400", desc: "Budget hit — returns best candidate found" },
  { state: "ROLLBACK", color: "text-amber-400", desc: "Quality regressed — reverts to prior best" },
  { state: "CONTINUE", color: "text-purple-400", desc: "Improvements still possible — iterates" },
];

/* ─── Before / After demo data ────────────────────────────────────────────── */

const beforePrompt = `Write me a Python function that processes user data, handles errors nicely, makes sure it works well with different types of inputs, and also returns good results that the user can use later in their workflow.`;

const afterPrompt = `Write a Python function that:
• Accepts mixed-type user data (str, int, dict, list)
• Raises ValueError with a message on invalid input
• Returns a typed dict: {status, processed_data, errors[]}`;

/* ─── Main component ──────────────────────────────────────────────────────── */

export default function LandingPage() {
  const navigate = useNavigate();
  const [hoverCTA, setHoverCTA] = useState(false);

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f2f2f2] font-['Space_Grotesk',_sans-serif] overflow-x-hidden">

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md"
      >
        <div className="flex items-center gap-2">
          <span className="text-blue-400 font-bold text-lg tracking-wide">TRI</span>
          <span className="text-white/30 text-sm">/</span>
          <span className="text-emerald-400 font-bold text-lg tracking-wide">TFM</span>
          <span className="ml-3 text-xs text-white/30 font-mono">Triangular Flow Methodology</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/app")}
            className="text-sm text-white/60 hover:text-white transition-colors px-4 py-1.5 rounded-md hover:bg-white/5"
          >
            Launch app
          </button>
          <a
            href={GUMROAD}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            $15 — Lifetime
          </a>
        </div>
      </motion.nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-6 flex flex-col items-center text-center overflow-hidden">

        {/* bg glow orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-blue-600/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-emerald-600/6 rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="relative z-10 max-w-4xl mx-auto"
        >
          <motion.div variants={fadeUp} custom={0}>
            <span className="inline-block text-xs font-mono font-semibold tracking-widest text-blue-400/80 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full mb-6 uppercase">
              Mathematical prompt optimization
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="text-6xl xl:text-7xl font-bold leading-[1.05] tracking-tight mb-6"
          >
            Cut Token Cost{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              35%
            </span>
            <br />
            Without Losing{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              a Signal
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="text-lg text-white/55 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            TRI/TFM runs your prompt through a three-stage mathematical pipeline —
            <span className="text-white/80"> Detailer → Summarizer → Arbiter</span> — converging
            to the optimal token/quality trade-off automatically. No prompt engineering required.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={() => navigate("/app")}
              onMouseEnter={() => setHoverCTA(true)}
              onMouseLeave={() => setHoverCTA(false)}
              className="relative group flex items-center gap-2 px-7 py-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base transition-all duration-200 shadow-[0_0_30px_rgba(59,130,246,0.35)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)]"
            >
              <Zap size={16} />
              Try Free — 3 Optimizations
              <motion.div
                animate={{ x: hoverCTA ? 4 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ArrowRight size={16} />
              </motion.div>
            </button>

            <a
              href={GUMROAD}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-7 py-3.5 rounded-lg border border-white/15 hover:border-white/30 text-white/80 hover:text-white font-semibold text-base transition-all duration-200 hover:bg-white/5"
            >
              Get Lifetime Access — $15
              <ChevronRight size={16} />
            </a>
          </motion.div>

          <motion.p variants={fadeUp} custom={4} className="mt-4 text-xs text-white/25">
            One-time payment · No subscription · All future updates included
          </motion.p>
        </motion.div>

        {/* Hero stats row */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="relative z-10 mt-16 grid grid-cols-4 gap-px bg-white/5 rounded-xl overflow-hidden border border-white/8 w-full max-w-3xl"
        >
          {[
            { val: 35, suffix: "%", label: "Avg token reduction", color: "text-emerald-400" },
            { val: 94, suffix: "%", label: "Quality retention", color: "text-blue-400" },
            { val: 3, suffix: "–7", label: "Iterations to convergence", color: "text-purple-400" },
            { val: 15, prefix: "$", suffix: "", label: "One-time lifetime price", color: "text-amber-400" },
          ].map((s, i) => (
            <div key={i} className="bg-[#0d0d10] px-6 py-5 flex flex-col items-center">
              <span className={`text-3xl font-bold font-mono ${s.color}`}>
                <AnimatedCounter target={s.val} suffix={s.suffix} prefix={s.prefix} />
              </span>
              <span className="text-xs text-white/35 mt-1 text-center">{s.label}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── D → S → A PIPELINE ──────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="max-w-5xl mx-auto"
        >
          <motion.div variants={fadeUp} className="text-center mb-4">
            <span className="text-xs font-mono tracking-widest text-white/30 uppercase">
              The Architecture
            </span>
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl font-bold text-center mb-3">
            Three Operators. One Mathematical Guarantee.
          </motion.h2>
          <motion.p variants={fadeUp} className="text-white/45 text-center mb-16 max-w-xl mx-auto">
            Each block runs a deterministic transformation. The Arbiter stops iteration the
            moment further passes would degrade quality or waste tokens.
          </motion.p>

          {/* Pipeline cards */}
          <div className="relative grid grid-cols-3 gap-6">
            {/* connector lines */}
            <div className="absolute top-1/2 left-[33%] right-[33%] -translate-y-1/2 h-px bg-gradient-to-r from-blue-500/40 via-emerald-500/40 to-purple-500/40 z-0 hidden lg:block" />

            {blocks.map((b, i) => (
              <motion.div
                key={b.id}
                variants={fadeUp}
                custom={i}
                className={`relative z-10 rounded-xl border ${b.border} ${b.bg} p-6 flex flex-col gap-4 backdrop-blur-sm`}
                style={{ boxShadow: `0 0 40px -8px ${b.glow}` }}
              >
                {/* Block ID */}
                <div className="flex items-center justify-between">
                  <span
                    className="text-4xl font-black font-mono"
                    style={{ color: b.color }}
                  >
                    {b.id}
                  </span>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${b.badgeColor}`}>
                    {b.badge}
                  </span>
                </div>

                <div>
                  <p className="font-semibold text-white text-base mb-1">{b.label}</p>
                  <p className="text-sm text-white/50 leading-relaxed">{b.desc}</p>
                </div>

                {/* formula */}
                <div className="mt-auto font-mono text-xs bg-black/30 rounded-md px-3 py-2 border border-white/5 text-white/60">
                  {b.formula}
                </div>

                {/* metric */}
                <div className={`text-xs font-semibold ${b.metricColor}`}>
                  {b.metric}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Arbiter decision states */}
          <motion.div
            variants={fadeUp}
            custom={4}
            className="mt-10 rounded-xl border border-purple-500/20 bg-purple-500/5 p-6"
          >
            <p className="text-xs font-mono text-purple-300/60 uppercase tracking-widest mb-4">
              Arbiter — convergence decision states
            </p>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {stopStates.map(s => (
                <div key={s.state} className="bg-black/20 rounded-lg p-3 border border-white/5">
                  <p className={`font-mono text-xs font-bold mb-1 ${s.color}`}>{s.state}</p>
                  <p className="text-xs text-white/40 leading-snug">{s.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-xs text-white/35 font-mono">
                Stop condition: <span className="text-purple-300/70">≥ 3 of 5 metrics stable for 2 consecutive iterations AND quality gate passes</span>
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {arbiterMetrics.map(m => (
                  <span key={m.name} className="text-xs font-mono bg-white/5 border border-white/8 px-2 py-0.5 rounded text-white/40">
                    {m.short}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── BEFORE / AFTER ──────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white/[0.015]">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="max-w-4xl mx-auto"
        >
          <motion.div variants={fadeUp} className="text-center mb-3">
            <span className="text-xs font-mono tracking-widest text-white/30 uppercase">
              Real example
            </span>
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl font-bold text-center mb-14">
            Same Intent.{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              40% Fewer Tokens.
            </span>
          </motion.h2>

          <div className="grid grid-cols-2 gap-6">
            {/* Before */}
            <motion.div variants={fadeUp} custom={0} className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-red-400/70 uppercase tracking-wider">Before</span>
                <span className="text-xs font-mono bg-red-500/15 text-red-400 px-2 py-0.5 rounded">
                  ~52 tokens
                </span>
              </div>
              <p className="text-sm text-white/55 leading-relaxed font-mono whitespace-pre-wrap">{beforePrompt}</p>
            </motion.div>

            {/* After */}
            <motion.div variants={fadeUp} custom={1} className="rounded-xl border border-emerald-500/25 bg-emerald-500/6 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-emerald-400/70 uppercase tracking-wider">After TRI/TFM</span>
                <span className="text-xs font-mono bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded">
                  ~31 tokens
                </span>
              </div>
              <p className="text-sm text-white/80 leading-relaxed font-mono whitespace-pre-wrap">{afterPrompt}</p>
            </motion.div>
          </div>

          {/* Token bar comparison */}
          <motion.div variants={fadeUp} custom={2} className="mt-8 bg-black/20 border border-white/5 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3 text-xs text-white/40 font-mono">
              <span>Token usage</span>
              <span className="text-emerald-400 font-semibold">−40% · Same task quality</span>
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-white/30 mb-1">
                  <span>Original</span><span>52 tokens</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: "100%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="h-full bg-red-500/50 rounded-full"
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-white/30 mb-1">
                  <span>Optimized</span><span>31 tokens</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: "60%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.35, ease: "easeOut" }}
                    className="h-full bg-emerald-500/60 rounded-full"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── WHY IT MATTERS ──────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="max-w-4xl mx-auto"
        >
          <motion.h2 variants={fadeUp} className="text-4xl font-bold text-center mb-14">
            The Math That Makes It Work
          </motion.h2>

          <div className="grid grid-cols-3 gap-6">
            {[
              {
                icon: <TrendingDown size={20} />,
                iconColor: "text-emerald-400",
                iconBg: "bg-emerald-500/10 border-emerald-500/20",
                title: "RGI — Reasoning Gain Index",
                formula: "RGI = ΔQ / ΔT",
                desc: "Quality improvement per token added. TRI/TFM maximizes RGI, not raw quality — ensuring every token pulls its weight.",
              },
              {
                icon: <Activity size={20} />,
                iconColor: "text-blue-400",
                iconBg: "bg-blue-500/10 border-blue-500/20",
                title: "Convergence Gate",
                formula: "Stable(n) ≥ 3 for t, t−1",
                desc: "The Arbiter won't stop early on a lucky iteration. Two consecutive stable passes on 3+ metrics are required before STOP_ACCEPT.",
              },
              {
                icon: <BarChart3 size={20} />,
                iconColor: "text-purple-400",
                iconBg: "bg-purple-500/10 border-purple-500/20",
                title: "EFMNB Quality Score",
                formula: "Q = w·[E,F,M,N,B]",
                desc: "Five orthogonal dimensions weighted and scored independently. Convergence requires quality above threshold on all five axes.",
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                className="rounded-xl border border-white/8 bg-white/[0.025] p-6"
              >
                <div className={`w-10 h-10 rounded-lg border ${card.iconBg} flex items-center justify-center mb-4 ${card.iconColor}`}>
                  {card.icon}
                </div>
                <p className="font-semibold text-white text-sm mb-1">{card.title}</p>
                <p className={`font-mono text-xs mb-3 ${card.iconColor}`}>{card.formula}</p>
                <p className="text-xs text-white/45 leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-white/[0.015]">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="max-w-3xl mx-auto"
        >
          <motion.div variants={fadeUp} className="text-center mb-4">
            <span className="text-xs font-mono tracking-widest text-white/30 uppercase">Pricing</span>
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl font-bold text-center mb-14">
            Simple. Permanent. Yours.
          </motion.h2>

          <div className="grid grid-cols-2 gap-6">
            {/* Free */}
            <motion.div
              variants={fadeUp}
              custom={0}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-7 flex flex-col"
            >
              <p className="text-xs font-mono text-white/30 uppercase tracking-widest mb-3">Free</p>
              <p className="text-4xl font-black text-white mb-1">$0</p>
              <p className="text-xs text-white/30 mb-6">No card required</p>
              <ul className="space-y-3 flex-1">
                {[
                  "3 full optimizations",
                  "All 3 blocks (D + S + A)",
                  "Before/After diff view",
                  "Token savings counter",
                ].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/55">
                    <CheckCircle2 size={14} className="text-white/20 shrink-0" /> {f}
                  </li>
                ))}
                <li className="flex items-center gap-2 text-sm text-white/25">
                  <Lock size={14} className="shrink-0" /> A/B testing — Pro only
                </li>
                <li className="flex items-center gap-2 text-sm text-white/25">
                  <Lock size={14} className="shrink-0" /> Analytics history — Pro only
                </li>
              </ul>
              <button
                onClick={() => navigate("/app")}
                className="mt-8 w-full py-3 rounded-lg border border-white/15 hover:border-white/30 text-white/70 hover:text-white text-sm font-semibold transition-colors"
              >
                Start Free
              </button>
            </motion.div>

            {/* Pro */}
            <motion.div
              variants={fadeUp}
              custom={1}
              className="relative rounded-xl border border-blue-500/40 bg-blue-500/8 p-7 flex flex-col overflow-hidden"
              style={{ boxShadow: "0 0 60px -12px rgba(59,130,246,0.3)" }}
            >
              <div className="absolute top-4 right-4 text-xs font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
                Best value
              </div>
              <p className="text-xs font-mono text-blue-400/60 uppercase tracking-widest mb-3">Lifetime</p>
              <div className="flex items-baseline gap-2 mb-1">
                <p className="text-4xl font-black text-white">$15</p>
                <span className="text-sm text-white/30 line-through">$49</span>
              </div>
              <p className="text-xs text-white/30 mb-6">One-time · No subscription · Forever</p>
              <ul className="space-y-3 flex-1">
                {[
                  "Unlimited optimizations",
                  "All 3 blocks (D + S + A)",
                  "Before/After diff view",
                  "Token savings counter",
                  "A/B testing (compare variants)",
                  "Full analytics history",
                  "Priority processing",
                  "All future updates",
                ].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/80">
                    <CheckCircle2 size={14} className="text-blue-400 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <a
                href={GUMROAD}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 w-full py-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors text-center block shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.45)]"
              >
                Get Lifetime Access — $15
              </a>
            </motion.div>
          </div>

          <motion.p variants={fadeUp} custom={2} className="text-center text-xs text-white/20 mt-6">
            Or bring your own API key (OpenAI · Gemini · Claude) for unlimited free use
          </motion.p>
        </motion.div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────────────── */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[300px] bg-blue-600/10 rounded-full blur-[100px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="relative z-10 max-w-2xl mx-auto text-center"
        >
          <h2 className="text-5xl font-black mb-4 leading-tight">
            Stop Paying for{" "}
            <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              Token Waste
            </span>
          </h2>
          <p className="text-white/45 mb-10 text-lg">
            Every unoptimized prompt costs you more than the last.
            TRI/TFM pays for itself in one hour of API calls.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => navigate("/app")}
              className="flex items-center gap-2 px-8 py-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-base transition-all duration-200 shadow-[0_0_40px_rgba(59,130,246,0.4)] hover:shadow-[0_0_50px_rgba(59,130,246,0.55)]"
            >
              <Zap size={18} />
              Try 3 Free Optimizations
            </button>
            <a
              href={GUMROAD}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-8 py-4 rounded-lg border border-white/15 hover:border-white/25 text-white/70 hover:text-white font-bold text-base transition-colors"
            >
              $15 — Own It Forever
            </a>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 px-8 py-6 flex items-center justify-between text-xs text-white/20">
        <span className="font-mono">TRI/TFM · Triangular Flow Methodology</span>
        <div className="flex items-center gap-6">
          <button onClick={() => navigate("/app")} className="hover:text-white/50 transition-colors">
            Launch App
          </button>
          <a href={GUMROAD} target="_blank" rel="noopener noreferrer" className="hover:text-white/50 transition-colors">
            Buy Lifetime
          </a>
        </div>
      </footer>
    </div>
  );
}
