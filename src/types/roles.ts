/**
 * Role Management Types and Constants
 * 
 * This module defines the core types and constants for the role-based access control system.
 * It provides TypeScript support for user roles, permissions, and related operations.
 */

/**
 * Available user roles in the application
 * - ADMIN: Full access to create, edit, delete polls and manage users
 * - USER: Limited access to view and vote on polls only
 */
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
} as const

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]

/**
 * Permissions associated with each role
 * Used for fine-grained access control throughout the application
 */
export const PERMISSIONS = {
  // Poll management permissions
  CREATE_POLL: 'create_poll',
  EDIT_POLL: 'edit_poll',
  DELETE_POLL: 'delete_poll',
  VIEW_POLL: 'view_poll',
  VOTE_ON_POLL: 'vote_on_poll',
  
  // User management permissions
  MANAGE_USERS: 'manage_users',
  VIEW_USER_LIST: 'view_user_list',
  
  // Analytics and reporting
  VIEW_ANALYTICS: 'view_analytics',
  EXPORT_DATA: 'export_data'
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

/**
 * Role-to-permissions mapping
 * Defines which permissions each role has access to
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [USER_ROLES.ADMIN]: [
    PERMISSIONS.CREATE_POLL,
    PERMISSIONS.EDIT_POLL,
    PERMISSIONS.DELETE_POLL,
    PERMISSIONS.VIEW_POLL,
    PERMISSIONS.VOTE_ON_POLL,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USER_LIST,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.EXPORT_DATA
  ],
  [USER_ROLES.USER]: [
    PERMISSIONS.VIEW_POLL,
    PERMISSIONS.VOTE_ON_POLL
  ]
}

/**
 * Extended user profile that includes role information
 * This extends the base Supabase User type with role-specific data
 */
export interface UserProfile {
  id: string
  email: string | null
  role: UserRole
  created_at: string
  updated_at: string
  display_name?: string
  avatar_url?: string
  is_active: boolean
}

/**
 * Role assignment and management types
 */
export interface RoleAssignment {
  user_id: string
  role: UserRole
  assigned_by: string
  assigned_at: string
  is_active: boolean
}

/**
 * Error types for role-based operations
 */
export interface RoleError {
  code: 'INSUFFICIENT_PERMISSIONS' | 'INVALID_ROLE' | 'USER_NOT_FOUND' | 'ROLE_ASSIGNMENT_FAILED'
  message: string
  details?: Record<string, unknown>
}

/**
 * Default role assignment for new users
 */
export const DEFAULT_USER_ROLE: UserRole = USER_ROLES.USER

/**
 * Role validation constants
 */
export const ROLE_VALIDATION = {
  MIN_ADMIN_COUNT: 1, // Ensure at least one admin exists
  MAX_ROLE_CHANGES_PER_DAY: 5, // Prevent excessive role changes
} as const

/**
 * UI display labels for roles
 * Used in dropdowns, badges, and other UI components
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  [USER_ROLES.ADMIN]: 'Administrator',
  [USER_ROLES.USER]: 'User'
}

/**
 * Role badge colors for UI components
 */
export const ROLE_COLORS: Record<UserRole, { bg: string; text: string; border: string }> = {
  [USER_ROLES.ADMIN]: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200'
  },
  [USER_ROLES.USER]: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200'
  }
}