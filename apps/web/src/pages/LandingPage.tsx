import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

/* ─── Intersection Observer Hook ─── */
function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold: 0.15, ...options }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}

/* ─── Crown of Thorns SVG (Hero Background) ─── */
function CrownOfThornsSVG() {
  return (
    <svg
      viewBox="0 0 600 600"
      className="w-full h-full opacity-[0.12]"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke="#C8A03C" strokeWidth="1.5" strokeLinecap="round" opacity="0.8">
        {/* Outer ring of thorns */}
        <ellipse cx="300" cy="300" rx="200" ry="180" strokeWidth="2" opacity="0.6" />
        <ellipse cx="300" cy="300" rx="180" ry="160" strokeWidth="1.5" opacity="0.4" />
        {/* Thorns radiating outward */}
        {Array.from({ length: 36 }).map((_, i) => {
          const angle = (i * 10 * Math.PI) / 180
          const r1 = 170 + (i % 3) * 15
          const r2 = r1 + 25 + (i % 2) * 15
          const x1 = 300 + Math.cos(angle) * r1
          const y1 = 300 + Math.sin(angle) * (r1 * 0.9)
          const x2 = 300 + Math.cos(angle + 0.15) * r2
          const y2 = 300 + Math.sin(angle + 0.15) * (r2 * 0.9)
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={1 + (i % 2) * 0.5} />
        })}
        {/* Inner intertwined branches */}
        <path
          d="M120 290 Q200 250 280 290 Q320 310 380 280 Q440 250 480 300"
          strokeWidth="2.5"
          opacity="0.5"
        />
        <path
          d="M130 310 Q210 350 290 310 Q340 290 400 320 Q450 340 480 300"
          strokeWidth="2"
          opacity="0.4"
        />
        <path
          d="M140 280 Q220 240 300 280 Q350 300 420 270 Q460 250 490 290"
          strokeWidth="1.5"
          opacity="0.3"
        />
        {/* Additional thorn barbs */}
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = ((i * 15 + 7) * Math.PI) / 180
          const r = 185 + (i % 4) * 8
          const x1 = 300 + Math.cos(angle) * r
          const y1 = 300 + Math.sin(angle) * (r * 0.9)
          const dx = Math.cos(angle + 0.4) * 18
          const dy = Math.sin(angle + 0.4) * 18
          return (
            <line
              key={`b${i}`}
              x1={x1}
              y1={y1}
              x2={x1 + dx}
              y2={y1 + dy}
              strokeWidth="1.2"
              opacity="0.6"
            />
          )
        })}
      </g>
    </svg>
  )
}

/* ─── Scroll Down Chevron ─── */
function ScrollIndicator({ visible }: { visible: boolean }) {
  return (
    <div
      className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <span className="text-[#C8A03C]/60 text-xs tracking-[0.3em] uppercase">Scroll</span>
      <svg
        className="w-5 h-5 text-[#C8A03C]/60"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        style={{ animation: 'scroll-bounce 2s ease-in-out infinite' }}
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  )
}

