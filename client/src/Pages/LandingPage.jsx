"use client"

import React, { useEffect, useState, useRef, useCallback } from "react"
import {
  Menu,
  X,
  Search,
  Star,
  Zap,
  Clock,
  CheckCircle,
  ChevronRight,
  ArrowRight,
  MapPin,
  Mail,
  Phone,
  Facebook,
  Instagram,
  Linkedin,
} from "lucide-react"
import { useNavigate } from 'react-router-dom'; // Added for navigation

/* ─────────────────────────────────────────────
   UTILITIES
   ───────────────────────────────────────────── */

function cn(...classes) {
  return classes.filter(Boolean).join(" ")
}

function scrollTo(id) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
}

/* ─────────────────────────────────────────────
   REVEAL ANIMATION HOOK + COMPONENT
   ───────────────────────────────────────────── */

function useReveal(threshold = 0.15) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

const origins = {
  up: "translateY(36px)",
  left: "translateX(-36px)",
  right: "translateX(36px)",
  scale: "scale(0.94)",
}

function Reveal({ children, delay = 0, dir = "up", className }) {
  const { ref, visible } = useReveal()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : origins[dir],
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

/* ─────────────────────────────────────────────
   ORB CANVAS (background animation)
   ───────────────────────────────────────────── */

function OrbCanvas() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    let animId
    let W, H
    const resize = () => {
      W = canvas.width = canvas.offsetWidth
      H = canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener("resize", resize)
    const orbs = [
      { x: 0.75, y: 0.25, r: 280, vx: 0.15, vy: 0.08, opacity: 0.14 },
      { x: 0.15, y: 0.7, r: 200, vx: -0.1, vy: -0.12, opacity: 0.1 },
      { x: 0.55, y: 0.55, r: 150, vx: 0.18, vy: -0.07, opacity: 0.08 },
      { x: 0.85, y: 0.75, r: 120, vx: -0.14, vy: 0.1, opacity: 0.06 },
      { x: 0.3, y: 0.2, r: 90, vx: 0.12, vy: 0.14, opacity: 0.05 },
    ].map((o) => ({ ...o, x: o.x * W, y: o.y * H }))

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      orbs.forEach((orb) => {
        if (orb.x - orb.r < 0 || orb.x + orb.r > W) orb.vx *= -1
        if (orb.y - orb.r < 0 || orb.y + orb.r > H) orb.vy *= -1
        orb.x += orb.vx
        orb.y += orb.vy
        const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r)
        grad.addColorStop(0, `rgba(255, 103, 0, ${orb.opacity})`)
        grad.addColorStop(0.5, `rgba(255, 103, 0, ${orb.opacity * 0.35})`)
        grad.addColorStop(1, "rgba(255, 103, 0, 0)")
        ctx.beginPath()
        ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
      })
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("resize", resize)
    }
  }, [])
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />
}

/* ─────────────────────────────────────────────
   HERO IMAGE SLIDESHOW COMPONENT
   ───────────────────────────────────────────── */

const heroSlides = [
  {
    src: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1000&auto=format&fit=crop",
    alt: "Personal trainer helping a client during a workout session",
  },
  {
    src: "https://images.unsplash.com/photo-1549576490-b0b4831ef60a?q=80&w=1000&auto=format&fit=crop",
    alt: "Group fitness class with high energy",
  },
  {
    src: "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1000&auto=format&fit=crop",
    alt: "Yoga session at sunset with a trainer",
  },
  {
    src: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1000&auto=format&fit=crop",
    alt: "Intense gym training with weights",
  },
  {
    src: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1000&auto=format&fit=crop",
    alt: "Peaceful yoga practice in nature",
  },
]

