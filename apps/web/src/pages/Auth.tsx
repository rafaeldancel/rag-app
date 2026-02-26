import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from 'firebase/auth'
import { useAuth } from '../providers/AuthProvider'
import { auth } from '../firebase'

export function AuthPage() {
  const location = useLocation()
  const { signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  const [isSignUp, setIsSignUp] = useState(location.state?.mode === 'signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showVerificationSent, setShowVerificationSent] = useState(false)

  // Clear errors when toggling modes
  useEffect(() => {
    setError('')
  }, [isSignUp])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        await sendEmailVerification(userCredential.user)
        await signOut(auth) // force them out until they verify
        setShowVerificationSent(true)
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        if (!userCredential.user.emailVerified) {
          await signOut(auth)
          setError('Please verify your email before signing in. Check your inbox.')
        }
      }
      // Redirects happen automatically via Route Guards based on onAuthStateChanged
    } catch (err: unknown) {
      console.error(err)
      const firebaseErr = err as { code?: string; message?: string }
      if (firebaseErr.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Try signing in.')
      } else if (firebaseErr.code === 'auth/invalid-credential') {
        setError('Invalid email or password.')
      } else if (firebaseErr.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.')
      } else {
        setError(firebaseErr.message || 'An error occurred during authentication.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch (err) {
      console.error(err)
      setError('Google sign-in failed. Please try again.')
    }
  }

  if (showVerificationSent) {
    return (
      <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-sm space-y-6">
          <div className="w-16 h-16 bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-stone-700">
            <svg
              className="w-8 h-8 text-stone-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-serif text-stone-200 tracking-tight">Check your inbox</h1>
          <p className="text-stone-400">
            We sent a verification link to{' '}
            <span className="text-stone-300 font-medium">{email}</span>. Please verify your email to
            continue.
          </p>
          <button
            onClick={() => {
              setShowVerificationSent(false)
              setIsSignUp(false)
              setPassword('')
              setConfirmPassword('')
            }}
            className="w-full bg-stone-200 text-stone-900 py-3 rounded-xl font-medium hover:bg-white transition-colors"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center p-6 relative">
      {/* Back button */}
      <button
        onClick={() => navigate('/landing')}
        className="absolute top-5 left-5 w-11 h-11 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 transition-colors z-10"
        aria-label="Back to Landing"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-serif text-stone-200 tracking-tight">
            {isSignUp ? 'Create an account' : 'Welcome back'}
          </h1>
          <p className="mt-2 text-stone-400">
            {isSignUp ? 'Begin your journey.' : 'Continue exploring.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              required
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-stone-800 border-stone-700 text-stone-200 rounded-xl px-4 py-3 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-600 transition-all border"
            />
          </div>

          <div>
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-stone-800 border-stone-700 text-stone-200 rounded-xl px-4 py-3 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-600 transition-all border"
            />
          </div>

          {isSignUp && (
            <div>
              <input
                type="password"
                required
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full bg-stone-800 border-stone-700 text-stone-200 rounded-xl px-4 py-3 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-600 transition-all border"
              />
            </div>
          )}

          {!isSignUp && (
            <div className="flex justify-end">
              <button
                type="button"
                className="text-sm text-stone-400 hover:text-stone-300 transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-stone-200 text-stone-900 py-3 rounded-xl font-medium hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : isSignUp ? 'Sign up' : 'Sign in'}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-800"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-stone-900 text-stone-500">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 bg-stone-800 text-stone-200 py-3 px-4 rounded-xl font-medium border border-stone-700 hover:bg-stone-700 transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
            <path
              d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
              fill="#EA4335"
            />
            <path
              d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
              fill="#4285F4"
            />
            <path
              d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
              fill="#FBBC05"
            />
            <path
              d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
              fill="#34A853"
            />
          </svg>
          Google
        </button>

        <p className="text-center text-sm text-stone-500">
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-stone-300 hover:text-white transition-colors"
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  )
}
