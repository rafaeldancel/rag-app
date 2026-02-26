import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, setDoc, getFirestore, serverTimestamp } from 'firebase/firestore'
import { useAuth } from '../providers/AuthProvider'
import { app } from '../firebase'

const db = getFirestore(app)

const faithBackgrounds = [
  { id: 'christian', label: 'Christian — I follow Christ' },
  { id: 'exploring', label: "Exploring Faith — I'm curious and open" },
  { id: 'atheist', label: "Atheist — I don't believe in God" },
  { id: 'skeptic', label: 'Skeptic — I have doubts and questions' },
  { id: 'other', label: 'Other' },
]

export function OnboardingPage() {
  const { user, setUserProfile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  // Transition state: 'idle' | 'exit' | 'enter'
  const [transition, setTransition] = useState<'idle' | 'exit' | 'enter'>('idle')
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const stepRef = useRef<HTMLDivElement>(null)

  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [faithBackground, setFaithBackground] = useState('')
  const [customFaith, setCustomFaith] = useState('')
  const [worldview, setWorldview] = useState({ epistemology: 5, openness: 5, metaphysics: 5 })

  // Loading Transition States
  const [loadingPhase, setLoadingPhase] = useState<'idle' | 'saving' | 'spinning' | 'complete'>(
    'idle'
  )
  const [loadingText, setLoadingText] = useState('Setting up your experience...')

  const [selectedTopics, setSelectedTopics] = useState<string[]>([])

  const generatedTopics = [
    ...(worldview.epistemology <= 5
      ? ['The Historicity of the New Testament', 'What Did Secular Historians Write About Jesus?']
      : []),
    ...(worldview.metaphysics >= 5
      ? ['Understanding the Resurrection Evidence', 'The Problem of Evil', 'Science and Faith']
      : []),
    ...(worldview.openness >= 5
      ? ['Evidence vs. Faith: Do They Conflict?', 'What the Bible Says About Purpose']
      : ['The Cosmological Argument Explained']),
  ]

  const toggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter(t => t !== topic))
    } else if (selectedTopics.length < 3) {
      setSelectedTopics([...selectedTopics, topic])
    }
  }

  // Two-phase animated step transition
  const goToStep = (nextStep: number) => {
    if (transition !== 'idle') return
    const dir = nextStep > step ? 'forward' : 'backward'
    setDirection(dir)
    setTransition('exit')

    // Phase 1: old content slides out (300ms)
    setTimeout(() => {
      setStep(nextStep)
      setTransition('enter')

      // Phase 2: new content slides in (300ms)
      setTimeout(() => {
        setTransition('idle')
      }, 300)
    }, 250)
  }

  // Compute transform classes based on transition state + direction
  let contentClass = 'translate-x-0 opacity-100'
  if (transition === 'exit') {
    contentClass =
      direction === 'forward'
        ? '-translate-x-16 opacity-0' // exit left (forward)
        : 'translate-x-16 opacity-0' // exit right (backward)
  } else if (transition === 'enter') {
    contentClass =
      direction === 'forward'
        ? 'translate-x-16 opacity-0' // start from right (forward)
        : '-translate-x-16 opacity-0' // start from left (backward)
  }

  // Force instant position on enter start, then animate to center
  useEffect(() => {
    if (transition === 'enter') {
      // Wait a frame so the browser applies the offset position, then animate to center
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransition('idle')
        })
      })
    }
  }, [transition])

  const completeOnboarding = async () => {
    if (!user || loadingPhase !== 'idle') return

    // Phase 1: Begin transition out
    setLoadingPhase('saving')

    try {
      const finalFaith =
        faithBackground === 'other' && customFaith.trim()
          ? customFaith.trim()
          : faithBackgrounds
              .find(b => b.id === faithBackground)
              ?.label?.split('—')[0]
              ?.trim() || faithBackground

      const profileData = {
        displayName,
        email: user.email,
        photoURL: user.photoURL,
        faithBackground: finalFaith,
        worldviewAudit: worldview,
        discoveryTopics: selectedTopics,
        onboardingComplete: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      console.log('[Onboarding] Saving to Firestore...')
      // Core critical action - execute immediately
      await setDoc(doc(db, 'users', user.uid), profileData, { merge: true })
      console.log('[Onboarding] Firestore write complete')

      // DO NOT set userProfile here — it triggers the route guard which
      // unmounts this component and kills all setTimeout timers.
      // We defer the context update to Phase 4, right before navigating.

      // Phase 1 (0s-0.5s): governed by 'saving' state -> fading out summary
      // Phase 2 (0.5s-5s): Spiritual Loading Sequence
      setTimeout(() => {
        setLoadingPhase('spinning')
        setLoadingText('Preparing your path of discovery...')
      }, 500)

      setTimeout(() => setLoadingText('Calibrating Peter to walk alongside you...'), 2000)
      setTimeout(() => setLoadingText('Setting up your journey of truth...'), 3500)

      // Phase 3 (5s-6.5s): Completion Checkmark
      setTimeout(() => {
        setLoadingPhase('complete')
        setLoadingText('Your journey begins now')
      }, 5000)

      // Phase 4 (6.5s-7.5s): Set context + navigate
      setTimeout(() => {
        // NOW update context so the route guard allows /today
        setUserProfile({
          uid: user.uid,
          displayName,
          email: user.email || '',
          photoURL: user.photoURL || '',
          faithBackground: finalFaith,
          worldviewAudit: worldview,
          discoveryTopics: selectedTopics,
          onboardingComplete: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        navigate('/today', { replace: true })
      }, 7500)
    } catch (error) {
      console.error('[Onboarding] Failed to save profile:', error)
      setLoadingPhase('idle')
      alert('There was an issue saving your profile. Please try again.')
    }
  }

  // Intercept main render to show the full-screen spiritual loading transition if active
  if (loadingPhase !== 'idle') {
    const isComplete = loadingPhase === 'complete'
    // Phase 1 wait: wait 500ms before showing the spinner to allow summary to fade out
    const showLoaders = loadingPhase === 'spinning' || loadingPhase === 'complete'

    return (
      <div
        className={`fixed inset-0 min-h-screen bg-stone-900 flex flex-col items-center justify-center p-6 text-stone-200 transition-opacity duration-500 ease-out z-50 ${showLoaders ? 'opacity-100' : 'opacity-0'}`}
      >
        <div
          className={`flex flex-col items-center justify-center transition-all duration-700 ease-out ${showLoaders ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        >
          <div className="relative flex h-24 w-24 items-center justify-center mb-8">
            {/* Spinning Ring */}
            <div
              className={`absolute inset-0 rounded-full border-4 border-primary/20 transition-all duration-500 ${isComplete ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
            />
            <div
              className={`absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin transition-all duration-500 ${isComplete ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
            />

            {/* Completion Checkmark */}
            <svg
              className={`absolute inset-0 h-full w-full text-[#4ade80] drop-shadow-[0_0_15px_rgba(74,222,128,0.5)] transition-all duration-500 ${isComplete ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isComplete && (
                <polyline
                  points="20 6 9 17 4 12"
                  style={{ animation: 'draw-check 0.4s ease-out forwards' }}
                />
              )}
            </svg>
          </div>

          <div className="h-8 relative w-full max-w-xs flex justify-center">
            <p
              className="absolute text-lg font-medium text-[#FFF8F0] tracking-wide text-center transition-opacity duration-300"
              key={loadingText}
            >
              {loadingText}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col items-center p-6 text-stone-200">
      {/* Progress indicator */}
      <div className="w-full max-w-md pt-6 flex gap-2">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-500 ${
              i <= step ? 'bg-stone-300' : 'bg-stone-700'
            }`}
          />
        ))}
      </div>

      <div className="w-full max-w-md pt-8 space-y-8 overflow-hidden">
        <div ref={stepRef} className={`transition-all duration-300 ease-out ${contentClass}`}>
          {step === 1 && (
            <div className="space-y-6">
              <h1 className="text-3xl font-serif">Welcome to Logos.</h1>
              <p className="text-stone-400">Let's get to know how you think.</p>
              <div className="space-y-2">
                <label className="text-sm text-stone-400">What should we call you?</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full bg-stone-800 border-stone-700 rounded-xl px-4 py-3 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-600 transition-all border text-lg"
                  placeholder="Your name"
                  autoFocus
                />
              </div>
              <button
                onClick={() => goToStep(2)}
                disabled={!displayName.trim()}
                className="w-full bg-stone-200 text-stone-900 py-3 rounded-xl font-medium mt-8 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-serif">Where are you on your journey?</h2>
              <div className="grid gap-3">
                {faithBackgrounds.map(bg => (
                  <button
                    key={bg.id}
                    onClick={() => setFaithBackground(bg.id)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      faithBackground === bg.id
                        ? 'bg-stone-800 border-stone-400 text-white'
                        : 'bg-transparent border-stone-700 text-stone-400 hover:border-stone-500 hover:text-stone-300'
                    }`}
                  >
                    <span className="font-medium text-[15px]">{bg.label}</span>
                  </button>
                ))}
              </div>

              {faithBackground === 'other' && (
                <div className="pt-2 animate-in slide-in-from-top-2 fade-in duration-300">
                  <input
                    type="text"
                    value={customFaith}
                    onChange={e => setCustomFaith(e.target.value)}
                    className="w-full bg-stone-800 border-stone-700 rounded-xl px-4 py-3 text-stone-200 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-600 transition-all border"
                    placeholder="Tell us more about where you are..."
                    autoFocus
                  />
                </div>
              )}

              <div className="flex gap-3 pt-6">
                <button
                  onClick={() => goToStep(1)}
                  className="px-6 py-3 rounded-xl border border-stone-700 text-stone-400"
                >
                  Back
                </button>
                <button
                  onClick={() => goToStep(3)}
                  disabled={
                    !faithBackground || (faithBackground === 'other' && !customFaith.trim())
                  }
                  className="flex-1 bg-stone-200 text-stone-900 py-3 rounded-xl font-medium disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-10">
              <div className="space-y-2">
                <h2 className="text-2xl font-serif">The Worldview Audit</h2>
                <p className="text-stone-400 text-sm">
                  We use this to calibrate our discussions to your thinking style.
                </p>
              </div>

              <div className="space-y-4 pt-4">
                <div className="relative">
                  <div className="flex justify-between text-sm pb-8">
                    <span className="text-stone-400 w-1/3 leading-snug">
                      I trust hard evidence and data
                    </span>
                    <span className="text-stone-400 w-1/3 text-right leading-snug">
                      I trust personal experience
                    </span>
                  </div>
                  <div className="absolute top-10 left-0 w-full flex justify-center -mt-6">
                    <span className="text-3xl font-bold text-stone-200 bg-stone-900 px-2">
                      {worldview.epistemology}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={worldview.epistemology}
                    onChange={e =>
                      setWorldview({ ...worldview, epistemology: Number(e.target.value) })
                    }
                    className="w-full accent-stone-400"
                  />
                  <p className="text-center text-xs text-stone-500 uppercase tracking-widest font-semibold pt-2">
                    Epistemology
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <div className="relative">
                  <div className="flex justify-between text-sm pb-8">
                    <span className="text-stone-400 w-1/3 leading-snug">
                      Very skeptical — convince me
                    </span>
                    <span className="text-stone-400 w-1/3 text-right leading-snug">
                      Very open — seeking answers
                    </span>
                  </div>
                  <div className="absolute top-10 left-0 w-full flex justify-center -mt-6">
                    <span className="text-3xl font-bold text-stone-200 bg-stone-900 px-2">
                      {worldview.openness}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={worldview.openness}
                    onChange={e => setWorldview({ ...worldview, openness: Number(e.target.value) })}
                    className="w-full accent-stone-400"
                  />
                  <p className="text-center text-xs text-stone-500 uppercase tracking-widest font-semibold pt-2">
                    Openness
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <div className="relative">
                  <div className="flex justify-between text-sm pb-8">
                    <span className="text-stone-400 w-1/3 leading-snug">
                      Only the physical world exists
                    </span>
                    <span className="text-stone-400 w-1/3 text-right leading-snug">
                      There's more beyond the physical
                    </span>
                  </div>
                  <div className="absolute top-10 left-0 w-full flex justify-center -mt-6">
                    <span className="text-3xl font-bold text-stone-200 bg-stone-900 px-2">
                      {worldview.metaphysics}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={worldview.metaphysics}
                    onChange={e =>
                      setWorldview({ ...worldview, metaphysics: Number(e.target.value) })
                    }
                    className="w-full accent-stone-400"
                  />
                  <p className="text-center text-xs text-stone-500 uppercase tracking-widest font-semibold pt-2">
                    Metaphysics
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  onClick={() => goToStep(2)}
                  className="px-6 py-3 rounded-xl border border-stone-700 text-stone-400"
                >
                  Back
                </button>
                <button
                  onClick={() => goToStep(4)}
                  className="flex-1 bg-stone-200 text-stone-900 py-3 rounded-xl font-medium"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <h2 className="text-2xl font-serif">Discovery Topics</h2>
                  <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">
                    Selected: {selectedTopics.length}/3
                  </span>
                </div>
                <p className="text-stone-400">
                  Based on your audit, select up to 3 topics to start exploring.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {[...new Set(generatedTopics)].slice(0, 5).map(topic => (
                  <button
                    key={topic}
                    onClick={() => toggleTopic(topic)}
                    className={`px-4 py-3 rounded-xl border-2 text-left transition-all text-sm leading-snug active:scale-95 ${
                      selectedTopics.includes(topic)
                        ? 'bg-primary/20 border-primary text-stone-100 font-medium shadow-[0_0_15px_rgba(200,160,60,0.2)]'
                        : 'bg-stone-800/40 border-stone-700 text-stone-400 hover:border-stone-500 hover:text-stone-300'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  onClick={() => goToStep(3)}
                  className="px-6 py-3 rounded-xl border border-stone-700 text-stone-400"
                >
                  Back
                </button>
                <button
                  onClick={() => goToStep(5)}
                  disabled={selectedTopics.length === 0}
                  className="flex-1 bg-stone-200 text-stone-900 py-3 rounded-xl font-medium disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-8 text-center pt-8">
              <div className="w-32 h-32 mx-auto rounded-full overflow-hidden bg-stone-800 border-2 border-stone-700 shadow-xl">
                <img
                  src="/images/peter-avatar.svg"
                  alt="Peter"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-serif text-stone-200">Meet Peter</h2>
                <p className="text-stone-400 text-lg">
                  Your personal guide through evidence, logic, and faith.
                </p>
              </div>

              <div className="bg-stone-800/50 p-6 rounded-2xl border border-stone-700/50 text-left space-y-4 text-stone-300 text-sm">
                <p className="flex items-start gap-3">
                  <span className="text-stone-500 mt-0.5">•</span>I cite real sources — historians,
                  philosophers, and scripture.
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-stone-500 mt-0.5">•</span>I respect where you're coming from
                  — no preaching, just honest exploration.
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-stone-500 mt-0.5">•</span>I adapt to your thinking style
                  based on what you just told me.
                </p>
              </div>

              <div className="flex gap-3 pt-8">
                <button
                  onClick={() => goToStep(4)}
                  className="px-6 py-4 rounded-xl border border-stone-700 text-stone-400"
                >
                  Back
                </button>
                <button
                  onClick={() => goToStep(6)}
                  className="flex-1 bg-stone-200 text-stone-900 py-4 rounded-xl font-medium text-lg shadow-lg hover:shadow-stone-200/20 hover:bg-white transition-all tracking-wide"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-8 pt-2 pb-12 transition-all duration-500 ease-out origin-center">
              {/* Display 1: Title Entrance (0s - 1s) */}
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-3xl font-serif text-stone-200 animate-in fade-in zoom-in-95 duration-700 ease-out fill-mode-both delay-0">
                  Your Journey
                </h2>
                <p className="text-stone-400 animate-in fade-in duration-700 ease-out fill-mode-both delay-[500ms]">
                  Here's how we've calibrated Peter for you.
                </p>
              </div>

              {/* Display 2: Identity Reveal (1.5s - 4s) */}
              <div className="space-y-6">
                <div className="relative pb-4 overflow-hidden">
                  <div className="flex items-center justify-between relative z-10">
                    <span className="text-stone-500 text-sm font-medium animate-in fade-in slide-in-from-left-4 duration-500 ease-out fill-mode-both delay-[1500ms]">
                      Name
                    </span>
                    <span className="text-stone-200 font-medium animate-in fade-in slide-in-from-right-4 duration-500 ease-out fill-mode-both delay-[2000ms]">
                      {displayName}
                    </span>
                  </div>
                  <div
                    className="absolute bottom-0 left-0 h-[1px] bg-stone-800"
                    style={{ animation: 'draw-line 1s ease-out 2500ms forwards', width: '0%' }}
                  />
                </div>

                <div className="relative pb-4 overflow-hidden">
                  <div className="flex items-center justify-between relative z-10">
                    <span className="text-stone-500 text-sm font-medium animate-in fade-in slide-in-from-left-4 duration-500 ease-out fill-mode-both delay-[3000ms]">
                      Background
                    </span>
                    <span className="text-stone-200 font-medium text-right max-w-[60%] line-clamp-2 animate-in fade-in slide-in-from-right-4 duration-500 ease-out fill-mode-both delay-[3500ms]">
                      {faithBackground === 'other' && customFaith.trim()
                        ? customFaith.trim()
                        : faithBackgrounds
                            .find(b => b.id === faithBackground)
                            ?.label?.split('—')[0]
                            ?.trim() || faithBackground}
                    </span>
                  </div>
                  <div
                    className="absolute bottom-0 left-0 h-[1px] bg-stone-800"
                    style={{ animation: 'draw-line 1s ease-out 4000ms forwards', width: '0%' }}
                  />
                </div>

                {/* Display 3: Worldview Profile (4.5s - 7.5s) */}
                <div className="space-y-4 pb-4">
                  <span className="text-stone-500 text-sm font-medium block animate-in fade-in duration-500 ease-out fill-mode-both delay-[4500ms]">
                    Worldview Profile
                  </span>

                  <div className="space-y-1.5 overflow-hidden">
                    <div className="flex justify-between text-xs text-stone-400">
                      <span className="animate-in fade-in duration-500 ease-out fill-mode-both delay-[5000ms]">
                        Epistemology
                      </span>
                      <span className="animate-in fade-in duration-500 ease-out fill-mode-both delay-[5000ms]">
                        {worldview.epistemology}/10
                      </span>
                    </div>
                    <div className="h-2 w-full bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden animate-in fade-in duration-500 ease-out fill-mode-both delay-[5000ms]">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{
                          width: `${(worldview.epistemology / 10) * 100}%`,
                          transformOrigin: 'left',
                          animation: 'bar-fill 1000ms ease-out 5200ms both',
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1 overflow-hidden">
                    <div className="flex justify-between text-xs text-stone-400">
                      <span className="animate-in fade-in duration-500 ease-out fill-mode-both delay-[5400ms]">
                        Openness
                      </span>
                      <span className="animate-in fade-in duration-500 ease-out fill-mode-both delay-[5400ms]">
                        {worldview.openness}/10
                      </span>
                    </div>
                    <div className="h-2 w-full bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden animate-in fade-in duration-500 ease-out fill-mode-both delay-[5400ms]">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{
                          width: `${(worldview.openness / 10) * 100}%`,
                          transformOrigin: 'left',
                          animation: 'bar-fill 1000ms ease-out 5600ms both',
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1 overflow-hidden">
                    <div className="flex justify-between text-xs text-stone-400">
                      <span className="animate-in fade-in duration-500 ease-out fill-mode-both delay-[5800ms]">
                        Metaphysics
                      </span>
                      <span className="animate-in fade-in duration-500 ease-out fill-mode-both delay-[5800ms]">
                        {worldview.metaphysics}/10
                      </span>
                    </div>
                    <div className="h-2 w-full bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden animate-in fade-in duration-500 ease-out fill-mode-both delay-[5800ms]">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{
                          width: `${(worldview.metaphysics / 10) * 100}%`,
                          transformOrigin: 'left',
                          animation: 'bar-fill 1000ms ease-out 6000ms both',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Display 4: Discovery Topics (8s - 10s) */}
                {selectedTopics.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-stone-500 text-sm font-medium block animate-in fade-in duration-500 ease-out fill-mode-both delay-[8000ms]">
                      Exploring
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedTopics.map((topic, idx) => (
                        <span
                          key={topic}
                          className="px-3 py-1.5 bg-stone-800/80 rounded-lg text-xs font-medium text-stone-300 border border-stone-700/50"
                          style={{
                            animation: `pop-in 600ms ease-out ${8400 + idx * 400}ms both`,
                          }}
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Display 5: Complete CTA (10.5s) */}
              <div className="pt-10 pb-4 flex justify-center w-full animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-both delay-[10500ms]">
                <button
                  onClick={completeOnboarding}
                  className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold tracking-wide text-lg transform active:scale-95 flex items-center justify-center gap-2"
                  style={{ animation: 'pulse-glow 3s infinite ease-in-out' }}
                >
                  Begin Your Journey
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
