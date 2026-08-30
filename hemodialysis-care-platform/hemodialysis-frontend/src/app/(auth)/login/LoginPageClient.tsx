'use client'

import { useState, useEffect, useRef } from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useMotionTemplate,
  useTransform,
  animate,
} from 'framer-motion'
import {
  Heart,
  Activity,
  BookOpen,
  Bell,
  Shield,
  TrendingUp,
  Zap,
  Sparkles,
} from 'lucide-react'
import { cn } from '@lib/utils/cn'
import { LoginForm } from '@features/auth/components/LoginForm'

// ─── Static particle config (deterministic — no hydration mismatch) ───────
const PARTICLES = [
  { left: '6%', size: 5, duration: 15, delay: 0 },
  { left: '16%', size: 3, duration: 19, delay: 2.2 },
  { left: '26%', size: 6, duration: 16, delay: 4.4 },
  { left: '37%', size: 4, duration: 21, delay: 1.1 },
  { left: '48%', size: 7, duration: 14, delay: 3.3 },
  { left: '60%', size: 3, duration: 20, delay: 5.5 },
  { left: '71%', size: 5, duration: 17, delay: 2.7 },
  { left: '82%', size: 4, duration: 22, delay: 0.6 },
  { left: '91%', size: 6, duration: 15, delay: 3.9 },
  { left: '12%', size: 3, duration: 24, delay: 6.6 },
  { left: '54%', size: 3, duration: 23, delay: 7.7 },
  { left: '77%', size: 4, duration: 18, delay: 8.8 },
]

// ─── Feature Item — با افکت مغناطیسی روی آیکون ─────────────────────────────
interface FeatureItemProps {
  icon: React.ReactNode
  title: string
  description: string
  delay?: number
  color: string
}

function FeatureItem({ icon, title, description, delay = 0, color }: FeatureItemProps) {
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const springX = useSpring(mx, { stiffness: 150, damping: 15 })
  const springY = useSpring(my, { stiffness: 150, damping: 15 })

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const cx = e.clientX - rect.left - rect.width / 2
    const cy = e.clientY - rect.top - rect.height / 2
    mx.set(cx * 0.25)
    my.set(cy * 0.25)
  }
  function handleMouseLeave() {
    mx.set(0)
    my.set(0)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 flex items-start gap-4 group"
    >
      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cn(
          'flex-shrink-0 w-[72px] h-[72px] rounded-[22px]',
          'flex items-center justify-center',
          'bg-white/15 border border-white/25',
          'backdrop-blur-md shadow-lg',
          'relative overflow-hidden',
          'group-hover:bg-white/25 group-hover:border-white/45',
          'group-hover:shadow-[0_0_32px_rgba(165,243,252,0.4)]',
          'transition-colors duration-500 ease-out'
        )}
      >
        {/* soft idle glow */}
        <motion.div
          className="absolute inset-0 rounded-[22px] bg-white/10"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: delay * 1.2 }}
        />
        <motion.span
          style={{ x: springX, y: springY }}
          className={cn('text-white relative z-10', color)}
        >
          {icon}
        </motion.span>
      </div>
      <div className="pt-2">
        <h4 className="text-white font-bold text-[16px] leading-tight">{title}</h4>
        <p className="text-white/85 text-[13px] mt-2 leading-relaxed max-w-[270px]">{description}</p>
      </div>
    </motion.div>
  )
}

// ─── Floating Orb — با قابلیت پارالاکس عمقی ────────────────────────────────
function FloatingOrb({
  size,
  color,
  position,
  delay,
  parallaxX,
  parallaxY,
  depth = 1,
}: {
  size: number
  color: string
  position: { top?: string; bottom?: string; left?: string; right?: string }
  delay: number
  parallaxX?: ReturnType<typeof useMotionValue<number>>
  parallaxY?: ReturnType<typeof useMotionValue<number>>
  depth?: number
}) {
  const x = useTransform(parallaxX ?? useMotionValue(0), (v) => v * depth)
  const y = useTransform(parallaxY ?? useMotionValue(0), (v) => v * depth)

  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        background: color,
        filter: 'blur(40px)',
        x,
        y,
        ...position,
      }}
      animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 4 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    />
  )
}

