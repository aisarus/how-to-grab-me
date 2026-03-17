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
  ArrowRight, Zap, ChevronRight, CheckCircle2, TrendingDown,
  Activity, BarChart3, Lock, Code2, Cpu, Layers, Sparkles,
} from "lucide-react";

/* ─── Particle field ───────────────────────────────────────────────────────── */

const PARTICLES = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  x: (i * 97.3) % 100,
  size: 2 + (i % 3),
  duration: 8 + (i % 9),
  delay: (i * 0.28) % 5.5,
  color: i % 3 === 0 ? "#3b82f6" : i % 3 === 1 ? "#10b981" : "#a855f7",
  opacity: 0.12 + (i % 6) * 0.05,
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
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
          }}
          initial={{ y: "110vh", opacity: 0 }}
          animate={{ y: "-10vh", opacity: [0, p.opacity, p.opacity, 0] }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

/* ─── AnimatedCounter ──────────────────────────────────────────────────────── */

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

/* ─── TypewriterText ───────────────────────────────────────────────────────── */

function TypewriterText({ text, inView }: { text: string; inView: boolean }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!inView) return;
    setDisplayed("");
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(timer); setDone(true); }
    }, 14);
    return () => clearInterval(timer);
  }, [inView, text]);

  return (
    <>
      {displayed}
      {inView && !done && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-[2px] h-[1em] bg-emerald-400 ml-0.5 align-middle"
        />
      )}
    </>
  );
}

/* ─── PipelineConnector ────────────────────────────────────────────────────── */

function PipelineConnector({ fromColor, toColor }: { fromColor: string; toColor: string }) {
  return (
    <div className="hidden lg:flex items-center justify-center w-16 shrink-0 relative">
      <div
        className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2"
        style={{ background: `linear-gradient(to right, ${fromColor}60, ${toColor}60)` }}
      />
      {[0, 0.45, 0.9].map((delay, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ width: 5, height: 5, backgroundColor: toColor, boxShadow: `0 0 8px ${toColor}` }}
          animate={{ x: [-24, 24], opacity: [0, 1, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, delay, ease: "linear" }}
        />
      ))}
      <div
        className="absolute right-0"
        style={{
          width: 0, height: 0,
          borderTop: "5px solid transparent",
          borderBottom: "5px solid transparent",
          borderLeft: `7px solid ${toColor}80`,
        }}
      />
    </div>
  );
}

/* ─── NeonBorderCard ───────────────────────────────────────────────────────── */