function HeroSlideshow() {
  const [current, setCurrent] = useState(0)
  const [next, setNext] = useState(1)
  const [transitioning, setTransitioning] = useState(false)
  const timerRef = useRef(null)

  const goToSlide = useCallback(
    (index) => {
      if (index === current || transitioning) return
      setTransitioning(true)
      setNext(index)
      setTimeout(() => {
        setCurrent(index)
        setTransitioning(false)
      }, 1000)
    },
    [current, transitioning]
  )

  useEffect(() => {
    timerRef.current = setInterval(() => {
      const nextIndex = (current + 1) % heroSlides.length
      goToSlide(nextIndex)
    }, 4000)

    return () => clearInterval(timerRef.current)
  }, [current, goToSlide])

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden">
      {heroSlides.map((slide, i) => (
        <img
          key={i}
          src={slide.src}
          alt={slide.alt}
          crossOrigin="anonymous"
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: i === current ? (transitioning ? 0 : 1) : i === next && transitioning ? 1 : 0,
            transition: "opacity 1s ease-in-out",
            zIndex: i === current ? 2 : i === next ? 1 : 0,
          }}
        />
      ))}
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent z-[3] pointer-events-none" />
      {/* Progress indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {heroSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => goToSlide(i)}
            aria-label={`Go to slide ${i + 1}`}
            className="group p-1 bg-transparent border-none cursor-pointer"
          >
            <div
              className={cn(
                "h-1 rounded-full transition-all duration-500",
                i === current ? "w-8 bg-white" : "w-2 bg-white/40 group-hover:bg-white/60"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   DATA
   ───────────────────────────────────────────── */

const navLinks = [
  { label: "How It Works", id: "how-it-works" },
  { label: "Trainers", id: "trainers-section" },
  { label: "Categories", id: "categories" },
  { label: "About", id: "about" },
]

const pills = ["Gym", "Yoga", "Boxing", "Dance", "Pilates"]

const stats = [
  { num: "500+", label: "Certified Trainers" },
  { num: "10k+", label: "Happy Clients" },
  { num: "50+", label: "Disciplines" },
  { num: "4.9", label: "Avg. Rating" },
]

const steps = [
  {
    num: "01",
    icon: <Search size={22} />,
    title: "Discover Your Match",
    desc: "Filter by specialization, location, experience, and reviews to find your perfect fit.",
  },
  {
    num: "02",
    icon: <Clock size={22} />,
    title: "Book with Ease",
    desc: "View real-time availability and schedule sessions directly. Secure your spot online instantly.",
  },
  {
    num: "03",
    icon: <CheckCircle size={22} />,
    title: "Train & Transform",
    desc: "Connect with your trainer for personalized in-person or online sessions and see real results.",
  },
]

const topTrainers = [
  {
    id: 1,
    name: "Rohan Shrestha",
    specialty: "Bodybuilding",
    rating: 5.0,
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 2,
    name: "Sita Gurung",
    specialty: "Yoga & Pilates",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 3,
    name: "Anish Magar",
    specialty: "Martial Arts",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 4,
    name: "Priya Karki",
    specialty: "HIIT & Cardio",
    rating: 5.0,
    image: "https://images.unsplash.com/photo-1616279967983-ec413476e824?q=80&w=800&auto=format&fit=crop",
  },
]

const categories = [
  {
    name: "Gym & Strength",
    sub: "Build raw power",
    img: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e",
  },
  {
    name: "Yoga & Mindfulness",
    sub: "Find your balance",
    img: "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0",
  },
  {
    name: "Martial Arts",
    sub: "Sharpen discipline",
    img: "https://images.unsplash.com/photo-1555597673-b21d5c935865",
  },
  {
    name: "Dance & Movement",
    sub: "Express yourself",
    img: "https://images.unsplash.com/photo-1535525153412-5a42439a210d",
  },
]

const testimonials = [
  {
    text: "TrainWithMe connected me with the perfect martial arts coach. I've gained so much confidence and discipline in just 3 months.",
    author: "Anish K.",
    location: "Kathmandu",
  },
  {
    text: "My online yoga sessions are a complete game-changer. The platform is so easy to use and every session is perfectly tailored to me.",
    author: "Nisha T.",
    location: "Pokhara",
  },
  {
    text: "The HIIT trainer I found here pushed me beyond what I thought possible. Lost 12kg in 4 months and never felt stronger.",
    author: "Bikash S.",
    location: "Lalitpur",
  },
  {
    text: "As someone new to fitness, finding a patient and knowledgeable trainer was crucial. TrainWithMe made it effortless.",
    author: "Sabina R.",
    location: "Bhaktapur",
  },
]

/* ─────────────────────────────────────────────
   INLINE STYLES
   ───────────────────────────────────────────── */

const globalCSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html { scroll-behavior: smooth; }

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
@keyframes float-delayed {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.6); }
}
@keyframes fade-up {
  from { opacity: 0; transform: translateY(28px); }
  to { opacity: 1; transform: none; }
}

