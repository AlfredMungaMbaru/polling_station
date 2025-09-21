/**
 * Email Notification Types
 * 
 * TypeScript interfaces for the email notification system.
 * Supports various notification types, templates, and user preferences.
 */

/**
 * Email notification types
 */
export enum EmailNotificationType {
  POLL_CLOSING_SOON = 'poll_closing_soon',
  POLL_CLOSED = 'poll_closed',
  NEW_COMMENT = 'new_comment',
  COMMENT_REPLY = 'comment_reply',
  POLL_RESULTS_READY = 'poll_results_ready',
  WEEKLY_DIGEST = 'weekly_digest'
}

/**
 * Base email notification interface
 */
export interface EmailNotification {
  id: string
  type: EmailNotificationType
  recipient_email: string
  recipient_name?: string
  subject: string
  template_data: Record<string, unknown>
  scheduled_at?: string
  sent_at?: string | null
  failed_at?: string | null
  error_message?: string | null
  created_at: string
  updated_at: string
}

/**
 * Email template data types for different notification scenarios
 */
export interface PollClosingEmailData {
  poll_id: string
  poll_title: string
  poll_url: string
  user_name: string
  hours_remaining: number
  current_vote_count: number
  is_user_voted: boolean
  [key: string]: unknown // Allow additional properties
}

export interface PollClosedEmailData {
  poll_id: string
  poll_title: string
  poll_url: string
  user_name: string
  winner: string
  total_votes: number
  user_vote?: string
  results_summary: Array<{
    option: string
    votes: number
    percentage: number
  }>
  [key: string]: unknown // Allow additional properties
}

export interface NewCommentEmailData {
  poll_id: string
  poll_title: string
  poll_url: string
  user_name: string
  commenter_name: string
  comment_text: string
  comment_url: string
  comment_time: string
  [key: string]: unknown // Allow additional properties
}

export interface CommentReplyEmailData {
  poll_id: string
  poll_title: string
  poll_url: string
  user_name: string
  original_comment_text: string
  replier_name: string
  reply_text: string
  reply_url: string
  reply_time: string
  [key: string]: unknown // Allow additional properties
}

export interface WeeklyDigestEmailData {
  user_name: string
  week_start: string
  week_end: string
  polls_created: number
  polls_voted: number
  comments_made: number
  featured_polls: Array<{
    id: string
    title: string
    url: string
    votes: number
  }>
  trending_polls: Array<{
    id: string
    title: string
    url: string
    votes: number
  }>
  [key: string]: unknown // Allow additional properties
}

/**
 * Email notification preferences
 */
export interface EmailNotificationPreferences {
  user_id: string
  poll_closing_notifications: boolean
  poll_closed_notifications: boolean
  new_comment_notifications: boolean
  comment_reply_notifications: boolean
  weekly_digest: boolean
  email_frequency: 'immediate' | 'daily' | 'weekly'
  quiet_hours_start?: string // HH:MM format
  quiet_hours_end?: string   // HH:MM format
  created_at: string
  updated_at: string
}

/**
 * Email service configuration
 */
export interface EmailServiceConfig {
  provider: 'supabase' | 'sendgrid' | 'resend' | 'nodemailer'
  api_key?: string
  from_email: string
  from_name: string
  reply_to?: string
  base_url: string
  template_path?: string
}

/**
 * Email sending result
 */
export interface EmailSendResult {
  success: boolean
  message_id?: string
  error?: string
  details?: Record<string, unknown>
}

/**
 * Email template
 */
export interface EmailTemplate {
  type: EmailNotificationType
  subject_template: string
  html_template: string
  text_template: string
  variables: string[]
}

/**
 * Notification queue item
 */
export interface NotificationQueueItem {
  id: string
  type: EmailNotificationType
  recipient_email: string
  template_data: Record<string, unknown>
  priority: 'low' | 'normal' | 'high'
  scheduled_at: string
  attempts: number
  max_attempts: number
  last_attempt_at?: string | null
  created_at: string
}

/**
 * Email analytics data
 */
export interface EmailAnalytics {
  notification_type: EmailNotificationType
  total_sent: number
  total_delivered: number
  total_opened: number
  total_clicked: number
  total_failed: number
  bounce_rate: number
  open_rate: number
  click_rate: number
  date: string
}

/**
 * User subscription status
 */
export interface UserSubscription {
  user_id: string
  email: string
  is_subscribed: boolean
  subscription_source: 'registration' | 'poll_creation' | 'comment' | 'manual'
  unsubscribe_token?: string
  subscribed_at: string
  unsubscribed_at?: string | null
}

/**
 * Email validation result
 */
export interface EmailValidationResult {
  is_valid: boolean
  email: string
  errors: string[]
  suggestions?: string[]
}

/**
 * Notification scheduling options
 */
export interface NotificationScheduleOptions {
  immediate?: boolean
  delay_minutes?: number
  batch_with_similar?: boolean
  respect_quiet_hours?: boolean
  max_daily_limit?: number
}

/**
 * Email notification stats
 */
export interface NotificationStats {
  user_id: string
  total_notifications_sent: number
  last_notification_sent_at?: string | null
  notifications_this_week: number
  notifications_this_month: number
  average_open_rate: number
  preferred_notification_time?: string
}

/**
 * Error types for email operations
 */
export enum EmailErrorType {
  INVALID_EMAIL = 'invalid_email',
  TEMPLATE_NOT_FOUND = 'template_not_found',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  USER_UNSUBSCRIBED = 'user_unsubscribed',
  TEMPLATE_RENDER_ERROR = 'template_render_error',
  DELIVERY_FAILED = 'delivery_failed'
}

export interface EmailError {
  type: EmailErrorType
  message: string
  details?: Record<string, unknown>
  retry_after?: number
}