function NeonBorderCard({ color, children, className = "" }: { color: string; children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={`relative rounded-xl overflow-hidden ${className}`}
      whileHover="hover"
      initial="rest"
    >
      {/* animated neon border */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        variants={{
          rest: { boxShadow: `0 0 0px ${color}00, inset 0 0 0px ${color}00` },
          hover: { boxShadow: `0 0 30px ${color}50, inset 0 0 20px ${color}15` },
        }}
        transition={{ duration: 0.25 }}
      />
      {children}
    </motion.div>
  );
}

/* ─── Constants & data ─────────────────────────────────────────────────────── */

const GUMROAD = "https://arielwave403.gumroad.com/l/TRI-TFMstudio";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const blocks = [
  {
    id: "D", label: "Detailer",
    color: "#3b82f6", glow: "rgba(59,130,246,0.25)", glowHover: "rgba(59,130,246,0.55)",
    border: "border-blue-500/40", bg: "bg-blue-500/8",
    badge: "α = 0.20", badgeColor: "text-blue-400 bg-blue-500/15",
    desc: "Expands intent via EFMNB framing — Emotion · Facts · Meaning · Nuance · Brevity. Adds structured depth without bloat.",
    formula: "P′ = D(P, α)",
    metric: "+20% context depth", metricColor: "text-blue-400",
    details: ["Emotion framing", "Facts structuring", "Meaning layer", "Nuance tags", "Brevity pass"],
  },
  {
    id: "S", label: "Summarizer",
    color: "#10b981", glow: "rgba(16,185,129,0.25)", glowHover: "rgba(16,185,129,0.55)",
    border: "border-emerald-500/40", bg: "bg-emerald-500/8",
    badge: "β = 0.35", badgeColor: "text-emerald-400 bg-emerald-500/15",
    desc: "Compresses P′ to its semantic skeleton — preserving every reasoning signal while eliminating redundancy.",
    formula: "P″ = S(P′, β)",
    metric: "−35% token load", metricColor: "text-emerald-400",
    details: ["Semantic dedup", "Redundancy prune", "Signal extraction", "Token budget", "Quality lock"],
  },
  {
    id: "A", label: "Arbiter",
    color: "#a855f7", glow: "rgba(168,85,247,0.25)", glowHover: "rgba(168,85,247,0.55)",
    border: "border-purple-500/40", bg: "bg-purple-500/8",
    badge: "5-metric gate", badgeColor: "text-purple-400 bg-purple-500/15",
    desc: "Governs convergence. Stops when ≥3 of 5 similarity metrics stabilize for 2 consecutive iterations.",
    formula: "stop if |Δmetrics| < ε",
    metric: "Auto-converges", metricColor: "text-purple-400",
    details: ["Cosine similarity", "Levenshtein Δ", "Length gate", "Style Δ", "EFMNB Δ"],
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
  { state: "STOP_ACCEPT", color: "text-emerald-400", dot: "bg-emerald-400", desc: "Converged — stable, high-quality result" },
  { state: "STOP_BEST", color: "text-blue-400", dot: "bg-blue-400", desc: "Budget hit — returns best candidate found" },
  { state: "ROLLBACK", color: "text-amber-400", dot: "bg-amber-400", desc: "Quality regressed — reverts to prior best" },
  { state: "CONTINUE", color: "text-purple-400", dot: "bg-purple-400", desc: "Improvements still possible — iterates" },
];

const useCases = [
  {
    icon: <Code2 size={20} />, title: "API Developers",
    desc: "Cut $100s/month from LLM bills by auto-optimizing every outbound prompt before it hits the API.",
    color: "text-blue-400", iconBg: "bg-blue-500/10 border-blue-500/20", glow: "rgba(59,130,246,0.4)",
  },
  {
    icon: <Cpu size={20} />, title: "AI Product Teams",
    desc: "Ship faster with prompts that consistently hit quality targets — no more manual prompt tuning cycles.",
    color: "text-emerald-400", iconBg: "bg-emerald-500/10 border-emerald-500/20", glow: "rgba(16,185,129,0.4)",
  },
  {
    icon: <Layers size={20} />, title: "Prompt Engineers",
    desc: "Replace intuition-based iteration with mathematical convergence. Reproducible results, every run.",
    color: "text-purple-400", iconBg: "bg-purple-500/10 border-purple-500/20", glow: "rgba(168,85,247,0.4)",
  },
  {
    icon: <Sparkles size={20} />, title: "LLM Researchers",
    desc: "Benchmark D/S/A transformation quality with built-in A/B testing and full analytics history.",
    color: "text-amber-400", iconBg: "bg-amber-500/10 border-amber-500/20", glow: "rgba(245,158,11,0.4)",
  },
];

const beforePrompt = `Write me a Python function that processes user data, handles errors nicely, makes sure it works well with different types of inputs, and also returns good results that the user can use later in their workflow.`;

const afterPrompt = `Write a Python function that:\n• Accepts mixed-type user data (str, int, dict, list)\n• Raises ValueError with a message on invalid input\n• Returns a typed dict: {status, processed_data, errors[]}`;

/* ─── Main component ──────────────────────────────────────────────────────── */

export default function LandingPage() {
  const navigate = useNavigate();
  const [hoverCTA, setHoverCTA] = useState(false);
  const [activeBlock, setActiveBlock] = useState<string | null>(null);

  // Scroll progress bar
  const { scrollYProgress } = useScroll();

  // Hero parallax
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(heroProgress, [0, 1], [0, -100]);
  const heroOpacity = useTransform(heroProgress, [0, 0.75], [1, 0]);

  // Typewriter trigger
  const afterRef = useRef(null);
  const afterInView = useInView(afterRef, { once: true, margin: "-40px" });

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f2f2f2] font-['Space_Grotesk',_sans-serif] overflow-x-hidden">

      {/* ── Scroll progress bar ───────────────────────────────────────────── */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] z-[60] origin-left"
        style={{
          scaleX: scrollYProgress,
          background: "linear-gradient(to right, #3b82f6, #10b981, #a855f7)",
        }}
      />

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md"
      >
        <div className="flex items-center gap-2">
          <motion.span
            className="text-blue-400 font-black text-lg tracking-wide"
            animate={{ textShadow: ["0 0 8px #3b82f6", "0 0 20px #3b82f6", "0 0 8px #3b82f6"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            TRI
          </motion.span>
          <span className="text-white/30 text-sm font-light">/</span>
          <motion.span
            className="text-emerald-400 font-black text-lg tracking-wide"
            animate={{ textShadow: ["0 0 8px #10b981", "0 0 20px #10b981", "0 0 8px #10b981"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          >
            TFM
          </motion.span>
          <span className="ml-3 text-xs text-white/25 font-mono hidden sm:block">Triangular Flow Methodology</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/app")}
            className="text-sm text-white/55 hover:text-white transition-colors px-4 py-1.5 rounded-md hover:bg-white/5"
          >
            Launch app
          </button>
          <motion.a
            href={GUMROAD}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold px-4 py-1.5 rounded-md bg-blue-600 text-white transition-colors relative overflow-hidden"
            whileHover={{ scale: 1.04, boxShadow: "0 0 20px rgba(59,130,246,0.6)" }}
            whileTap={{ scale: 0.97 }}
          >
            $15 — Lifetime
          </motion.a>
        </div>
      </motion.nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative pt-32 pb-24 px-6 flex flex-col items-center text-center overflow-hidden min-h-[90vh]"
      >
        <ParticleField />

        {/* bg glow orbs with parallax-like float */}
        <motion.div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full blur-[130px] pointer-events-none"
          style={{ background: "rgba(59,130,246,0.07)" }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/4 w-[500px] h-[400px] rounded-full blur-[110px] pointer-events-none"
          style={{ background: "rgba(16,185,129,0.05)" }}
          animate={{ scale: [1, 1.12, 1], x: [-20, 20, -20] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[300px] rounded-full blur-[100px] pointer-events-none"
          style={{ background: "rgba(168,85,247,0.05)" }}
          animate={{ scale: [1, 1.15, 1], y: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 max-w-4xl mx-auto w-full"
        >
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeUp} custom={0}>
              <motion.span
                className="inline-block text-xs font-mono font-semibold tracking-widest text-blue-400/80 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full mb-6 uppercase"
                animate={{ borderColor: ["rgba(59,130,246,0.2)", "rgba(59,130,246,0.5)", "rgba(59,130,246,0.2)"] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                Mathematical prompt optimization
              </motion.span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight mb-6"
            >
              Cut Token Cost{" "}
              <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                35%
              </span>
              <br />
              Without Losing{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                a Signal
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-lg text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              TRI/TFM runs your prompt through a three-stage mathematical pipeline —
              <span className="text-white/80 font-medium"> Detailer → Summarizer → Arbiter</span> — converging
              to the optimal token/quality trade-off automatically. No prompt engineering required.
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex items-center justify-center gap-4 flex-wrap">
              <motion.button
                onClick={() => navigate("/app")}
                onMouseEnter={() => setHoverCTA(true)}
                onMouseLeave={() => setHoverCTA(false)}
                className="relative flex items-center gap-2 px-7 py-3.5 rounded-lg bg-blue-600 text-white font-semibold text-base overflow-hidden"
                whileHover={{ scale: 1.04, boxShadow: "0 0 50px rgba(59,130,246,0.6)" }}
                whileTap={{ scale: 0.97 }}
                animate={{ boxShadow: ["0 0 25px rgba(59,130,246,0.3)", "0 0 40px rgba(59,130,246,0.45)", "0 0 25px rgba(59,130,246,0.3)"] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                {/* shimmer */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                />
                <Zap size={16} />
                Try Free — 3 Optimizations
                <motion.div animate={{ x: hoverCTA ? 4 : 0 }} transition={{ duration: 0.2 }}>
                  <ArrowRight size={16} />
                </motion.div>
              </motion.button>

              <motion.a
                href={GUMROAD}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-7 py-3.5 rounded-lg border border-white/15 text-white/75 font-semibold text-base transition-colors"
                whileHover={{ borderColor: "rgba(255,255,255,0.35)", color: "#fff", scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                Get Lifetime Access — $15
                <ChevronRight size={16} />
              </motion.a>
            </motion.div>

            <motion.p variants={fadeUp} custom={4} className="mt-4 text-xs text-white/22">
              One-time payment · No subscription · All future updates included
            </motion.p>
          </motion.div>

          {/* Hero stats */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-16 grid grid-cols-4 gap-px bg-white/5 rounded-xl overflow-hidden border border-white/8 w-full max-w-3xl mx-auto"
          >
            {[
              { val: 35, suffix: "%", label: "Avg token reduction", color: "text-emerald-400", glow: "#10b981" },
              { val: 94, suffix: "%", label: "Quality retention", color: "text-blue-400", glow: "#3b82f6" },
              { val: 3, suffix: "–7", label: "Iterations to convergence", color: "text-purple-400", glow: "#a855f7" },
              { val: 15, prefix: "$", suffix: "", label: "One-time lifetime price", color: "text-amber-400", glow: "#f59e0b" },
            ].map((s, i) => (
              <motion.div
                key={i}
                className="bg-[#0d0d10] px-6 py-5 flex flex-col items-center cursor-default"
                whileHover={{ backgroundColor: "#111118" }}
              >
                <motion.span
                  className={`text-3xl font-black font-mono ${s.color}`}
                  animate={{ textShadow: [`0 0 0px ${s.glow}`, `0 0 16px ${s.glow}60`, `0 0 0px ${s.glow}`] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                >
                  <AnimatedCounter target={s.val} suffix={s.suffix} prefix={s.prefix} />
                </motion.span>
                <span className="text-xs text-white/32 mt-1 text-center">{s.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── D → S → A PIPELINE ───────────────────────────────────────────── */}
      <section className="py-24 px-6 relative overflow-hidden">
        {/* section bg glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-900/10 rounded-full blur-[100px]" />
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="max-w-5xl mx-auto relative z-10"
        >
          <motion.div variants={fadeUp} className="text-center mb-3">
            <span className="text-xs font-mono tracking-widest text-white/28 uppercase">
              The Architecture
            </span>
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl font-black text-center mb-3">
            Three Operators. One Mathematical Guarantee.
          </motion.h2>
          <motion.p variants={fadeUp} className="text-white/42 text-center mb-16 max-w-xl mx-auto text-sm leading-relaxed">
            Each block runs a deterministic transformation. The Arbiter stops iteration the
            moment further passes would degrade quality or waste tokens.
          </motion.p>

          {/* Pipeline cards with connectors */}
          <div className="flex items-stretch gap-0 justify-center">
            {blocks.map((b, i) => (
              <div key={b.id} className="flex items-center">
                <motion.div
                  variants={fadeUp}
                  custom={i}
                  className={`relative rounded-xl border ${b.border} ${b.bg} p-6 flex flex-col gap-4 backdrop-blur-sm w-full max-w-[280px] cursor-pointer overflow-hidden`}
                  style={{ boxShadow: `0 0 35px -10px ${b.glow}` }}
                  whileHover={{
                    scale: 1.03,
                    boxShadow: `0 0 60px -8px ${b.glowHover}`,
                    transition: { duration: 0.2 },
                  }}
                  onHoverStart={() => setActiveBlock(b.id)}
                  onHoverEnd={() => setActiveBlock(null)}
                >
                  {/* scan shimmer on hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.04] to-transparent pointer-events-none"
                    animate={activeBlock === b.id ? { y: ["-100%", "200%"] } : { y: "-100%" }}
                    transition={{ duration: 0.8, ease: "linear", repeat: activeBlock === b.id ? Infinity : 0, repeatDelay: 0.3 }}
                  />

                  {/* top row */}
                  <div className="flex items-center justify-between">
                    <motion.span
                      className="text-5xl font-black font-mono"
                      style={{ color: b.color }}
                      animate={{ textShadow: [`0 0 0px ${b.color}`, `0 0 30px ${b.color}80`, `0 0 0px ${b.color}`] }}
                      transition={{ duration: 3, repeat: Infinity, delay: i }}
                    >
                      {b.id}
                    </motion.span>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${b.badgeColor}`}>
                      {b.badge}
                    </span>
                  </div>

                  <div>
                    <p className="font-bold text-white text-base mb-1">{b.label}</p>
                    <p className="text-sm text-white/48 leading-relaxed">{b.desc}</p>
                  </div>

                  {/* formula */}
                  <div className="font-mono text-xs bg-black/35 rounded-md px-3 py-2 border border-white/5 text-white/55">
                    {b.formula}
                  </div>

                  {/* details list — fade in on hover */}
                  <AnimatePresence>
                    {activeBlock === b.id && (
                      <motion.ul
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-1 overflow-hidden"
                      >
                        {b.details.map((d, di) => (
                          <motion.li
                            key={d}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: di * 0.05 }}
                            className="flex items-center gap-2 text-xs"
                            style={{ color: b.color + "bb" }}
                          >
                            <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                            {d}
                          </motion.li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>

                  {/* metric */}
                  <motion.div
                    className={`text-xs font-bold mt-auto ${b.metricColor}`}
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}
                  >
                    {b.metric}
                  </motion.div>
                </motion.div>

                {/* connector */}
                {i < blocks.length - 1 && (
                  <PipelineConnector
                    fromColor={blocks[i].color}
                    toColor={blocks[i + 1].color}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Arbiter decision states */}
          <motion.div
            variants={fadeUp}
            custom={4}
            className="mt-10 rounded-xl border border-purple-500/20 bg-purple-500/5 p-6 relative overflow-hidden"
          >
            {/* pulsing border */}
            <motion.div
              className="absolute inset-0 rounded-xl pointer-events-none border border-purple-500/0"
              animate={{ borderColor: ["rgba(168,85,247,0)", "rgba(168,85,247,0.3)", "rgba(168,85,247,0)"] }}
              transition={{ duration: 3, repeat: Infinity }}
            />

            <p className="text-xs font-mono text-purple-300/55 uppercase tracking-widest mb-4">
              Arbiter — convergence decision states
            </p>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {stopStates.map((s, i) => (
                <motion.div
                  key={s.state}
                  className="bg-black/20 rounded-lg p-3 border border-white/5 cursor-default"
                  whileHover={{ borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(0,0,0,0.35)" }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <motion.div
                      className={`w-1.5 h-1.5 rounded-full ${s.dot}`}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                    />
                    <p className={`font-mono text-xs font-bold ${s.color}`}>{s.state}</p>
                  </div>
                  <p className="text-xs text-white/38 leading-snug">{s.desc}</p>
                </motion.div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-xs text-white/32 font-mono">
                Stop condition: <span className="text-purple-300/65">≥ 3 of 5 metrics stable for 2 consecutive iterations AND quality gate passes</span>
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {arbiterMetrics.map((m, i) => (
                  <motion.span
                    key={m.name}
                    className="text-xs font-mono bg-white/4 border border-white/8 px-2 py-0.5 rounded text-white/38"
                    whileHover={{ borderColor: "rgba(168,85,247,0.4)", color: "#c084fc" }}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + i * 0.08 }}
                  >
                    {m.short}
                  </motion.span>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── BEFORE / AFTER ────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white/[0.012]">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="max-w-4xl mx-auto"
        >
          <motion.div variants={fadeUp} className="text-center mb-3">
            <span className="text-xs font-mono tracking-widest text-white/28 uppercase">
              Real example
            </span>
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl font-black text-center mb-14">
            Same Intent.{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              40% Fewer Tokens.
            </span>
          </motion.h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Before */}
            <motion.div
              variants={fadeUp}
              custom={0}
              className="rounded-xl border border-red-500/20 bg-red-500/5 p-5"
              whileHover={{ borderColor: "rgba(239,68,68,0.35)", boxShadow: "0 0 30px -10px rgba(239,68,68,0.3)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-red-400/65 uppercase tracking-wider">Before</span>
                <span className="text-xs font-mono bg-red-500/15 text-red-400 px-2 py-0.5 rounded">~52 tokens</span>
              </div>
              <p className="text-sm text-white/50 leading-relaxed font-mono whitespace-pre-wrap">{beforePrompt}</p>
            </motion.div>

            {/* After — typewriter */}
            <motion.div
              ref={afterRef}
              variants={fadeUp}
              custom={1}
              className="rounded-xl border border-emerald-500/25 bg-emerald-500/6 p-5"
              whileHover={{ borderColor: "rgba(16,185,129,0.45)", boxShadow: "0 0 30px -10px rgba(16,185,129,0.35)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-emerald-400/65 uppercase tracking-wider">After TRI/TFM</span>
                <span className="text-xs font-mono bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded">~31 tokens</span>
              </div>
              <p className="text-sm text-white/80 leading-relaxed font-mono whitespace-pre-wrap min-h-[6rem]">
                <TypewriterText text={afterPrompt} inView={afterInView} />
              </p>
            </motion.div>
          </div>

          {/* Token bar */}
          <motion.div
            variants={fadeUp}
            custom={2}
            className="mt-8 bg-black/20 border border-white/5 rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-3 text-xs text-white/38 font-mono">
              <span>Token usage comparison</span>
              <motion.span
                className="text-emerald-400 font-semibold"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                −40% · Same task quality
              </motion.span>
            </div>
            <div className="space-y-3">
              {[
                { label: "Original", tokens: 52, pct: "100%", color: "bg-red-500/50" },
                { label: "Optimized", tokens: 31, pct: "60%", color: "bg-emerald-500/60" },
              ].map((row, i) => (
                <div key={row.label}>
                  <div className="flex justify-between text-xs text-white/28 mb-1.5">
                    <span>{row.label}</span><span>{row.tokens} tokens</span>
                  </div>
                  <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: row.pct }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.2 + i * 0.2, ease: "easeOut" }}
                      className={`h-full ${row.color} rounded-full relative overflow-hidden`}
                    >
                      <motion.div
                        className="absolute inset-y-0 w-12 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{ x: ["-200%", "300%"] }}
                        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2, ease: "linear" }}
                      />
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── USE CASES ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="max-w-5xl mx-auto"
        >
          <motion.div variants={fadeUp} className="text-center mb-3">
            <span className="text-xs font-mono tracking-widest text-white/28 uppercase">Who it's for</span>
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl font-black text-center mb-14">
            Built for Anyone Paying{" "}
            <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              Per Token
            </span>
          </motion.h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {useCases.map((u, i) => (
              <motion.div
                key={u.title}
                variants={fadeUp}
                custom={i}
                className="rounded-xl border border-white/8 bg-white/[0.025] p-5 flex flex-col gap-3 cursor-default"
                whileHover={{
                  borderColor: "rgba(255,255,255,0.14)",
                  backgroundColor: "rgba(255,255,255,0.04)",
                  boxShadow: `0 0 30px -10px ${u.glow}`,
                  y: -4,
                }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  className={`w-10 h-10 rounded-lg border ${u.iconBg} flex items-center justify-center ${u.color} shrink-0`}
                  whileHover={{ rotate: [0, -8, 8, 0] }}
                  transition={{ duration: 0.4 }}
                >
                  {u.icon}
                </motion.div>
                <p className="font-bold text-white text-sm">{u.title}</p>
                <p className="text-xs text-white/42 leading-relaxed">{u.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── THE MATH ──────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white/[0.012]">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="max-w-4xl mx-auto"
        >
          <motion.h2 variants={fadeUp} className="text-4xl font-black text-center mb-14">
            The Math That Makes It Work
          </motion.h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <TrendingDown size={20} />,
                iconColor: "text-emerald-400", iconBg: "bg-emerald-500/10 border-emerald-500/20",
                title: "RGI — Reasoning Gain Index",
                formula: "RGI = ΔQ / ΔT",
                color: "#10b981",
                desc: "Quality improvement per token added. TRI/TFM maximizes RGI, not raw quality — ensuring every token pulls its weight.",
              },
              {
                icon: <Activity size={20} />,
                iconColor: "text-blue-400", iconBg: "bg-blue-500/10 border-blue-500/20",
                title: "Convergence Gate",
                formula: "Stable(n) ≥ 3 for t, t−1",
                color: "#3b82f6",
                desc: "The Arbiter won't stop early on a lucky iteration. Two consecutive stable passes on 3+ metrics are required before STOP_ACCEPT.",
              },
              {
                icon: <BarChart3 size={20} />,
                iconColor: "text-purple-400", iconBg: "bg-purple-500/10 border-purple-500/20",
                title: "EFMNB Quality Score",
                formula: "Q = w·[E,F,M,N,B]",
                color: "#a855f7",
                desc: "Five orthogonal dimensions weighted and scored independently. Convergence requires quality above threshold on all five axes.",
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                className="rounded-xl border border-white/8 bg-white/[0.025] p-6 cursor-default"
                whileHover={{
                  borderColor: `${card.color}40`,
                  boxShadow: `0 0 40px -12px ${card.color}50`,
                  y: -3,
                }}
                transition={{ duration: 0.2 }}
              >
                <div className={`w-10 h-10 rounded-lg border ${card.iconBg} flex items-center justify-center mb-4 ${card.iconColor}`}>
                  {card.icon}
                </div>
                <p className="font-bold text-white text-sm mb-1">{card.title}</p>
                <motion.p
                  className={`font-mono text-sm mb-3 font-bold ${card.iconColor}`}
                  animate={{ textShadow: [`0 0 0px ${card.color}`, `0 0 12px ${card.color}60`, `0 0 0px ${card.color}`] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i }}
                >
                  {card.formula}
                </motion.p>
                <p className="text-xs text-white/42 leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="max-w-3xl mx-auto"
        >
          <motion.div variants={fadeUp} className="text-center mb-3">
            <span className="text-xs font-mono tracking-widest text-white/28 uppercase">Pricing</span>
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl font-black text-center mb-14">
            Simple. Permanent. Yours.
          </motion.h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Free */}
            <motion.div
              variants={fadeUp}
              custom={0}
              className="rounded-xl border border-white/10 bg-white/[0.025] p-7 flex flex-col"
              whileHover={{ borderColor: "rgba(255,255,255,0.18)" }}
            >
              <p className="text-xs font-mono text-white/28 uppercase tracking-widest mb-3">Free</p>
              <p className="text-4xl font-black text-white mb-1">$0</p>
              <p className="text-xs text-white/28 mb-6">No card required</p>
              <ul className="space-y-3 flex-1">
                {[
                  "3 full optimizations",
                  "All 3 blocks (D + S + A)",
                  "Before/After diff view",
                  "Token savings counter",
                ].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/52">
                    <CheckCircle2 size={14} className="text-white/18 shrink-0" /> {f}
                  </li>
                ))}
                <li className="flex items-center gap-2 text-sm text-white/22">
                  <Lock size={14} className="shrink-0" /> A/B testing — Pro only
                </li>
                <li className="flex items-center gap-2 text-sm text-white/22">
                  <Lock size={14} className="shrink-0" /> Analytics history — Pro only
                </li>
              </ul>
              <motion.button
                onClick={() => navigate("/app")}
                className="mt-8 w-full py-3 rounded-lg border border-white/14 text-white/65 text-sm font-semibold"
                whileHover={{ borderColor: "rgba(255,255,255,0.28)", color: "#fff" }}
                whileTap={{ scale: 0.98 }}
              >
                Start Free
              </motion.button>
            </motion.div>

            {/* Pro */}
            <motion.div
              variants={fadeUp}
              custom={1}
              className="relative rounded-xl border border-blue-500/40 bg-blue-500/8 p-7 flex flex-col overflow-hidden"
              animate={{
                boxShadow: [
                  "0 0 30px -12px rgba(59,130,246,0.3)",
                  "0 0 60px -12px rgba(59,130,246,0.5)",
                  "0 0 30px -12px rgba(59,130,246,0.3)",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              whileHover={{ boxShadow: "0 0 80px -12px rgba(59,130,246,0.6)" }}
            >
              {/* animated top border */}
              <motion.div
                className="absolute top-0 left-0 right-0 h-[1px]"
                style={{ background: "linear-gradient(to right, transparent, #3b82f6, transparent)" }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />

              {/* shimmer */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/5 to-transparent -skew-x-12 pointer-events-none"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
              />

              <div className="absolute top-4 right-4 text-xs font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
                Best value
              </div>
              <p className="text-xs font-mono text-blue-400/55 uppercase tracking-widest mb-3">Lifetime</p>
              <div className="flex items-baseline gap-2 mb-1">
                <p className="text-4xl font-black text-white">$15</p>
                <span className="text-sm text-white/28 line-through">$49</span>
              </div>
              <p className="text-xs text-white/28 mb-6">One-time · No subscription · Forever</p>
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
                ].map((f, fi) => (
                  <motion.li
                    key={f}
                    className="flex items-center gap-2 text-sm text-white/78"
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + fi * 0.06 }}
                  >
                    <CheckCircle2 size={14} className="text-blue-400 shrink-0" /> {f}
                  </motion.li>
                ))}
              </ul>
              <motion.a
                href={GUMROAD}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 w-full py-3.5 rounded-lg bg-blue-600 text-white text-sm font-black text-center block relative overflow-hidden"
                whileHover={{ backgroundColor: "#3b82f6", boxShadow: "0 0 50px rgba(59,130,246,0.5)" }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 2 }}
                />
                Get Lifetime Access — $15
              </motion.a>
            </motion.div>
          </div>

          <motion.p variants={fadeUp} custom={2} className="text-center text-xs text-white/18 mt-6">
            Or bring your own API key (OpenAI · Gemini · Claude) for unlimited free use
          </motion.p>
        </motion.div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section className="py-28 px-6 relative overflow-hidden">
        {/* multi-color glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            className="w-[700px] h-[350px] rounded-full blur-[120px]"
            style={{ background: "radial-gradient(ellipse, rgba(59,130,246,0.12) 0%, rgba(168,85,247,0.08) 50%, transparent 70%)" }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="relative z-10 max-w-2xl mx-auto text-center"
        >
          <motion.div
            className="inline-block mb-6 text-xs font-mono tracking-widest text-white/30 uppercase bg-white/3 border border-white/8 px-3 py-1 rounded-full"
            animate={{ borderColor: ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.18)", "rgba(255,255,255,0.08)"] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            Start today
          </motion.div>

          <h2 className="text-5xl font-black mb-4 leading-tight">
            Stop Paying for{" "}
            <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              Token Waste
            </span>
          </h2>
          <p className="text-white/42 mb-10 text-lg leading-relaxed">
            Every unoptimized prompt costs you more than the last.
            TRI/TFM pays for itself in one hour of API calls.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <motion.button
              onClick={() => navigate("/app")}
              className="flex items-center gap-2 px-8 py-4 rounded-lg bg-blue-600 text-white font-black text-base relative overflow-hidden"
              whileHover={{ scale: 1.04, boxShadow: "0 0 60px rgba(59,130,246,0.6)" }}
              whileTap={{ scale: 0.97 }}
              animate={{ boxShadow: ["0 0 30px rgba(59,130,246,0.35)", "0 0 50px rgba(59,130,246,0.5)", "0 0 30px rgba(59,130,246,0.35)"] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              />
              <Zap size={18} />
              Try 3 Free Optimizations
            </motion.button>
            <motion.a
              href={GUMROAD}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-8 py-4 rounded-lg border border-white/14 text-white/65 font-black text-base"
              whileHover={{ borderColor: "rgba(255,255,255,0.28)", color: "#fff" }}
              whileTap={{ scale: 0.97 }}
            >
              $15 — Own It Forever
            </motion.a>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 px-8 py-6 flex items-center justify-between text-xs text-white/18">
        <div className="flex items-center gap-2 font-mono">
          <motion.span
            className="text-blue-400/60"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            TRI
          </motion.span>
          <span className="text-white/15">/</span>
          <motion.span
            className="text-emerald-400/60"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
          >
            TFM
          </motion.span>
          <span className="text-white/12 ml-1">· Triangular Flow Methodology</span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => navigate("/app")} className="hover:text-white/45 transition-colors">
            Launch App
          </button>
          <a href={GUMROAD} target="_blank" rel="noopener noreferrer" className="hover:text-white/45 transition-colors">
            Buy Lifetime
          </a>
        </div>
      </footer>
    </div>
  );
}
