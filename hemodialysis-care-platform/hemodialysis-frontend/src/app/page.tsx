// src/app/page.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useSpring, useInView, AnimatePresence, useMotionValue } from 'motion/react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial, Float, Stars, Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { gsap } from 'gsap'
import Link from 'next/link'
import { Activity, Heart, Shield, Brain, Zap, ChevronDown, ArrowLeft, Users, Bell, TrendingUp, Award, Lock, Cpu, Droplets, Scale } from 'lucide-react'

// ============================================================
// THREE.JS COMPONENTS
// ============================================================

function AnimatedSphere() {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (!meshRef.current) return
    meshRef.current.rotation.x = state.clock.elapsedTime * 0.15
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.2
    meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.15
  })

  return (
    <Float speed={2} rotationIntensity={0.4} floatIntensity={0.6}>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.08 : 1}
      >
        <Sphere args={[1.6, 128, 128]}>
          <MeshDistortMaterial
            color="#0EA5E9"
            attach="material"
            distort={hovered ? 0.55 : 0.38}
            speed={hovered ? 3 : 1.8}
            roughness={0}
            metalness={0.15}
            transparent
            opacity={0.82}
            emissive="#0EA5E9"
            emissiveIntensity={0.18}
          />
        </Sphere>
      </mesh>
    </Float>
  )
}

function FloatingParticles() {
  const ref = useRef<THREE.Points>(null)
  const count = 1800

  const positions = useRef(
    new Float32Array(Array.from({ length: count * 3 }, () => (Math.random() - 0.5) * 22))
  )

  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.x = state.clock.elapsedTime * 0.025
    ref.current.rotation.y = state.clock.elapsedTime * 0.035
  })

  return (
    <Points ref={ref} positions={positions.current} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#38BDF8" size={0.028} sizeAttenuation depthWrite={false} opacity={0.55} />
    </Points>
  )
}

function Scene3D() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1.2} color="#0EA5E9" />
      <pointLight position={[-10, -10, -5]} intensity={0.6} color="#06B6D4" />
      <spotLight position={[0, 8, 0]} intensity={0.8} color="#14B8A6" angle={0.4} />
      <Stars radius={100} depth={50} count={3000} factor={3} saturation={0.5} fade speed={0.6} />
      <FloatingParticles />
      <AnimatedSphere />
    </>
  )
}

// ============================================================
// CURSOR FOLLOWER
// ============================================================