// ─── Aurora Mesh Background ─────────────────────────────────────────────────
function AuroraMesh() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute -top-1/4 -left-1/4 w-[75%] h-[75%] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.32) 0%, transparent 70%)', filter: 'blur(70px)' }}
        animate={{ x: [0, 50, -20, 0], y: [0, -30, 25, 0], scale: [1, 1.15, 0.92, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/3 -right-1/4 w-[65%] h-[65%] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(45,212,191,0.28) 0%, transparent 70%)', filter: 'blur(70px)' }}
        animate={{ x: [0, -35, 20, 0], y: [0, 35, -20, 0], scale: [1, 0.9, 1.12, 1] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      <motion.div
        className="absolute bottom-0 left-1/4 w-[55%] h-[55%] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(129,140,248,0.2) 0%, transparent 70%)', filter: 'blur(70px)' }}
        animate={{ x: [0, 25, -25, 0], y: [0, -25, 15, 0], scale: [1, 1.08, 0.95, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      />
    </div>
  )
}

// ─── Floating Particles — ذرات شناور، حس آرامش و زیستی ─────────────────────
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          className="absolute bottom-0 rounded-full bg-cyan-100/60"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            filter: 'blur(0.5px)',
            boxShadow: '0 0 6px 1px rgba(165,243,252,0.5)',
          }}
          animate={{ y: [0, -850], opacity: [0, 0.7, 0.7, 0] }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear',
            times: [0, 0.1, 0.85, 1],
          }}
        />
      ))}
    </div>
  )
}

// ─── Grain texture ──────────────────────────────────────────────────────────
function GrainOverlay() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.035] mix-blend-overlay pointer-events-none" aria-hidden="true">
      <filter id="grainFilter">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grainFilter)" />
    </svg>
  )
}

// ─── Pulse / ECG signature line (left panel) ───────────────────────────────
function PulseDivider({ delay = 0.9 }: { delay?: number }) {
  return (
    <svg viewBox="0 0 400 40" preserveAspectRatio="none" className="w-full h-8 opacity-45" aria-hidden="true">
      <motion.path
        d="M0 20 L130 20 L148 6 L164 34 L180 14 L192 20 L400 20"
        stroke="url(#pulseGradient)"
        strokeWidth="1.75"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.8, delay, ease: 'easeInOut' }}
      />
      <defs>
        <linearGradient id="pulseGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="35%" stopColor="rgba(165,243,252,0.9)" />
          <stop offset="55%" stopColor="rgba(255,255,255,0.95)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// ─── Traveling pulse dot ────────────────────────────────────────────────────
function TravelingPulse({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      className="absolute start-[27px] w-2.5 h-2.5 -translate-x-1/2 rtl:translate-x-1/2 rounded-full bg-cyan-200"
      style={{ boxShadow: '0 0 12px 4px rgba(165,243,252,0.7)' }}
      animate={{ top: ['4%', '96%', '4%'], opacity: [0, 1, 1, 0] }}
      transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay, times: [0, 0.5, 0.9, 1] }}
    />
  )
}

// ─── Live status badge ──────────────────────────────────────────────────────
function LiveStatusBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.1, duration: 0.6 }}
      className="flex items-center gap-2.5"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
      </span>
      <span className="text-white/80 text-xs font-medium">
        سیستم پایش هم‌اکنون به‌صورت زنده فعال است
      </span>
    </motion.div>
  )
}

// ─── Blur-to-focus text reveal ──────────────────────────────────────────────
function TextReveal({
  text,
  className,
  delay = 0,
  wordDelay = 0.08,
}: {
  text: string
  className?: string
  delay?: number
  wordDelay?: number
}) {
  const words = text.split(' ')
  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 14, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.65, delay: delay + i * wordDelay, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block"
        >
          {word}
          {i < words.length - 1 ? '\u00A0' : ''}
        </motion.span>
      ))}
    </span>
  )
}

