'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import { RoleService } from '@/lib/roleService'
import { UserProfile, UserRole, USER_ROLES } from '@/types/roles'

/**
 * Extended AuthContext that includes role-based authentication
 * Provides user authentication state along with role and permission information
 */
interface AuthContextType {
  user: User | null
  session: Session | null
  userProfile: UserProfile | null
  loading: boolean
  isAdmin: boolean
  hasRole: (role: UserRole) => boolean
  signIn: (email: string, password: string) => Promise<{ error: unknown }>
  signUp: (email: string, password: string) => Promise<{ error: unknown }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  /**
   * Load user profile data including role information
   * @param userId - The user ID to load profile for
   */
  const loadUserProfile = async (userId: string) => {
    try {
      const profile = await RoleService.getUserProfile(userId)
      setUserProfile(profile)
    } catch (error) {
      console.error('Error loading user profile:', error)
      setUserProfile(null)
    }
  }

  /**
   * Initialize user profile for new users
   * @param user - The authenticated user object
   */
  const initializeNewUser = async (user: User) => {
    try {
      const existingProfile = await RoleService.getUserProfile(user.id)
      if (!existingProfile) {
        const newProfile = await RoleService.initializeUserProfile(
          user.id,
          user.email || '',
          user.user_metadata?.display_name
        )
        setUserProfile(newProfile)
      } else {
        setUserProfile(existingProfile)
      }
    } catch (error) {
      console.error('Error initializing user profile:', error)
    }
  }

  /**
   * Refresh user profile data
   * Useful after role updates or profile changes
   */
  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user.id)
    }
  }

  /**
   * Check if current user has a specific role
   * @param role - Role to check against
   * @returns boolean indicating if user has the role
   */
  const hasRole = (role: UserRole): boolean => {
    return userProfile?.role === role || false
  }

  /**
   * Computed property to check if current user is an admin
   */
  const isAdmin = userProfile?.role === USER_ROLES.ADMIN

  useEffect(() => {
    // Get initial session and load user profile
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await loadUserProfile(session.user.id)
      }
      
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes and update profile accordingly
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // For new sign-ups, initialize profile
          if (event === 'SIGNED_IN') {
            await loadUserProfile(session.user.id)
          } else {
            await loadUserProfile(session.user.id)
          }
        } else {
          // Clear profile when user signs out
          setUserProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = {
    user,
    session,
    userProfile,
    loading,
    isAdmin,
    hasRole,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}