function CursorFollower() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const cursorDotRef = useRef<HTMLDivElement>(null)
  const pos = useRef({ x: 0, y: 0 })
  const dot = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const move = (e: MouseEvent) => { pos.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener('mousemove', move)
    let raf: number
    const animate = () => {
      dot.current.x += (pos.current.x - dot.current.x) * 0.12
      dot.current.y += (pos.current.y - dot.current.y) * 0.12
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${pos.current.x - 20}px, ${pos.current.y - 20}px)`
      }
      if (cursorDotRef.current) {
        cursorDotRef.current.style.transform = `translate(${dot.current.x - 4}px, ${dot.current.y - 4}px)`
      }
      raf = requestAnimationFrame(animate)
    }
    animate()
    return () => { window.removeEventListener('mousemove', move); cancelAnimationFrame(raf) }
  }, [])

  return (
    <>
      <div ref={cursorRef} className="fixed top-0 left-0 w-10 h-10 rounded-full border-2 border-primary-400 pointer-events-none z-[9999] mix-blend-difference" style={{ willChange: 'transform' }} />
      <div ref={cursorDotRef} className="fixed top-0 left-0 w-2 h-2 rounded-full bg-primary-400 pointer-events-none z-[9999]" style={{ willChange: 'transform' }} />
    </>
  )
}

// ============================================================
// ANIMATED COUNTER
// ============================================================

function AnimatedCounter({ target, suffix = '', duration = 2 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = target / (duration * 60)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else { setCount(Math.floor(start)) }
    }, 1000 / 60)
    return () => clearInterval(timer)
  }, [inView, target, duration])

  return <span ref={ref}>{count.toLocaleString('fa-IR')}{suffix}</span>
}

// ============================================================
// MAGNETIC BUTTON
// ============================================================

function MagneticButton({ children, className, onClick, href }: { children: React.ReactNode; className?: string; onClick?: () => void; href?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 200, damping: 15 })
  const springY = useSpring(y, { stiffness: 200, damping: 15 })

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    x.set((e.clientX - rect.left - rect.width / 2) * 0.35)
    y.set((e.clientY - rect.top - rect.height / 2) * 0.35)
  }

  const handleMouseLeave = () => { x.set(0); y.set(0) }

  const content = (
    <motion.div ref={ref} style={{ x: springX, y: springY }} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} onClick={onClick} className={className} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
      {children}
    </motion.div>
  )

  if (href) return <Link href={href}>{content}</Link>
  return content
}

// ============================================================
// GLITCH TEXT
// ============================================================

function GlitchText({ text, className }: { text: string; className?: string }) {
  const [glitch, setGlitch] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitch(true)
      setTimeout(() => setGlitch(false), 200)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <span className={`relative inline-block ${className ?? ''}`}>
      <span className={glitch ? 'opacity-0' : 'opacity-100'} style={{ transition: 'opacity 0.05s' }}>{text}</span>
      {glitch && (
        <>
          <span className="absolute inset-0 text-cyan-400" style={{ clipPath: 'polygon(0 20%, 100% 20%, 100% 40%, 0 40%)', transform: 'translateX(-3px)' }}>{text}</span>
          <span className="absolute inset-0 text-rose-400" style={{ clipPath: 'polygon(0 60%, 100% 60%, 100% 80%, 0 80%)', transform: 'translateX(3px)' }}>{text}</span>
        </>
      )}
    </span>
  )
}

// ============================================================
// HEARTBEAT LINE
// ============================================================

function HeartbeatLine() {
  const pathRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    if (!pathRef.current) return
    const length = pathRef.current.getTotalLength()
    gsap.set(pathRef.current, { strokeDasharray: length, strokeDashoffset: length })
    gsap.to(pathRef.current, { strokeDashoffset: 0, duration: 2.5, ease: 'power2.inOut', repeat: -1, repeatDelay: 1 })
  }, [])

  return (
    <svg viewBox="0 0 400 80" className="w-full h-16" preserveAspectRatio="none">
      <defs>
        <linearGradient id="ecgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0" />
          <stop offset="30%" stopColor="#0EA5E9" />
          <stop offset="70%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#14B8A6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path ref={pathRef} d="M0,40 L60,40 L80,10 L100,70 L120,5 L140,75 L160,40 L200,40 L220,20 L240,60 L260,40 L400,40" fill="none" stroke="url(#ecgGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ============================================================
// FEATURE CARD
// ============================================================

function FeatureCard({ icon: Icon, title, description, gradient, delay, index }: { icon: any; title: string; description: string; gradient: string; delay: number; index: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [hovered, setHovered] = useState(false)
  const gradColor = gradient.split(' ')[1] ?? '#0EA5E9'

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 50 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }} onHoverStart={() => setHovered(true)} onHoverEnd={() => setHovered(false)} className="relative group cursor-pointer">
      <motion.div animate={hovered ? { rotateY: 4, rotateX: -4, scale: 1.02 } : { rotateY: 0, rotateX: 0, scale: 1 }} transition={{ duration: 0.3 }} className="relative bg-[#0A1628]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 h-full overflow-hidden">
        <motion.div animate={hovered ? { opacity: 1, scale: 1.5 } : { opacity: 0, scale: 1 }} transition={{ duration: 0.4 }} className="absolute inset-0 rounded-2xl" style={{ background: `radial-gradient(circle at 50% 50%, ${gradColor}20, transparent 70%)` }} />
        <div className="absolute top-4 right-4 text-5xl font-black text-white/5 select-none">{String(index + 1).padStart(2, '0')}</div>
        <motion.div animate={hovered ? { scale: 1.15, rotate: 8 } : { scale: 1, rotate: 0 }} transition={{ duration: 0.3 }} className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} mb-4`}>
          <Icon className="w-6 h-6 text-white" />
        </motion.div>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-white/60 text-sm leading-relaxed">{description}</p>
        <motion.div animate={hovered ? { scaleX: 1 } : { scaleX: 0 }} transition={{ duration: 0.3 }} className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${gradient} origin-left`} />
      </motion.div>
    </motion.div>
  )
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({ value, suffix, label, icon: Icon, color, delay }: { value: number; suffix?: string; label: string; icon: any; color: string; delay: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  return (
    <motion.div ref={ref} initial={{ opacity: 0, scale: 0.8, y: 30 }} animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}} transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }} whileHover={{ y: -6, scale: 1.03 }} className="relative bg-[#0A1628]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center overflow-hidden group">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(circle at 50% 0%, ${color}15, transparent 70%)` }} />
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4" style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <div className="text-4xl font-black text-white mb-1"><AnimatedCounter target={value} suffix={suffix} /></div>
      <div className="text-white/50 text-sm">{label}</div>
    </motion.div>
  )
}

