import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, getDoc, setDoc, getFirestore, serverTimestamp } from 'firebase/firestore'
import { auth, app } from '../firebase'

const db = getFirestore(app)

export interface UserProfile {
  uid: string
  displayName?: string
  email?: string
  photoURL?: string
  faithBackground?: string
  worldviewAudit?: {
    epistemology: number
    openness: number
    metaphysics: number
  }
  discoveryTopics?: string[]
  onboardingComplete: boolean
  createdAt: unknown
  updatedAt: unknown
}

interface AuthContextType {
  user: FirebaseUser | null
  userProfile: UserProfile | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  setUserProfile: (profile: UserProfile | null) => void
  refreshUserProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchOrCreateProfile = useCallback(async (firebaseUser: FirebaseUser) => {
    try {
      const docRef = doc(db, 'users', firebaseUser.uid)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        setUserProfile({ uid: firebaseUser.uid, ...docSnap.data() } as UserProfile)
      } else {
        // New user — create a baseline document in Firestore
        console.log('[AuthProvider] Creating new user profile for', firebaseUser.uid)
        const newProfileData = {
          displayName: firebaseUser.displayName || '',
          email: firebaseUser.email || '',
          photoURL: firebaseUser.photoURL || '',
          onboardingComplete: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
        await setDoc(docRef, newProfileData)
        setUserProfile({
          uid: firebaseUser.uid,
          ...newProfileData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }
    } catch (error) {
      console.error('[AuthProvider] Error fetching/creating user profile:', error)
      setUserProfile(null)
    }
  }, [])

  const refreshUserProfile = useCallback(async () => {
    if (!user) return
    await fetchOrCreateProfile(user)
  }, [user, fetchOrCreateProfile])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
      // Kill any lingering anonymous sessions from previous code versions
      if (firebaseUser && firebaseUser.isAnonymous) {
        console.log('[AuthProvider] Killing anonymous session')
        await firebaseSignOut(auth)
        // onAuthStateChanged will fire again with null user
        return
      }

      setUser(firebaseUser)

      if (firebaseUser) {
        await fetchOrCreateProfile(firebaseUser)
      } else {
        setUserProfile(null)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [fetchOrCreateProfile])

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signInWithGoogle,
        signOut,
        setUserProfile,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
