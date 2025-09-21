/**
 * Role-Based Access Control (RBAC) Hooks and Utilities
 * 
 * This module provides React hooks and utility functions for implementing
 * role-based access control throughout the application.
 */

import React from 'react'
import { useAuth } from '@/components/AuthProvider'
import { 
  UserRole, 
  Permission, 
  ROLE_PERMISSIONS, 
  USER_ROLES, 
  PERMISSIONS 
} from '@/types/roles'

/**
 * Hook to check if current user has specific permission
 * @param permission - Permission to check
 * @returns boolean indicating if user has permission
 */
export const usePermission = (permission: Permission): boolean => {
  const { userProfile } = useAuth()
  
  if (!userProfile) return false
  
  const userPermissions = ROLE_PERMISSIONS[userProfile.role] || []
  return userPermissions.includes(permission)
}

/**
 * Hook to check if current user has specific role
 * @param role - Role to check
 * @returns boolean indicating if user has role
 */
export const useRole = (role: UserRole): boolean => {
  const { hasRole } = useAuth()
  return hasRole(role)
}

/**
 * Hook to check if current user is an admin
 * @returns boolean indicating if user is admin
 */
export const useIsAdmin = (): boolean => {
  const { isAdmin } = useAuth()
  return isAdmin
}

/**
 * Hook to get current user's permissions
 * @returns Array of permissions for current user
 */
export const useUserPermissions = (): Permission[] => {
  const { userProfile } = useAuth()
  
  if (!userProfile) return []
  
  return ROLE_PERMISSIONS[userProfile.role] || []
}

/**
 * Hook for role-based conditional rendering
 * @param requiredRole - Role required to render content
 * @returns object with render method and loading state
 */
export const useRoleGuard = (requiredRole: UserRole) => {
  const { userProfile, loading } = useAuth()
  
  const hasRequiredRole = userProfile?.role === requiredRole
  const canRender = !loading && hasRequiredRole
  
  return {
    canRender,
    loading,
    hasRequiredRole,
    /**
     * Render content only if user has required role
     * @param content - React node to render
     * @param fallback - Optional fallback content
     */
    render: (content: React.ReactNode, fallback?: React.ReactNode) => {
      if (loading) return null
      return hasRequiredRole ? content : (fallback || null)
    }
  }
}

/**
 * Hook for permission-based conditional rendering
 * @param requiredPermission - Permission required to render content
 * @returns object with render method and permission state
 */
export const usePermissionGuard = (requiredPermission: Permission) => {
  const hasPermission = usePermission(requiredPermission)
  const { loading } = useAuth()
  
  return {
    hasPermission,
    loading,
    /**
     * Render content only if user has required permission
     * @param content - React node to render
     * @param fallback - Optional fallback content
     */
    render: (content: React.ReactNode, fallback?: React.ReactNode) => {
      if (loading) return null
      return hasPermission ? content : (fallback || null)
    }
  }
}

/**
 * Utility function to check if a role has specific permission
 * @param role - Role to check
 * @param permission - Permission to verify
 * @returns boolean indicating if role has permission
 */
export const roleHasPermission = (role: UserRole, permission: Permission): boolean => {
  const rolePermissions = ROLE_PERMISSIONS[role] || []
  return rolePermissions.includes(permission)
}

/**
 * Utility function to get all permissions for a role
 * @param role - Role to get permissions for
 * @returns Array of permissions
 */
export const getRolePermissions = (role: UserRole): Permission[] => {
  return ROLE_PERMISSIONS[role] || []
}

/**
 * Utility function to check if user can perform poll management actions
 * @param userRole - User's role
 * @returns Object with poll management permissions
 */
export const getPollManagementPermissions = (userRole?: UserRole) => {
  if (!userRole) {
    return {
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canView: false,
      canVote: false
    }
  }
  
  return {
    canCreate: roleHasPermission(userRole, PERMISSIONS.CREATE_POLL),
    canEdit: roleHasPermission(userRole, PERMISSIONS.EDIT_POLL),
    canDelete: roleHasPermission(userRole, PERMISSIONS.DELETE_POLL),
    canView: roleHasPermission(userRole, PERMISSIONS.VIEW_POLL),
    canVote: roleHasPermission(userRole, PERMISSIONS.VOTE_ON_POLL)
  }
}

/**
 * Utility function to check if user can perform user management actions
 * @param userRole - User's role
 * @returns Object with user management permissions
 */
export const getUserManagementPermissions = (userRole?: UserRole) => {
  if (!userRole) {
    return {
      canManageUsers: false,
      canViewUserList: false,
      canViewAnalytics: false,
      canExportData: false
    }
  }
  
  return {
    canManageUsers: roleHasPermission(userRole, PERMISSIONS.MANAGE_USERS),
    canViewUserList: roleHasPermission(userRole, PERMISSIONS.VIEW_USER_LIST),
    canViewAnalytics: roleHasPermission(userRole, PERMISSIONS.VIEW_ANALYTICS),
    canExportData: roleHasPermission(userRole, PERMISSIONS.EXPORT_DATA)
  }
}

/**
 * Error types for unauthorized access attempts
 */
export interface UnauthorizedError {
  type: 'INSUFFICIENT_PERMISSIONS' | 'ROLE_REQUIRED' | 'LOGIN_REQUIRED'
  message: string
  requiredRole?: UserRole
  requiredPermission?: Permission
}

/**
 * Utility function to create unauthorized error objects
 * @param type - Type of unauthorized access
 * @param details - Additional details for the error
 * @returns UnauthorizedError object
 */
export const createUnauthorizedError = (
  type: UnauthorizedError['type'],
  details: Partial<UnauthorizedError> = {}
): UnauthorizedError => {
  const messages = {
    INSUFFICIENT_PERMISSIONS: 'You do not have permission to perform this action.',
    ROLE_REQUIRED: `This action requires ${details.requiredRole || 'specific'} role.`,
    LOGIN_REQUIRED: 'You must be logged in to perform this action.'
  }
  
  return {
    type,
    message: details.message || messages[type],
    ...details
  }
}

/**
 * Higher-order component for role-based route protection
 * @param WrappedComponent - Component to protect
 * @param requiredRole - Role required to access component
 * @returns Protected component
 */
export const withRoleProtection = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredRole: UserRole
) => {
  const ProtectedComponent = (props: P) => {
    const { userProfile, loading } = useAuth()
    
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      )
    }
    
    if (!userProfile) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-gray-600">Please log in to access this page.</p>
          </div>
        </div>
      )
    }
    
    if (userProfile.role !== requiredRole) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600">
              You do not have permission to access this page.
              {requiredRole === USER_ROLES.ADMIN && ' Admin access required.'}
            </p>
          </div>
        </div>
      )
    }
    
    return <WrappedComponent {...props} />
  }
  
  ProtectedComponent.displayName = `withRoleProtection(${WrappedComponent.displayName || WrappedComponent.name})`
  
  return ProtectedComponent
}