// ============================================================
// NAVBAR
// ============================================================

function Navbar() {
  const { scrollY } = useScroll()
  const bgOpacity = useTransform(scrollY, [0, 100], [0, 0.95])

  return (
    <motion.nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <motion.div style={{ opacity: bgOpacity }} className="absolute inset-0 bg-[#030B1A] border-b border-white/5 backdrop-blur-xl" />
      <div className="relative max-w-7xl mx-auto flex items-center justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="flex items-center gap-3">
          <div className="relative w-9 h-9">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary-400 to-cyan-500 opacity-80" />
            <div className="absolute inset-0 rounded-xl flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-primary-400 to-cyan-500 opacity-30 blur-sm" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">دیالیز<span className="text-primary-400">کر</span></span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="hidden md:flex items-center gap-8">
          {['ویژگی‌ها', 'آمار', 'درباره ما'].map((item) => (
            <motion.a key={item} href={`#section-${item}`} className="text-white/60 hover:text-white text-sm transition-colors relative group" whileHover={{ y: -1 }}>
              {item}
              <span className="absolute -bottom-0.5 left-0 right-0 h-px bg-primary-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />
            </motion.a>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
          <Link href="/login">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="relative px-5 py-2.5 rounded-xl text-sm font-medium text-white overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-cyan-500 rounded-xl" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
              <span className="relative">ورود به سامانه</span>
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </motion.nav>
  )
}

// ============================================================
// FLOATING DATA CARD
// ============================================================

function FloatingDataCard({ delay, className, children }: { delay: number; className?: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 30, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }} whileHover={{ scale: 1.04, y: -4 }} className={`backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 shadow-[0_8px_32px_rgba(14,165,233,0.2)] ${className ?? ''}`}>
      {children}
    </motion.div>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function LandingPage() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0])
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -80])

  const features = [
    { icon: Brain, title: 'تحلیل هوشمند', description: 'موتور هوش مصنوعی مبتنی بر قوانین پزشکی، داده‌های بالینی را آنی تحلیل می‌کند', gradient: 'from-violet-500 to-purple-600' },
    { icon: Activity, title: 'مانیتورینگ بلادرنگ', description: 'پایش مستمر وزن، فشار خون، آزمایش‌ها و علائم بیمار با هشدارهای سه‌سطحی', gradient: 'from-primary-500 to-cyan-500' },
    { icon: Shield, title: 'امنیت پزشکی', description: 'رمزنگاری کامل داده‌ها، کنترل دسترسی نقش‌محور و ثبت کامل فعالیت‌ها', gradient: 'from-emerald-500 to-teal-600' },
    { icon: Bell, title: 'هشدار فوری', description: 'تشخیص خودکار الگوهای خطرناک و ارسال هشدار فوری به تیم درمانی', gradient: 'from-orange-500 to-rose-500' },
    { icon: TrendingUp, title: 'تحلیل روند', description: 'بررسی روندهای بلندمدت و شناسایی الگوهای نگران‌کننده قبل از بحران', gradient: 'from-cyan-500 to-blue-600' },
    { icon: Award, title: 'آموزش شخصی', description: 'محتوای آموزشی کاملاً شخصی‌سازی‌شده بر اساس وضعیت بالینی هر بیمار', gradient: 'from-amber-500 to-orange-500' },
  ]

  const stats = [
    { value: 1000, suffix: '+', label: 'بیمار تحت پایش', icon: Users, color: '#0EA5E9' },
    { value: 98, suffix: '%', label: 'دقت تشخیص', icon: Cpu, color: '#06B6D4' },
    { value: 24, suffix: '/7', label: 'پشتیبانی مستمر', icon: Shield, color: '#14B8A6' },
    { value: 65, suffix: '%', label: 'کاهش مراجعات اورژانس', icon: TrendingUp, color: '#22C55E' },
  ]

  const roles = [
    {
      role: 'بیمار', icon: Heart, color: '#0EA5E9',
      items: ['ثبت علائم روزانه', 'مصرف مایعات', 'مشاهده روند درمان', 'دریافت آموزش شخصی', 'پیام از تیم درمانی'],
    },
    {
      role: 'کلینیسین', icon: Activity, color: '#06B6D4',
      items: ['ثبت جلسات دیالیز', 'ثبت آزمایش‌ها', 'مشاهده هشدارها', 'تأیید توصیه‌ها', 'مدیریت بیماران'],
    },
    {
      role: 'ادمین', icon: Lock, color: '#14B8A6',
      items: ['مدیریت کاربران', 'گزارش فعالیت‌ها', 'وضعیت سیستم', 'تنظیم دسترسی‌ها', 'لاگ کامل'],
    },
  ]

  return (
    <div className="relative bg-[#030B1A] text-white overflow-x-hidden" dir="rtl">
      {/* Progress Bar */}
      <motion.div style={{ scaleX }} className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 via-cyan-400 to-teal-400 z-[100] origin-left" />

      <CursorFollower />
      <Navbar />

      {/* ===================== HERO ===================== */}
      <motion.section style={{ y: heroY, opacity: heroOpacity }} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* 3D Canvas */}
        <div className="absolute inset-0">
          <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
            <Scene3D />
          </Canvas>
        </div>

        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#030B1A]/30 via-transparent to-[#030B1A]" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(14,165,233,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #0EA5E9 0%, transparent 70%)' }} />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary-500/40 bg-primary-500/10 backdrop-blur-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
            <span className="text-primary-300 text-sm font-medium">نسل جدید مانیتورینگ همودیالیز</span>
          </motion.div>

          <div className="mb-6 space-y-2">
            <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }} className="text-6xl md:text-8xl font-black leading-none tracking-tight">
              مراقبت
            </motion.h1>
            <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="text-6xl md:text-8xl font-black leading-none tracking-tight">
              <span className="relative">
                <span className="bg-gradient-to-r from-primary-400 via-cyan-300 to-teal-300 bg-clip-text text-transparent">هوشمند</span>
                <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.8, delay: 1.2 }} className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary-400 to-cyan-400 origin-right rounded-full" />
              </span>
            </motion.h1>
            <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="text-6xl md:text-8xl font-black leading-none tracking-tight text-white/20">
              <GlitchText text="برای هر بیمار" />
            </motion.h1>
          </div>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5 }} className="text-white/50 text-xl max-w-2xl mx-auto leading-relaxed mb-12">
            پلتفرم پیشرفته پایش بالینی بیماران همودیالیز با موتور تحلیل هوشمند، هشدارهای لحظه‌ای و آموزش‌های شخصی‌سازی‌شده
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.7 }} className="flex items-center justify-center gap-4 mb-20">
            <Link href="/login">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="relative px-8 py-4 rounded-2xl text-base font-bold text-white overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-cyan-500 rounded-2xl" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15), transparent 70%)' }} />
                <span className="relative flex items-center gap-2">شروع کنید <ArrowLeft className="w-4 h-4" /></span>
              </motion.button>
            </Link>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="px-8 py-4 rounded-2xl text-base font-bold text-white/80 border border-white/20 backdrop-blur-sm hover:border-primary-400/60 hover:text-white transition-colors duration-300">
              مشاهده دمو
            </motion.button>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 1 }} className="max-w-lg mx-auto mb-16">
            <HeartbeatLine />
          </motion.div>

          <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} className="flex flex-col items-center gap-2 text-white/40">
            <span className="text-xs tracking-widest uppercase">اسکرول</span>
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </div>

        {/* Floating Cards */}
        <FloatingDataCard delay={1.2} className="absolute top-1/3 right-8 md:right-24 w-52 hidden lg:block">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-primary-500/30 flex items-center justify-center">
              <Scale className="w-3.5 h-3.5 text-primary-300" />
            </div>
            <span className="text-white/70 text-xs">وزن بیمار</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">83.2 <span className="text-sm font-normal text-white/40">kg</span></div>
          <div className="text-xs text-amber-400 flex items-center gap-1"><span>↑</span> IDWG: 4.2% هشدار</div>
          <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: '72%' }} transition={{ delay: 1.8, duration: 1 }} className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full" />
          </div>
        </FloatingDataCard>

        <FloatingDataCard delay={1.4} className="absolute top-1/2 left-8 md:left-24 w-52 hidden lg:block">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-rose-500/30 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-rose-300" />
            </div>
            <span className="text-white/70 text-xs">فشار خون</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">130<span className="text-white/40 font-normal">/</span>85 <span className="text-sm font-normal text-white/40">mmHg</span></div>
          <div className="flex gap-2 mt-2">
            {['قبل', 'حین', 'بعد'].map((l, i) => (
              <div key={l} className="flex-1 text-center">
                <div className="text-xs text-white/40 mb-1">{l}</div>
                <div className="h-6 rounded-sm" style={{ background: `rgba(14,165,233,${0.3 + i * 0.2})`, transform: `scaleY(${0.6 + i * 0.2})` }} />
              </div>
            ))}
          </div>
        </FloatingDataCard>

        <FloatingDataCard delay={1.6} className="absolute bottom-1/4 right-12 md:right-32 w-48 hidden xl:block">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/60">پتاسیم (K)</span>
            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">بحرانی</span>
          </div>
          <div className="text-3xl font-black text-red-400 mb-0.5">6.2</div>
          <div className="text-xs text-white/40">mEq/L — مرجع: 3.5-5.0</div>
        </FloatingDataCard>
      </motion.section>

      {/* ===================== FEATURES ===================== */}
      <section id="section-ویژگی‌ها" className="relative py-32 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-32 bg-gradient-to-b from-transparent to-primary-500/50" />
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-6">
              <Zap className="w-4 h-4 text-primary-400" />
              <span className="text-white/60 text-sm">قابلیت‌های کلیدی</span>
            </motion.div>
            <motion.h2 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1 }} className="text-5xl md:text-6xl font-black mb-6">
              همه چیز در <span className="bg-gradient-to-r from-primary-400 to-cyan-300 bg-clip-text text-transparent">یک پلتفرم</span>
            </motion.h2>
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.3 }} className="text-white/40 text-lg max-w-xl mx-auto">
              از ثبت داده تا تحلیل هوشمند، از هشدار تا درمان — همه در یک سیستم یکپارچه
            </motion.p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => <FeatureCard key={f.title} {...f} delay={i * 0.08} index={i} />)}
          </div>
        </div>
      </section>

      {/* ===================== STATS ===================== */}
      <section id="section-آمار" className="relative py-28 px-6">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">اعداد واقعی، <span className="text-white/30">نتایج واقعی</span></h2>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {stats.map((s, i) => <StatCard key={s.label} {...s} delay={i * 0.1} />)}
          </div>
        </div>
      </section>

      {/* ===================== ROLES ===================== */}
      <section className="relative py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <motion.h2 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="text-4xl md:text-5xl font-black mb-4">
              چه کسانی استفاده می‌کنند؟
            </motion.h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roles.map((role, i) => {
              const Icon = role.icon
              return (
                <motion.div key={role.role} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.15 }} whileHover={{ y: -8 }} className="relative bg-[#0A1628]/80 border border-white/10 rounded-2xl p-7 group overflow-hidden">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" style={{ background: `radial-gradient(circle at 50% 0%, ${role.color}12, transparent 70%)` }} />
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `linear-gradient(90deg, transparent, ${role.color}, transparent)` }} />
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${role.color}20`, border: `1px solid ${role.color}40` }}>
                      <Icon className="w-5 h-5" style={{ color: role.color }} />
                    </div>
                    <h3 className="text-xl font-bold">{role.role}</h3>
                  </div>
                  <ul className="space-y-3">
                    {role.items.map((item, j) => (
                      <motion.li key={item} initial={{ opacity: 0, x: 10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 + j * 0.07 }} className="flex items-center gap-3 text-sm text-white/60">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: role.color }} />
                        {item}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===================== CTA ===================== */}
      <section className="relative py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#030B1A]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)' }} />
        <div className="relative max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary-500/30 bg-primary-500/10 mb-8">
              <span className="text-primary-300 text-sm">آماده شروع هستید؟</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              سلامت بیماران را<br />
              <span className="bg-gradient-to-r from-primary-400 via-cyan-300 to-teal-300 bg-clip-text text-transparent">متحول کنید</span>
            </h2>
            <p className="text-white/40 text-lg mb-12 leading-relaxed">همین امروز شروع کنید و شاهد تحول در مراقبت از بیماران دیالیزی باشید</p>
            <Link href="/login">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="relative px-10 py-5 rounded-2xl text-lg font-bold text-white overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-cyan-500 rounded-2xl" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.18), transparent)' }} />
                <span className="relative flex items-center gap-2">ورود به سامانه <ArrowLeft className="w-5 h-5" /></span>
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="relative border-t border-white/5 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-400 to-cyan-500 flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white/60 text-sm">دیالیزکر — سامانه مانیتورینگ همودیالیز</span>
          </div>
          <p className="text-white/30 text-sm">© ۱۴۰۴ — تمامی حقوق محفوظ است</p>
        </div>
      </footer>

      <style jsx global>{`
        * { cursor: none !important; }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  )
}