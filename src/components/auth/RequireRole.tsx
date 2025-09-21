/**
 * Role-Based Access Control Components
 * 
 * These components provide declarative role and permission-based access control
 * for React components throughout the application.
 */

import React from 'react'
import { useAuth } from '@/components/AuthProvider'
import { UserRole, Permission } from '@/types/roles'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Shield, Lock } from 'lucide-react'

interface RequireRoleProps {
  role: UserRole
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface RequirePermissionProps {
  permission: Permission
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface UnauthorizedProps {
  message?: string
  showLoginButton?: boolean
}

/**
 * Component that renders children only if user has required role
 */
export const RequireRole: React.FC<RequireRoleProps> = ({ 
  role, 
  children, 
  fallback 
}) => {
  const { hasRole, user } = useAuth()
  
  if (!user) {
    return fallback || <UnauthorizedAccess message="Please log in to access this page" showLoginButton />
  }
  
  if (!hasRole(role)) {
    return fallback || <UnauthorizedAccess message="You don't have permission to access this page" />
  }
  
  return <>{children}</>
}

/**
 * Component that renders children only if user has required permission
 */
export const RequirePermission: React.FC<RequirePermissionProps> = ({ 
  permission, 
  children, 
  fallback 
}) => {
  const { userProfile, user } = useAuth()
  
  if (!user) {
    return fallback || <UnauthorizedAccess message="Please log in to access this feature" showLoginButton />
  }
  
  if (!userProfile) {
    return fallback || <UnauthorizedAccess message="Loading user permissions..." />
  }
  
  // Check if user has permission (implement this based on your role service)
  // For now, we'll use a basic check
  const hasPermission = userProfile.role === 'admin' // Simplified check
  
  if (!hasPermission) {
    return fallback || <UnauthorizedAccess message="You don't have permission to access this feature" />
  }
  
  return <>{children}</>
}

/**
 * Default unauthorized access component
 */
const UnauthorizedAccess: React.FC<UnauthorizedProps> = ({ 
  message = "Access denied", 
  showLoginButton = false 
}) => {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <div className="text-center max-w-md">
        <div className="mb-4 flex justify-center">
          <div className="p-3 bg-red-100 rounded-full">
            <Lock className="h-8 w-8 text-red-600" />
          </div>
        </div>
        
        <Alert className="mb-4">
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-left">
            {message}
          </AlertDescription>
        </Alert>
        
        {showLoginButton && (
          <Button 
            onClick={() => window.location.href = '/auth/signin'}
            className="mt-4"
          >
            Sign In
          </Button>
        )}
      </div>
    </div>
  )
}