.animate-float { animation: float 5s ease-in-out infinite; }
.animate-float-delayed { animation: float-delayed 5s ease-in-out infinite 0.6s; }
.animate-pulse-dot { animation: pulse-dot 1.5s ease-in-out infinite; }
.animate-fade-up { animation: fade-up 0.85s cubic-bezier(0.22,1,0.36,1) both; }
.animate-fade-up-delayed { animation: fade-up 0.85s cubic-bezier(0.22,1,0.36,1) 0.22s both; }
`

/* ─────────────────────────────────────────────
   SECTIONS
   ───────────────────────────────────────────── */

/* --- NAVBAR --- */
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate(); // Hook for navigation

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    window.addEventListener("scroll", fn)
    return () => window.removeEventListener("scroll", fn)
  }, [])

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-12 h-[72px] transition-all duration-300",
          scrolled
            ? "bg-[#0a0a0a]/95 backdrop-blur-xl shadow-[0_2px_24px_rgba(0,0,0,0.45)]"
            : "bg-transparent"
        )}
      >
        <button
          onClick={() => scrollTo("hero")}
          className="text-[22px] font-extrabold tracking-tight text-white bg-transparent border-none cursor-pointer"
        >
          Train<span className="text-[#ff6700]">With</span>Me
        </button>
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className="text-[13.5px] font-medium text-white/60 hover:text-white bg-transparent border-none cursor-pointer transition-colors duration-200"
            >
              {link.label}
            </button>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-3">
          {/* UPDATED: Navigate to Login */}
          <button
            onClick={() => navigate('/login')}
            className="text-[13.5px] font-medium text-white/60 hover:text-white bg-transparent border-none cursor-pointer px-3 py-2 transition-colors duration-200"
          >
            Log in
          </button>
          {/* UPDATED: Navigate to Signup */}
          <button
            onClick={() => navigate('/signup')}
            className="bg-[#ff6700] hover:bg-[#e05a00] text-white border-none rounded-lg px-5 py-2.5 text-[13px] font-bold cursor-pointer transition-all duration-200 active:scale-[0.97]"
          >
            Get Started
          </button>
        </div>
        <button
          className="md:hidden text-white bg-transparent border-none cursor-pointer"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={26} />
        </button>
      </nav>

      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-[99] bg-[#0a0a0a]/[0.98] backdrop-blur-2xl flex flex-col items-center justify-center gap-7 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          menuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <button
          className="absolute top-5 right-5 text-white bg-transparent border-none cursor-pointer"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
        >
          <X size={26} />
        </button>
        {navLinks.map((link) => (
          <button
            key={link.id}
            onClick={() => {
              scrollTo(link.id)
              setMenuOpen(false)
            }}
            className="text-[28px] font-extrabold text-white bg-transparent border-none cursor-pointer"
          >
            {link.label}
          </button>
        ))}
        <button
          onClick={() => {
            navigate('/login') // UPDATED
            setMenuOpen(false)
          }}
          className="text-[28px] font-extrabold text-white/50 bg-transparent border-none cursor-pointer"
        >
          Log in
        </button>
        <button
          onClick={() => {
            navigate('/signup') // UPDATED
            setMenuOpen(false)
          }}
          className="text-[28px] font-extrabold text-[#ff6700] bg-transparent border-none cursor-pointer"
        >
          Get Started
        </button>
      </div>
    </>
  )
}

/* --- HERO --- */
function Hero() {
  const navigate = useNavigate(); // Hook for navigation

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, rgba(10,10,10,0.97) 0%, rgba(20,10,0,0.94) 50%, rgba(10,10,10,0.97) 100%)",
      }}
    >
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-30"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
        }}
      />
      <OrbCanvas />

      <div className="relative z-10 max-w-[1280px] mx-auto w-full px-6 lg:px-12 pt-28 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left */}
        <div className="animate-fade-up">
          <div className="inline-flex items-center gap-2 border border-[#ff6700]/30 bg-[#ff6700]/10 text-[#ff6700] text-[11px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff6700] animate-pulse-dot" />
            {"Nepal's #1 Trainer Marketplace"}
          </div>

          <h1 className="text-[clamp(38px,5vw,66px)] font-extrabold text-white leading-[1.05] tracking-[-2px] mb-5 text-balance">
            Unlock Your Potential.{" "}
            <br className="hidden sm:block" />
            Find Your Perfect{" "}
            <span className="text-[#ff6700] italic" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Personal Trainer.
            </span>
          </h1>

          <p className="text-[16px] text-white/45 leading-relaxed max-w-[440px] mb-8">
            Browse expert trainers for Gym, Yoga, Martial Arts, Dance & more. Personalized fitness,
            simplified booking.
          </p>

          {/* Search bar */}
          <div className="flex gap-1.5 bg-white/[0.07] border border-white/[0.12] rounded-xl p-1.5 max-w-[500px] mb-5">
            <div className="flex items-center gap-2.5 flex-1 px-3">
              <Search size={15} className="text-white/30 shrink-0" />
              <input
                type="text"
                placeholder="Search by Category, Name..."
                className="bg-transparent border-none outline-none text-[14px] text-white w-full placeholder:text-white/25"
              />
            </div>
            {/* UPDATED: Find a Trainer -> Onboarding */}
            <button
              onClick={() => navigate('/get-started')}
              className="bg-[#ff6700] hover:bg-[#e05a00] text-white border-none rounded-[9px] px-5 py-2.5 text-[13px] font-bold whitespace-nowrap cursor-pointer transition-colors duration-200"
            >
              Find a Trainer
            </button>
          </div>

          {/* Pills */}
          <div className="flex flex-wrap gap-2">
            {pills.map((c) => (
              <button
                key={c}
                onClick={() => navigate('/get-started')}
                className="bg-transparent border border-white/[0.14] text-white/50 rounded-full px-4 py-1.5 text-[12.5px] font-medium cursor-pointer transition-all duration-200 hover:border-[#ff6700] hover:text-[#ff6700] hover:bg-[#ff6700]/[0.05]"
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Right - Slideshow */}
        <div className="animate-fade-up-delayed hidden lg:block">
          <div className="relative">
            <div className="rounded-2xl overflow-hidden h-[540px] shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
              <HeroSlideshow />
            </div>

            {/* Floating badge 1 */}
            <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl p-4 px-5 shadow-[0_18px_44px_rgba(0,0,0,0.25)] flex items-center gap-3 animate-float z-10">
              <div className="w-11 h-11 rounded-xl bg-[#fff3ec] text-[#ff6700] flex items-center justify-center shrink-0">
                <Zap size={20} />
              </div>
              <div>
                <strong className="text-[18px] font-extrabold text-[#0a0a0a] leading-none block">
                  500+
                </strong>
                <span className="text-[11px] text-[#6b7280] mt-0.5 block">Active Trainers</span>
              </div>
            </div>

            {/* Floating badge 2 */}
            <div className="absolute top-7 -right-5 bg-white rounded-2xl p-4 px-5 shadow-[0_18px_44px_rgba(0,0,0,0.25)] min-w-[165px] animate-float-delayed z-10">
              <div className="flex gap-0.5 mb-1.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={13} fill="#ff6700" className="text-[#ff6700]" />
                ))}
              </div>
              <p className="text-[13.5px] font-bold text-[#0a0a0a]">Trusted by 10k+</p>
              <span className="text-[11px] text-[#6b7280]">clients in Nepal</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* --- STATS BAR --- */
function StatsBar() {
  return (
    <div className="bg-[#ff6700] py-7 px-6 lg:px-12">
      <div className="max-w-[1280px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <Reveal key={i} delay={i * 80}>
            <div className="text-center">
              <div className="text-[34px] font-extrabold text-white leading-none tracking-tight">
                {stat.num}
              </div>
              <div className="text-[12px] text-white/75 mt-1 font-medium">{stat.label}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  )
}

/* --- PROBLEM STRIP --- */
function ProblemStrip() {
  return (
    <Reveal>
      <div className="bg-[#f5f5f4] py-16 px-6 lg:px-12 text-center">
        <h2 className="text-[clamp(22px,2.5vw,34px)] font-extrabold text-[#0a0a0a] tracking-tight mb-4 text-balance max-w-[700px] mx-auto">
          {"Navigating Nepal's Fitness Scene Just Got Simpler."}
        </h2>
        <p className="text-[15.5px] text-[#6b7280] max-w-[600px] mx-auto leading-relaxed">
          {"Tired of endless searching? TrainWithMe cuts through the noise. We connect you directly with a curated network of certified personal trainers across Nepal."}
        </p>
      </div>
    </Reveal>
  )
}

/* --- HOW IT WORKS --- */
function HowItWorks() {
  return (
    <section className="py-24 px-6 lg:px-12 bg-white" id="how-it-works">
      <div className="max-w-[1280px] mx-auto">
        <Reveal>
          <p className="text-[10.5px] font-bold tracking-[2px] uppercase text-[#ff6700] mb-3">
            How It Works
          </p>
          <h2 className="text-[clamp(28px,3.2vw,44px)] font-extrabold text-[#0a0a0a] leading-[1.1] tracking-tight text-balance">
            Your Path to Progress in 3 Simple Steps.
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-14">
          {steps.map((item, i) => (
            <Reveal key={i} delay={i * 110} dir="up">
              <div className="group relative bg-white border border-[#e5e7eb] rounded-2xl p-9 overflow-hidden shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 hover:border-[#ff6700]">
                <span className="absolute -right-1 -top-5 text-[96px] font-extrabold text-[#0a0a0a]/[0.03] leading-none select-none pointer-events-none">
                  {item.num}
                </span>
                <div className="w-12 h-12 rounded-xl bg-[#fff3ec] text-[#ff6700] flex items-center justify-center mb-6 transition-all duration-300 group-hover:bg-[#ff6700] group-hover:text-white">
                  {item.icon}
                </div>
                <h3 className="text-[17px] font-extrabold text-[#0a0a0a] mb-2.5">{item.title}</h3>
                <p className="text-[14px] text-[#6b7280] leading-relaxed">{item.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* --- FEATURE SPLIT --- */
function FeatureSplit() {
  const navigate = useNavigate();
  return (
    <section className="py-24 px-6 lg:px-12 bg-[#f5f5f4]">
      <div className="max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <Reveal dir="left">
            <div className="relative">
              <div className="rounded-2xl overflow-hidden h-[500px] shadow-[0_28px_56px_rgba(0,0,0,0.12)]">
                <img
                  src="https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1000&auto=format&fit=crop"
                  alt="Person performing a focused workout with determination"
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
              </div>
              <div className="absolute -bottom-6 -right-4 lg:-right-5 bg-white rounded-2xl p-5 px-6 shadow-[0_20px_44px_rgba(0,0,0,0.13)] border border-[#e5e7eb] min-w-[220px]">
                <div className="flex justify-between mb-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#6b7280]">
                    Current Goal
                  </span>
                  <em className="not-italic text-[10px] font-bold text-green-500">On Track</em>
                </div>
                <h4 className="text-[15px] font-extrabold text-[#0a0a0a] mb-3">
                  Increase Strength
                </h4>
                <div className="h-1.5 bg-[#e5e7eb] rounded-full mb-3.5 overflow-hidden">
                  <div className="h-full w-[70%] bg-[#ff6700] rounded-full" />
                </div>
                <button className="w-full bg-[#0a0a0a] text-white border-none rounded-lg py-2.5 text-[12px] font-bold cursor-pointer hover:bg-[#141414] transition-colors duration-200">
                  View Workout Plan
                </button>
              </div>
            </div>
          </Reveal>

          <Reveal dir="right" delay={100}>
            <div>
              <div className="flex gap-2 flex-wrap mb-6">
                <span className="bg-[#fff3ec] text-[#ff6700] text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-full">
                  Verified Trainers
                </span>
                <span className="bg-[#fff3ec] text-[#ff6700] text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-full">
                  Secure Payments
                </span>
              </div>
              <h2 className="text-[clamp(26px,3vw,42px)] font-extrabold text-[#0a0a0a] leading-[1.1] tracking-tight mb-5 text-balance">
                Achieve Your Goals.{" "}
                <span
                  className="text-[#ff6700] italic"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  Faster. Smarter.
                </span>{" "}
                With the Right Support.
              </h2>
              <p className="text-[15px] text-[#6b7280] leading-relaxed mb-8 max-w-[460px]">
                Your ideal trainer for gym, yoga, martial arts, or dance is just a click away. Get
                personal growth, insights, and motivation, every step of the way.
              </p>
              {/* UPDATED: Find a Trainer */}
              <button
                onClick={() => navigate('/get-started')}
                className="bg-[#ff6700] hover:bg-[#e05a00] text-white border-none rounded-xl px-7 py-3.5 text-[14px] font-bold cursor-pointer transition-all duration-200 active:scale-[0.97]"
              >
                Find Your Personalized Plan
              </button>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* --- TRAINERS --- */
function Trainers() {
  const navigate = useNavigate();
  return (
    <section className="py-24 px-6 lg:px-12 bg-[#f5f5f4]" id="trainers-section">
      <div className="max-w-[1280px] mx-auto">
        <Reveal>
          <div className="flex justify-between items-end mb-12 flex-wrap gap-4">
            <div>
              <p className="text-[10.5px] font-bold tracking-[2px] uppercase text-[#ff6700] mb-3">
                Top Rated
              </p>
              <h2 className="text-[clamp(28px,3.2vw,44px)] font-extrabold text-[#0a0a0a] leading-[1.1] tracking-tight text-balance">
                Meet Our Top Rated Trainers.
              </h2>
            </div>
            <button className="flex items-center gap-1.5 bg-transparent border-none text-[13px] font-bold text-[#ff6700] cursor-pointer transition-all duration-200 hover:gap-3">
              View All Trainers <ArrowRight size={15} />
            </button>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {topTrainers.map((t, i) => (
            <Reveal key={t.id} delay={i * 100} dir="up">
              <div 
                className="group bg-white border border-[#e5e7eb] rounded-2xl overflow-hidden cursor-pointer shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5"
                onClick={() => navigate(`/trainer/${t.id}`)}
              >
                <div className="h-[240px] overflow-hidden relative">
                  <img
                    src={t.image}
                    alt={`${t.name} - ${t.specialty} trainer`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    crossOrigin="anonymous"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1 text-[12px] font-bold text-[#0a0a0a]">
                    <Star size={12} fill="#ff6700" className="text-[#ff6700]" />
                    {t.rating}
                  </div>
                </div>
                <div className="p-5">
                  <div className="text-[10.5px] font-bold uppercase tracking-wide text-[#ff6700] mb-1">
                    {t.specialty}
                  </div>
                  <div className="text-[16px] font-extrabold text-[#0a0a0a] mb-2">{t.name}</div>
                  <div className="flex items-center gap-1.5 text-[12.5px] text-[#6b7280] mb-4">
                    <MapPin size={13} />
                    Kathmandu
                  </div>
                  <button className="w-full py-2.5 border-[1.5px] border-[#0a0a0a] rounded-lg bg-transparent text-[12.5px] font-bold text-[#0a0a0a] cursor-pointer transition-all duration-200 hover:bg-[#0a0a0a] hover:text-white">
                    View Profile
                  </button>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* --- CATEGORIES --- */
function Categories() {
  return (
    <section className="py-24 px-6 lg:px-12 bg-[#0a0a0a]" id="categories">
      <div className="max-w-[1280px] mx-auto">
        <Reveal>
          <div className="flex justify-between items-end mb-12 flex-wrap gap-4">
            <div>
              <p className="text-[10.5px] font-bold tracking-[2px] uppercase text-[#ff6700] mb-3">
                Explore
              </p>
              <h2 className="text-[clamp(28px,3.2vw,44px)] font-extrabold text-white leading-[1.1] tracking-tight text-balance">
                Find Your Perfect Fit.
              </h2>
              <p className="text-[14px] text-white/35 mt-1.5">Explore Diverse Disciplines.</p>
            </div>
            <button className="flex items-center gap-1.5 bg-transparent border-none text-[13px] font-bold text-[#ff6700] cursor-pointer transition-all duration-200 hover:gap-3">
              View All Categories <ArrowRight size={15} />
            </button>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {categories.map((cat, i) => (
            <Reveal key={i} delay={i * 90} dir="up">
              <div className="group relative rounded-2xl overflow-hidden h-[310px] cursor-pointer">
                <img
                  src={`${cat.img}?q=80&w=600&auto=format&fit=crop`}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  crossOrigin="anonymous"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/85 via-transparent to-transparent" />
                <div className="absolute inset-0 p-5 flex flex-col justify-end">
                  <h3 className="text-[17px] font-extrabold text-white">{cat.name}</h3>
                  <span className="text-[12px] text-white/45 mt-0.5">{cat.sub}</span>
                </div>
                <div className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white opacity-0 translate-y-1.5 transition-all duration-[250ms] group-hover:opacity-100 group-hover:translate-y-0">
                  <ChevronRight size={15} />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* --- TESTIMONIALS --- */
function Testimonials() {
  return (
    <section className="py-24 px-6 lg:px-12 bg-white" id="about">
      <div className="max-w-[1280px] mx-auto">
        <Reveal>
          <p className="text-[10.5px] font-bold tracking-[2px] uppercase text-[#ff6700] mb-3">
            Testimonials
          </p>
          <h2 className="text-[clamp(28px,3.2vw,44px)] font-extrabold text-[#0a0a0a] leading-[1.1] tracking-tight text-balance">
            Inspiring Transformations. Real Stories.
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-12">
          {testimonials.map((t, i) => (
            <Reveal key={i} delay={i * 100} dir="up">
              <div className="group bg-[#f5f5f4] border border-[#e5e7eb] border-l-[4px] border-l-[#ff6700] rounded-2xl p-8 relative overflow-hidden shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <span className="absolute -top-3 left-5 text-[80px] font-extrabold text-[#ff6700]/10 leading-none select-none pointer-events-none">
                  {'"'}
                </span>
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={14} fill="#ff6700" className="text-[#ff6700]" />
                  ))}
                </div>
                <p className="text-[15px] text-[#0a0a0a]/75 leading-relaxed italic mb-5 relative">
                  {t.text}
                </p>
                <p className="text-[13.5px] font-bold text-[#0a0a0a]">
                  {"--- "}
                  {t.author},{" "}
                  <span className="font-normal text-[#6b7280]">{t.location}</span>
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* --- TRAINER CTA --- */
function TrainerCTA() {
  const navigate = useNavigate();
  return (
    <Reveal>
      <div className="bg-[#ff6700] py-14 px-6 lg:px-12" id="for-trainers">
        <div
          className="max-w-[1280px] mx-auto bg-[#0a0a0a] rounded-3xl p-12 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-[0_40px_80px_rgba(0,0,0,0.3)]"
          id="signup-section"
        >
          <div>
            <h2 className="text-[clamp(22px,2.8vw,36px)] font-extrabold text-white mb-3 tracking-tight text-balance">
              Are You a Personal Trainer?
            </h2>
            <p className="text-[15px] text-white/38 max-w-[480px] leading-relaxed">
              {"Expand your reach, manage your bookings, and grow your client base with Nepal's leading fitness marketplace."}
            </p>
          </div>
          {/* UPDATED: Join as Trainer -> Signup */}
          <button
            onClick={() => navigate('/signup')}
            className="bg-white text-[#0a0a0a] hover:bg-white/90 border-none rounded-xl px-8 py-4 text-[14px] font-extrabold whitespace-nowrap cursor-pointer transition-all duration-200 shrink-0"
          >
            {"Join as a Trainer ->"}
          </button>
        </div>
      </div>
    </Reveal>
  )
}

/* --- FOOTER --- */
function SiteFooter() {
  return (
    <footer className="bg-[#0a0a0a] pt-20 pb-8 px-6 lg:px-12 border-t border-white/[0.06]">
      <div className="max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1.4fr] gap-11 mb-14">
          <div>
            <div className="text-[22px] font-extrabold text-white mb-4">
              Train<span className="text-[#ff6700]">With</span>Me
            </div>
            <p className="text-[13.5px] text-white/30 leading-relaxed max-w-[250px]">
              Connecting you with the best fitness trainers for your personal journey. Your Journey,
              Your Expert.
            </p>
          </div>
          <div>
            <h4 className="text-[12px] font-bold uppercase tracking-[1.2px] text-[#ff6700] mb-5">
              Quick Links
            </h4>
            <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
              {[
                { label: "Find Trainers", id: "trainers-section" },
                { label: "How It Works", id: "how-it-works" },
                { label: "Become a Trainer", id: "for-trainers" },
              ].map((link) => (
                <li
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className="text-[13.5px] text-white/35 cursor-pointer transition-colors duration-200 hover:text-white"
                >
                  {link.label}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-[12px] font-bold uppercase tracking-[1.2px] text-[#ff6700] mb-5">
              Legal
            </h4>
            <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
              {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item) => (
                <li
                  key={item}
                  className="text-[13.5px] text-white/35 cursor-pointer transition-colors duration-200 hover:text-white"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-[12px] font-bold uppercase tracking-[1.2px] text-[#ff6700] mb-5">
              Contact
            </h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5 text-[13px] text-white/35">
                <Mail size={14} className="text-[#ff6700] shrink-0" />
                info@trainwithme.np
              </div>
              <div className="flex items-center gap-2.5 text-[13px] text-white/35">
                <Phone size={14} className="text-[#ff6700] shrink-0" />
                +977 9800000000
              </div>
              <div className="flex items-center gap-2.5 text-[13px] text-white/35">
                <MapPin size={14} className="text-[#ff6700] shrink-0" />
                Kathmandu, Nepal
              </div>
            </div>
            <div className="flex gap-2.5 mt-5">
              {[Facebook, Instagram, Linkedin].map((Icon, i) => (
                <div
                  key={i}
                  className="w-9 h-9 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/40 cursor-pointer transition-all duration-200 hover:bg-[#ff6700] hover:border-[#ff6700] hover:text-white"
                >
                  <Icon size={15} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-white/[0.07] pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-[12px] text-white/20">
            &copy; 2026 TrainWithMe. All rights reserved.
          </p>
          <div className="flex gap-5">
            {["Privacy", "Terms", "Cookies"].map((link) => (
              <a
                key={link}
                href="#"
                className="text-[12px] text-white/20 no-underline transition-colors duration-200 hover:text-white/50"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ─────────────────────────────────────────────
   MAIN EXPORT
   ───────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: globalCSS }} />
      <main className="overflow-x-hidden">
        <Navbar />
        <Hero />
        <StatsBar />
        <ProblemStrip />
        <HowItWorks />
        <FeatureSplit />
        <Trainers />
        <Categories />
        <Testimonials />
        <TrainerCTA />
        <SiteFooter />
      </main>
    </>
  )
}