// ─── Animated counter ───────────────────────────────────────────────────────
function AnimatedCounter({
  target,
  suffix = '',
  duration = 1.8,
  delay = 0.7,
}: {
  target: number
  suffix?: string
  duration?: number
  delay?: number
}) {
  const [display, setDisplay] = useState('۰')

  useEffect(() => {
    const controls = animate(0, target, {
      duration,
      delay,
      ease: 'easeOut',
      onUpdate(value) {
        setDisplay(Math.round(value).toLocaleString('fa-IR'))
      },
    })
    return () => controls.stop()
  }, [target, duration, delay])

  return (
    <p className="text-[28px] font-black text-white num-display leading-none tracking-tight">
      {display}
      {suffix}
    </p>
  )
}

// ─── Stats Strip ────────────────────────────────────────────────────────────
function StatItem({
  value,
  label,
  delay = 0,
  countTo,
  suffix,
}: {
  value: string
  label: string
  delay?: number
  countTo?: number
  suffix?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: 'backOut' }}
      className="text-center"
    >
      {countTo !== undefined ? (
        <AnimatedCounter target={countTo} suffix={suffix} delay={delay + 0.2} />
      ) : (
        <p className="text-[28px] font-black text-white num-display leading-none tracking-tight">{value}</p>
      )}
      <p className="text-white/65 text-xs mt-1.5">{label}</p>
    </motion.div>
  )
}

// ─── Rotating gradient border ───────────────────────────────────────────────
function AnimatedGradientBorder({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative rounded-3xl p-[1.5px] overflow-hidden">
      <motion.div
        className="absolute inset-[-60%]"
        style={{
          background:
            'conic-gradient(from 0deg, transparent 0%, rgba(56,189,248,0.9) 12%, transparent 26%, transparent 68%, rgba(45,212,191,0.9) 82%, transparent 96%)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
      />
      <div className="relative rounded-3xl overflow-hidden">{children}</div>
    </div>
  )
}

// ─── Tilt Card با انعکاس شیشه‌ای دنبال‌کننده‌ی موس ─────────────────────────
function TiltCard({ children }: { children: React.ReactNode }) {
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)

  const rotateX = useSpring(useTransform(py, [0, 1], [6, -6]), { stiffness: 180, damping: 22 })
  const rotateY = useSpring(useTransform(px, [0, 1], [-6, 6]), { stiffness: 180, damping: 22 })
  const glareX = useSpring(useTransform(px, (v) => v * 100), { stiffness: 100, damping: 20 })
  const glareY = useSpring(useTransform(py, (v) => v * 100), { stiffness: 100, damping: 20 })
  const glareBg = useMotionTemplate`radial-gradient(480px circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.35), transparent 60%)`

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    px.set((e.clientX - rect.left) / rect.width)
    py.set((e.clientY - rect.top) / rect.height)
  }
  function handleMouseLeave() {
    px.set(0.5)
    py.set(0.5)
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 1200 }}
      className="relative w-full max-w-md"
    >
      {children}
      <motion.div
        className="absolute inset-0 rounded-3xl pointer-events-none z-20 mix-blend-overlay"
        style={{ background: glareBg }}
      />
    </motion.div>
  )
}

