import { useNavigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'

export function WelcomePage() {
  const navigate = useNavigate()
  const { signInWithGoogle } = useAuth()

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
      // Auth listener and route guards will handle redirect
    } catch (error) {
      console.error('Failed to sign in with Google:', error)
    }
  }

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="flex-1 flex flex-col justify-center max-w-sm w-full space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-serif text-stone-200 tracking-tight">Logos</h1>
          <p className="text-stone-400 text-lg font-serif">
            Explore truth through evidence and reason.
          </p>
        </div>

        <div className="space-y-4 pt-8">
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-stone-100 text-stone-900 py-3 px-4 rounded-xl font-medium hover:bg-white transition-colors"
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
            Continue with Google
          </button>

          <button
            onClick={() => navigate('/auth')}
            className="w-full bg-stone-800 text-stone-200 py-3 px-4 rounded-xl font-medium border border-stone-700 hover:bg-stone-700 transition-colors"
          >
            Continue with Email
          </button>
        </div>
      </div>

      <div className="pb-8 text-stone-500 text-sm">
        <p>
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/auth', { state: { mode: 'signup' } })}
            className="text-stone-300 hover:text-white transition-colors"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  )
}