/* ─── Feature Card ─── */
function FeatureCard({
  icon,
  heading,
  body,
  delay,
}: {
  icon: React.ReactNode
  heading: string
  body: string
  delay: number
}) {
  const { ref, visible } = useInView()
  return (
    <div
      ref={ref}
      className={`bg-[#1A1A1A] rounded-2xl p-6 border-l-2 border-[#C8A03C]/50 transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#C8A03C]/10 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h3 className="text-[#FFF8F0] font-semibold text-lg mb-1">{heading}</h3>
          <p className="text-[#B0A89A] text-sm leading-relaxed">{body}</p>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Landing Page ─── */
export function LandingPage() {
  const navigate = useNavigate()
  const [heroLoaded, setHeroLoaded] = useState(false)
  const [showChevron, setShowChevron] = useState(false)
  const [exiting, setExiting] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  // Section 2, 4, 5 in-view hooks
  const sec2 = useInView()
  const sec4 = useInView()
  const sec5 = useInView()

  // Hero entrance stagger: bg(0s), logo(0.8s), tagline(1.3s), chevron(2s)
  useEffect(() => {
    const t1 = setTimeout(() => setHeroLoaded(true), 100)
    const t2 = setTimeout(() => setShowChevron(true), 2000)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  // Track hero visibility for scroll indicator auto-hide
  const [heroInView, setHeroInView] = useState(true)
  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => setHeroInView(entry.isIntersecting), {
      threshold: 0.1,
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const navigateToAuth = useCallback(
    (mode?: 'signup' | 'signin') => {
      setExiting(true)
      setTimeout(() => {
        navigate('/auth', { state: mode ? { mode } : undefined })
      }, 400)
    },
    [navigate]
  )

  return (
    <div
      className={`min-h-screen bg-[#0A0A0A] text-[#FFF8F0] transition-opacity duration-[400ms] ease-out ${exiting ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* ─── SECTION 1: Hero ─── */}
      <section
        ref={heroRef}
        className="relative h-screen flex flex-col items-center justify-center overflow-hidden"
      >
        {/* Background SVG with Ken Burns zoom */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-[800ms] ease-out ${heroLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ animation: 'ken-burns 20s ease-in-out infinite alternate' }}
        >
          <CrownOfThornsSVG />
        </div>
        {/* Dark gradient overlay bottom */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0A0A0A] to-transparent" />

        {/* Content */}
        <div className="relative z-10 text-center px-6">
          <h1
            className={`text-5xl sm:text-6xl font-bold tracking-[0.25em] uppercase text-[#C8A03C] transition-all duration-500 ease-out ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
            style={{ transitionDelay: '800ms' }}
          >
            LOGOS
          </h1>
          <p
            className={`mt-4 text-lg sm:text-xl text-[#FFF8F0]/80 font-light tracking-wide transition-all duration-500 ease-out ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '1300ms' }}
          >
            Where Logic Meets Truth
          </p>
        </div>

        <ScrollIndicator visible={showChevron && heroInView} />
      </section>

      {/* ─── SECTION 2: Vision Statement ─── */}
      <section className="relative px-6 py-24 max-w-lg mx-auto overflow-hidden">
        {/* Ink portrait silhouette accent */}
        <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-64 h-80 opacity-[0.06] pointer-events-none">
          <svg
            viewBox="0 0 200 300"
            fill="none"
            stroke="#FFF8F0"
            strokeWidth="0.8"
            className="w-full h-full"
          >
            <path d="M100 30 Q120 50 115 80 Q130 90 125 120 Q135 140 120 160 Q125 180 110 200 Q115 230 100 250 Q90 260 80 250 Q70 230 75 200 Q60 180 65 160 Q50 140 60 120 Q55 90 70 80 Q65 50 85 30 Q90 25 100 30Z" />
            <path d="M85 60 Q95 55 105 60" />
            <circle cx="90" cy="95" r="4" />
            <path d="M88 120 Q100 125 106 118" />
            <path d="M95 35 Q110 20 120 40 Q130 50 125 70" strokeWidth="1.2" opacity="0.3" />
            <path d="M105 25 Q115 15 125 30 Q135 40 130 55" strokeWidth="0.8" opacity="0.2" />
          </svg>
        </div>

        <div
          ref={sec2.ref}
          className={`relative z-10 transition-all duration-700 ease-out ${sec2.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 leading-tight">
            Not Another <br />
            Devotional App
          </h2>
          <p className="text-[#B0A89A] text-base leading-relaxed">
            Logos is built for thinkers, skeptics, and seekers who want to explore Christianity
            through evidence, logic, and historical scholarship — not blind faith. Peter, your AI
            mentor, meets you exactly where you are.
          </p>
        </div>
      </section>

      {/* ─── SECTION 3: Feature Highlights ─── */}
      <section className="px-6 py-16 max-w-lg mx-auto space-y-5">
        <FeatureCard
          delay={0}
          heading="Meet Peter"
          body="An intellectually rigorous AI companion calibrated to your worldview. Peter leads with logic and evidence — never preachy, always precise."
          icon={
            <svg
              className="w-5 h-5 text-[#C8A03C]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.5 5-3 6.5V18h-8v-2.5C6.5 14 5 11.5 5 9a7 7 0 0 1 7-7Z" />
              <path d="M9 22h6M10 18v2M14 18v2" />
            </svg>
          }
        />
        <FeatureCard
          delay={150}
          heading="Weigh the Evidence"
          body="Every claim is backed by cited sources — from N.T. Wright to Bart Ehrman. See both sides. Draw your own conclusions."
          icon={
            <svg
              className="w-5 h-5 text-[#C8A03C]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M12 3v18M3 9l9-6 9 6M3 9l4 8h10l4-8" />
              <circle cx="7" cy="17" r="1" />
              <circle cx="17" cy="17" r="1" />
            </svg>
          }
        />
        <FeatureCard
          delay={300}
          heading="Your Path, Your Pace"
          body="Diary reflections, discovery topics, and Bible study — all woven together by Peter's memory of your unique journey."
          icon={
            <svg
              className="w-5 h-5 text-[#C8A03C]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 3v4M12 12l3-3" />
              <path d="M16.24 7.76l-2.12 2.12" strokeWidth="2" />
            </svg>
          }
        />
      </section>

      {/* ─── SECTION 4: Dramatic Visual Break ─── */}
      <section
        ref={sec4.ref}
        className="relative h-screen flex items-center justify-center overflow-hidden"
      >
        {/* CSS-gradient abstract cross */}
        <div className="absolute inset-0">
          <div
            className={`absolute inset-0 transition-opacity duration-[1500ms] ${sec4.visible ? 'opacity-100' : 'opacity-0'}`}
          >
            {/* Vertical beam */}
            <div className="absolute left-1/2 -translate-x-1/2 top-[15%] w-[3px] h-[70%] bg-gradient-to-b from-transparent via-[#FFF8F0]/[0.08] to-transparent" />
            {/* Horizontal beam */}
            <div className="absolute top-[35%] left-[20%] right-[20%] h-[2px] bg-gradient-to-r from-transparent via-[#FFF8F0]/[0.06] to-transparent" />
            {/* Radial glow at intersection */}
            <div className="absolute left-1/2 top-[35%] -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-[#C8A03C]/[0.03] blur-3xl" />
          </div>
        </div>

        <div
          className={`relative z-10 text-center px-8 max-w-md transition-all duration-700 ease-out ${sec4.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '500ms' }}
        >
          <blockquote className="text-2xl sm:text-3xl font-serif italic text-[#FFF8F0]/90 leading-snug">
            "Test everything; hold fast what is good."
          </blockquote>
          <cite className="block mt-4 text-sm text-[#B0A89A] not-italic tracking-wider uppercase">
            — 1 Thessalonians 5:21
          </cite>
        </div>
      </section>

      {/* ─── SECTION 5: CTA ─── */}
      <section className="px-6 py-24 max-w-lg mx-auto text-center">
        <div
          ref={sec5.ref}
          className={`transition-all duration-700 ease-out ${sec5.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 leading-tight">
            Begin Your Search
            <br />
            for Truth
          </h2>
          <p className="text-[#B0A89A] mb-10">Free. Private. No strings attached.</p>

          <button
            onClick={() => navigateToAuth('signup')}
            className="w-full bg-[#C8A03C] text-[#0A0A0A] py-4 rounded-xl font-bold tracking-wide text-lg active:scale-[0.97] active:brightness-90 transition-all flex items-center justify-center"
            style={{ animation: 'pulse-glow 3s infinite ease-in-out' }}
          >
            Get Started
          </button>

          <p className="mt-6 text-sm text-[#B0A89A]">
            Already have an account?{' '}
            <button
              onClick={() => navigateToAuth('signin')}
              className="text-[#C8A03C] hover:text-[#D4AD4A] transition-colors underline underline-offset-4"
            >
              Sign In
            </button>
          </p>
        </div>
      </section>

      {/* ─── SECTION 6: Footer ─── */}
      <footer className="px-6 py-12 text-center border-t border-[#1A1A1A]">
        <p className="text-[#C8A03C] text-sm font-bold tracking-[0.2em] uppercase mb-1">LOGOS</p>
        <p className="text-[#B0A89A]/60 text-xs mb-2">Where Logic Meets Truth</p>
        <p className="text-[#B0A89A]/40 text-xs">
          &copy; {new Date().getFullYear()} Logos. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