// ─── Right Panel Live ECG — نوار ضربان متحرک و پررنگ، پشت کارت لاگین ───────
function RightPanelECG() {
  // یک الگوی ۴۰۰ واحدی که دقیقاً دو بار پشت‌سرهم تکرار شده تا اسکرول کاملاً
  // روان و بدون پرش باشه (تکنیک استاندارد لوپ بی‌نهایت با جابه‌جایی -50%)
  const path =
    'M0 20 L130 20 L148 6 L164 34 L180 14 L192 20 L400 20 ' +
    'L530 20 L548 6 L564 34 L580 14 L592 20 L800 20'

  return (
    <div className="absolute top-12 inset-x-0 h-14 overflow-hidden pointer-events-none opacity-[0.22]">
      <motion.svg
        viewBox="0 0 800 40"
        preserveAspectRatio="none"
        className="absolute h-full"
        style={{ width: '200%' }}
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
      >
        <defs>
          <linearGradient id="ecgLiveGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#0284c7" stopOpacity="1" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.15" />
          </linearGradient>
          <filter id="ecgGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d={path}
          stroke="url(#ecgLiveGradient)"
          strokeWidth="2.25"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#ecgGlow)"
        />
      </motion.svg>

      {/* محو شدن دو لبه برای حذف پرش بصری هنگام اسکرول */}
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent" />
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export function LoginPageClient() {
  // نور تعاملی روی پنل چپ (Spotlight)
  const spotX = useMotionValue(50)
  const spotY = useMotionValue(35)
  const springSpotX = useSpring(spotX, { stiffness: 60, damping: 22 })
  const springSpotY = useSpring(spotY, { stiffness: 60, damping: 22 })
  const spotlightBg = useMotionTemplate`radial-gradient(650px circle at ${springSpotX}% ${springSpotY}%, rgba(165,243,252,0.16), transparent 68%)`

  // پارالاکس عمقی برای اوربها و دایره‌های تزئینی
  const parallaxRawX = useMotionValue(0)
  const parallaxRawY = useMotionValue(0)
  const parallaxX = useSpring(parallaxRawX, { stiffness: 50, damping: 20 })
  const parallaxY = useSpring(parallaxRawY, { stiffness: 50, damping: 20 })

  function handlePanelMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    spotX.set(px * 100)
    spotY.set(py * 100)
    parallaxRawX.set((px - 0.5) * 40)
    parallaxRawY.set((py - 0.5) * 40)
  }

  return (
    <div className={cn('min-h-screen flex items-stretch', 'bg-gradient-main')}>
      {/* ════════════════════════════════════
          LEFT PANEL — Info & Branding
      ════════════════════════════════════ */}
      <div
        onMouseMove={handlePanelMouseMove}
        className={cn(
          'hidden lg:flex lg:w-[55%] xl:w-[58%]',
          'flex-col justify-between',
          'relative overflow-hidden p-10 xl:p-14'
        )}
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-hero" />
        {/* تیره‌تر برای کنتراست بهتر متن */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/55 via-slate-900/25 to-slate-950/50" />
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <GrainOverlay />

        <AuroraMesh />
        <FloatingParticles />

        {/* Interactive cursor spotlight */}
        <motion.div className="absolute inset-0 pointer-events-none" style={{ background: spotlightBg }} />

        {/* Decorative circles — با چرخش آروم و پارالاکس */}
        <div className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -top-32 -right-32 w-96 h-96 rounded-full border border-white/10"
            style={{ x: useTransform(parallaxX, (v) => v * 0.4), y: useTransform(parallaxY, (v) => v * 0.4) }}
            animate={{ rotate: 360 }}
            transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full border border-white/8"
            style={{ x: useTransform(parallaxX, (v) => v * -0.3), y: useTransform(parallaxY, (v) => v * -0.3) }}
            animate={{ rotate: -360 }}
            transition={{ duration: 110, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/5"
            animate={{ rotate: 360 }}
            transition={{ duration: 140, repeat: Infinity, ease: 'linear' }}
          />
        </div>

        {/* Floating Orbs — با عمق پارالاکس */}
        <FloatingOrb size={300} color="rgba(255,255,255,0.08)" position={{ top: '-10%', right: '-5%' }} delay={0} parallaxX={parallaxX} parallaxY={parallaxY} depth={0.5} />
        <FloatingOrb size={200} color="rgba(20,184,166,0.2)" position={{ bottom: '20%', left: '-5%' }} delay={1.5} parallaxX={parallaxX} parallaxY={parallaxY} depth={0.9} />
        <FloatingOrb size={150} color="rgba(56,189,248,0.15)" position={{ top: '40%', right: '10%' }} delay={3} parallaxX={parallaxX} parallaxY={parallaxY} depth={1.2} />

        <div className="relative z-10 flex flex-col h-full gap-8">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-4"
          >
            <motion.div
              whileHover={{ scale: 1.06 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              className={cn(
                'w-[70px] h-[70px] rounded-2xl',
                'flex items-center justify-center',
                'bg-white/20 border border-white/30',
                'backdrop-blur-sm shadow-xl',
                'relative overflow-hidden'
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
              <Heart className="h-9 w-9 text-white relative z-10" strokeWidth={1.5} />
              {/* Lub-dub heartbeat glow — ریتم واقعی ضربان قلب */}
              <motion.div
                className="absolute inset-0 rounded-2xl bg-white/25"
                animate={{ scale: [1, 1.35, 1, 1.28, 1], opacity: [0.55, 0, 0.5, 0, 0.55] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', times: [0, 0.15, 0.3, 0.45, 1] }}
              />
            </motion.div>
            <div>
              <h1 className="text-2xl font-black text-white leading-tight">سامانه پایش دیالیز</h1>
              <p className="text-white/80 text-sm mt-1">مدیریت هوشمند روند درمان</p>
            </div>
          </motion.div>

          {/* Hero Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="space-y-5"
          >
            <div className="relative inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-4 py-1.5 backdrop-blur-sm">
              <Zap className="h-4 w-4 text-yellow-300" />
              <span className="text-white/95 text-xs font-medium">هوش مصنوعی در خدمت سلامت</span>
              {/* Sparkle accent */}
              <motion.span
                className="absolute -top-1.5 -left-1.5 text-cyan-200"
                animate={{ opacity: [0, 1, 0], scale: [0.6, 1, 0.6], rotate: [0, 25, 0] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              >
                <Sparkles className="h-3.5 w-3.5" />
              </motion.span>
            </div>

            <h2 className="text-4xl xl:text-5xl font-black text-white leading-tight">
              <TextReveal text="پایش مستمر" delay={0.35} />
              <br />
              <motion.span
                className="text-transparent bg-clip-text bg-[length:200%_auto]"
                style={{
                  backgroundImage:
                    'linear-gradient(90deg, #ffffff 0%, #a5f3fc 30%, #67e8f9 50%, #a5f3fc 70%, #ffffff 100%)',
                }}
                initial={{ opacity: 0, y: 14, filter: 'blur(10px)' }}
                animate={{
                  opacity: 1,
                  y: 0,
                  filter: 'blur(0px)',
                  backgroundPosition: ['0% 50%', '200% 50%'],
                }}
                transition={{
                  opacity: { duration: 0.65, delay: 0.7 },
                  y: { duration: 0.65, delay: 0.7 },
                  filter: { duration: 0.65, delay: 0.7 },
                  backgroundPosition: { duration: 6, repeat: Infinity, ease: 'linear', delay: 1.2 },
                }}
              >
                بیماران دیالیزی
              </motion.span>
            </h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55 }}
              className="text-white/85 text-base leading-relaxed max-w-md"
            >
              سامانه‌ای یکپارچه برای مانیتورینگ، آموزش و مدیریت هوشمند روند درمان بیماران همودیالیز
            </motion.p>

            <PulseDivider />
            <LiveStatusBadge />
          </motion.div>

          {/* Features */}
          <div className="relative space-y-6 ps-1">
            <div className="absolute start-[27px] top-8 bottom-8 w-px bg-gradient-to-b from-cyan-200/50 via-white/20 to-transparent" />
            <TravelingPulse />
            <FeatureItem
              icon={<Activity className="h-8 w-8" />}
              title="مانیتورینگ مستمر"
              description="پایش لحظه‌ای وزن، فشار خون و نتایج آزمایش‌ها با تحلیل هوشمند"
              color="text-cyan-200"
              delay={0.3}
            />
            <FeatureItem
              icon={<Bell className="h-8 w-8" />}
              title="هشدار به موقع"
              description="شناسایی خودکار ناهنجاری‌ها و ارسال هشدار سه‌سطحی برای تیم درمان"
              color="text-amber-200"
              delay={0.4}
            />
            <FeatureItem
              icon={<BookOpen className="h-8 w-8" />}
              title="آموزش شخصی‌سازی‌شده"
              description="محتوای آموزشی متناسب با وضعیت هر بیمار، تأییدشده توسط پزشک"
              color="text-teal-200"
              delay={0.5}
            />
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className={cn(
              'flex items-center justify-around',
              'bg-white/10 border border-white/15',
              'rounded-2xl px-6 py-6 backdrop-blur-md',
              'shadow-[0_8px_30px_rgba(0,0,0,0.15)]',
              'relative overflow-hidden'
            )}
          >
            {/* شاین ملایم روی نوار آمار */}
            <motion.div
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
              animate={{ x: ['-120%', '220%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 3 }}
            />
            <StatItem value="۱۰۰۰+" countTo={1000} suffix="+" label="بیمار تحت پایش" delay={0.7} />
            <div className="w-px h-10 bg-white/20" />
            <StatItem value="3 سطح" label="هشدار بالینی" delay={0.8} />
            <div className="w-px h-10 bg-white/20" />
            <StatItem value="۲۴/۷" label="مانیتورینگ" delay={0.9} />
          </motion.div>
        </div>
      </div>

      {/* ════════════════════════════════════
          RIGHT PANEL — Login Form
      ════════════════════════════════════ */}
      <div
        className={cn(
          'flex-1 lg:w-[45%] xl:w-[42%]',
          'flex flex-col items-center justify-center',
          'p-6 sm:p-8 lg:p-12 xl:p-16',
          'relative overflow-hidden'
        )}
      >
        <div className="absolute inset-0 glow-center opacity-50 pointer-events-none" />

        {/* نوار ضربان زنده — پررنگ، آبی، با حرکت پیوسته مثل مانیتور بیمارستانی */}
        <RightPanelECG />

        {/* واترمارک بزرگ Activity در پس‌زمینه — چرخش خیلی آروم */}
        <motion.div
          className="absolute -bottom-16 -left-16 text-primary-500/[0.04] pointer-events-none"
          animate={{ rotate: 360 }}
          transition={{ duration: 180, repeat: Infinity, ease: 'linear' }}
        >
          <Activity size={280} strokeWidth={1} />
        </motion.div>

        {/* Mobile Logo */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:hidden flex items-center gap-3 mb-10"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-azure flex items-center justify-center shadow-glow-sm">
            <Heart className="h-7 w-7 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-base font-black text-text-primary">سامانه پایش دیالیز</h1>
            <p className="text-xs text-text-muted">مدیریت هوشمند روند درمان</p>
          </div>
        </motion.div>

        {/* Form Card — با تیلت سه‌بعدی، حاشیه‌ی گرادیانت چرخان و انعکاس شیشه‌ای */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md"
        >
          <TiltCard>
            <div
              className="absolute -inset-4 rounded-3xl opacity-30"
              style={{ background: 'radial-gradient(ellipse at center, rgba(14,165,233,0.15) 0%, transparent 70%)' }}
            />

            <AnimatedGradientBorder>
              <div
                className={cn('relative bg-white rounded-3xl', 'shadow-xl p-8 sm:p-10', 'overflow-hidden')}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* شیمر بالای کارت */}
                <div className="absolute top-0 inset-x-0 h-0.5 overflow-hidden">
                  <motion.div
                    className="h-full w-1/2 bg-gradient-to-r from-transparent via-primary-400 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
                  />
                </div>

                <div className="absolute top-0 right-0 w-64 h-64 bg-glow-top-right opacity-40 pointer-events-none" />

                <div className="relative z-10">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mb-8"
                  >
                    <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-full px-3.5 py-1.5 mb-4">
                      <Shield className="h-4 w-4 text-primary-500" />
                      <span className="text-primary-700 text-xs font-semibold">ورود امن</span>
                    </div>

                    <h2 className="text-[28px] font-black text-text-primary leading-tight">خوش آمدید</h2>
                    <p className="text-text-muted text-sm mt-1.5 leading-relaxed">
                      برای ادامه، اطلاعات ورود خود را وارد کنید
                    </p>
                  </motion.div>

                  <LoginForm />

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 pt-6 border-t border-border-subtle"
                  >
                    <div className="flex items-center justify-center gap-6">
                      {[
                        { icon: Shield, label: 'اتصال امن' },
                        { icon: TrendingUp, label: 'داده‌های به‌روز' },
                        { icon: Heart, label: 'مراقبت ۲۴/۷' },
                      ].map(({ icon: Icon, label }, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-text-muted">
                          <Icon className="h-4 w-4 text-primary-400" />
                          <span className="text-xs">{label}</span>
                        </div>
                      ))}
                    </div>

                    <p className="text-center text-[11px] text-text-disabled mt-4">
                      © ۱۴۰۴ سامانه پایش دیالیز — تمام حقوق محفوظ است
                    </p>
                  </motion.div>
                </div>
              </div>
            </AnimatedGradientBorder>
          </TiltCard>
        </motion.div>
      </div>
    </div>
  )
}