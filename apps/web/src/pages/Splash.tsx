import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'

export function SplashPage() {
  const [stage, setStage] = useState(0)
  const { user, userProfile, loading } = useAuth()
  const navigate = useNavigate()
  const hasNavigated = useRef(false)

  // Pure animation timeline — runs once, independent of auth state
  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 300) // 0.3s – Icon springs in
    const t2 = setTimeout(() => setStage(2), 1000) // 1.0s – "Logos" text slides in
    const t3 = setTimeout(() => setStage(3), 1800) // 1.8s – Tagline fades in
    const t4 = setTimeout(() => setStage(4), 3500) // 3.5s – Begin fade-out

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [])

  // Route decision — only fires once, after animation is done AND auth resolves
  useEffect(() => {
    if (hasNavigated.current) return
    if (stage < 4) return // animation not done yet
    if (loading) return // auth still loading

    // Small delay so the fade-out transition has started visually
    const navTimer = setTimeout(() => {
      if (hasNavigated.current) return
      hasNavigated.current = true
      sessionStorage.setItem('splashPlayed', 'true')

      if (user && userProfile?.onboardingComplete) {
        navigate('/today', { replace: true })
      } else if (user && !userProfile?.onboardingComplete) {
        navigate('/onboarding', { replace: true })
      } else {
        navigate('/landing', { replace: true })
      }
    }, 500)

    return () => clearTimeout(navTimer)
  }, [stage, loading, user, userProfile, navigate])

  return (
    <div
      className={`min-h-screen bg-black flex flex-col items-center justify-center transition-all duration-700 ease-in-out ${
        stage >= 4 ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
      }`}
    >
      <div className="flex flex-col items-center">
        {/* Logo Icon with spring bounce + glow */}
        <div
          className={`w-24 h-24 mb-8 transition-all duration-1000 filter drop-shadow-[0_0_20px_rgba(252,211,77,0.2)] ${
            stage >= 1
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-[0.3] translate-y-8'
          }`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        >
          <img
            src="/images/logos-icon.svg"
            alt="Logos crest"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Brand Text */}
        <h1
          className={`text-6xl text-stone-200 font-serif tracking-tight transition-all duration-700 ease-out transform origin-bottom ${
            stage >= 2 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-90'
          }`}
        >
          Logos
        </h1>

        {/* Tagline */}
        <p
          className={`mt-6 text-stone-400 font-serif tracking-wide transition-opacity duration-700 ease-in-out ${
            stage >= 3 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          Explore truth through evidence and reason
        </p>
      </div>
    </div>
  )
}
