/**
 * Comment System Types
 * 
 * TypeScript interfaces for the poll comments and discussion system.
 * Supports nested replies, moderation, and real-time updates.
 */

/**
 * Base comment interface
 */
export interface Comment {
  id: string
  poll_id: string
  user_id: string
  parent_id: string | null // For nested replies
  content: string
  is_moderated: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
  
  // Computed fields
  author?: CommentAuthor
  replies?: Comment[]
  reply_count?: number
  is_edited?: boolean
}

/**
 * Comment author information
 */
export interface CommentAuthor {
  id: string
  display_name: string
  email?: string
  avatar_url?: string
}

/**
 * Comment form data
 */
export interface CommentFormData {
  content: string
  parent_id?: string | null
}

/**
 * Comment submission payload
 */
export interface CommentSubmissionPayload {
  poll_id: string
  user_id: string
  content: string
  parent_id?: string | null
}

/**
 * Comment submission result
 */
export interface CommentSubmissionResult {
  success: boolean
  comment?: Comment
  error?: string
  message: string
}

/**
 * Comment thread configuration
 */
export interface CommentThreadConfig {
  poll_id: string
  max_depth: number
  allow_replies: boolean
  require_moderation: boolean
  sort_order: 'newest' | 'oldest' | 'most_replied'
}

/**
 * Comment moderation status
 */
export enum CommentModerationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FLAGGED = 'flagged'
}

/**
 * Comment validation errors
 */
export interface CommentValidationError {
  field: 'content' | 'poll_id' | 'user_id'
  message: string
  code: string
}

/**
 * Real-time comment update event
 */
export interface CommentUpdateEvent {
  type: 'comment_added' | 'comment_updated' | 'comment_deleted'
  poll_id: string
  comment: Comment
  timestamp: string
}

/**
 * Comment statistics for a poll
 */
export interface CommentStats {
  poll_id: string
  total_comments: number
  total_replies: number
  unique_commenters: number
  latest_comment_at: string | null
  most_active_user?: CommentAuthor
}