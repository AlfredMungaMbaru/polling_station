/**
 * Email Notification Service
 * 
 * Handles sending email notifications for poll events, comments, and user engagement.
 * Supports multiple email providers and template management.
 */

import { 
  EmailNotificationType, 
  EmailNotification,
  EmailNotificationPreferences,
  EmailServiceConfig,
  EmailSendResult,
  NotificationQueueItem,
  UserSubscription,
  EmailValidationResult,
  NotificationScheduleOptions,
  PollClosingEmailData,
  PollClosedEmailData,
  NewCommentEmailData,
  CommentReplyEmailData,
  WeeklyDigestEmailData,
  EmailError,
  EmailErrorType
} from '@/types/notifications'

/**
 * Email notification service class
 */
export class EmailNotificationService {
  private static config: EmailServiceConfig = {
    provider: 'supabase',
    from_email: process.env.NEXT_PUBLIC_FROM_EMAIL || 'noreply@polling-station.com',
    from_name: 'Polling Station',
    reply_to: process.env.NEXT_PUBLIC_REPLY_TO_EMAIL || 'support@polling-station.com',
    base_url: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    api_key: process.env.EMAIL_SERVICE_API_KEY
  }

  /**
   * Send poll closing notification
   * 
   * @param data - Poll closing notification data
   * @returns Promise<EmailSendResult>
   */
  static async sendPollClosingNotification(data: PollClosingEmailData): Promise<EmailSendResult> {
    try {
      // Check if user wants this type of notification
      const preferences = await this.getUserNotificationPreferences(data.user_name)
      if (!preferences?.poll_closing_notifications) {
        return {
          success: true,
          message_id: 'skipped_user_preference'
        }
      }

      // Validate email and user subscription
      const isSubscribed = await this.isUserSubscribed(data.user_name)
      if (!isSubscribed) {
        throw new Error('User is not subscribed to notifications')
      }

      const notification: Partial<EmailNotification> = {
        type: EmailNotificationType.POLL_CLOSING_SOON,
        recipient_email: data.user_name, // In real app, this would be resolved to email
        subject: `⏰ Poll "${data.poll_title}" closes in ${data.hours_remaining} hours`,
        template_data: data,
        scheduled_at: new Date().toISOString()
      }

      // TODO: Replace with actual email service integration
      // await this.sendEmailViaProvider(notification)
      
      console.log('TODO: Send poll closing email via provider:', {
        to: data.user_name,
        subject: notification.subject,
        template: 'poll_closing',
        data: data
      })

      // Mock successful response
      return {
        success: true,
        message_id: `poll_closing_${Date.now()}`,
        details: { notification_type: 'poll_closing_soon' }
      }
    } catch (error) {
      console.error('Error sending poll closing notification:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Send poll closed notification with results
   * 
   * @param data - Poll closed notification data
   * @returns Promise<EmailSendResult>
   */
  static async sendPollClosedNotification(data: PollClosedEmailData): Promise<EmailSendResult> {
    try {
      const preferences = await this.getUserNotificationPreferences(data.user_name)
      if (!preferences?.poll_closed_notifications) {
        return { success: true, message_id: 'skipped_user_preference' }
      }

      const notification: Partial<EmailNotification> = {
        type: EmailNotificationType.POLL_CLOSED,
        recipient_email: data.user_name,
        subject: `📊 Poll Results: "${data.poll_title}" has closed`,
        template_data: data,
        scheduled_at: new Date().toISOString()
      }

      console.log('TODO: Send poll closed email via provider:', {
        to: data.user_name,
        subject: notification.subject,
        template: 'poll_closed',
        data: data
      })

      return {
        success: true,
        message_id: `poll_closed_${Date.now()}`,
        details: { notification_type: 'poll_closed' }
      }
    } catch (error) {
      console.error('Error sending poll closed notification:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Send new comment notification
   * 
   * @param data - New comment notification data
   * @returns Promise<EmailSendResult>
   */
  static async sendNewCommentNotification(data: NewCommentEmailData): Promise<EmailSendResult> {
    try {
      const preferences = await this.getUserNotificationPreferences(data.user_name)
      if (!preferences?.new_comment_notifications) {
        return { success: true, message_id: 'skipped_user_preference' }
      }

      const notification: Partial<EmailNotification> = {
        type: EmailNotificationType.NEW_COMMENT,
        recipient_email: data.user_name,
        subject: `💬 New comment on "${data.poll_title}"`,
        template_data: data,
        scheduled_at: new Date().toISOString()
      }

      console.log('TODO: Send new comment email via provider:', {
        to: data.user_name,
        subject: notification.subject,
        template: 'new_comment',
        data: data
      })

      return {
        success: true,
        message_id: `new_comment_${Date.now()}`,
        details: { notification_type: 'new_comment' }
      }
    } catch (error) {
      console.error('Error sending new comment notification:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Send comment reply notification
   * 
   * @param data - Comment reply notification data
   * @returns Promise<EmailSendResult>
   */
  static async sendCommentReplyNotification(data: CommentReplyEmailData): Promise<EmailSendResult> {
    try {
      const preferences = await this.getUserNotificationPreferences(data.user_name)
      if (!preferences?.comment_reply_notifications) {
        return { success: true, message_id: 'skipped_user_preference' }
      }

      const notification: Partial<EmailNotification> = {
        type: EmailNotificationType.COMMENT_REPLY,
        recipient_email: data.user_name,
        subject: `🔔 ${data.replier_name} replied to your comment`,
        template_data: data,
        scheduled_at: new Date().toISOString()
      }

      console.log('TODO: Send comment reply email via provider:', {
        to: data.user_name,
        subject: notification.subject,
        template: 'comment_reply',
        data: data
      })

      return {
        success: true,
        message_id: `comment_reply_${Date.now()}`,
        details: { notification_type: 'comment_reply' }
      }
    } catch (error) {
      console.error('Error sending comment reply notification:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Send weekly digest email
   * 
   * @param data - Weekly digest data
   * @returns Promise<EmailSendResult>
   */
  static async sendWeeklyDigest(data: WeeklyDigestEmailData): Promise<EmailSendResult> {
    try {
      const preferences = await this.getUserNotificationPreferences(data.user_name)
      if (!preferences?.weekly_digest) {
        return { success: true, message_id: 'skipped_user_preference' }
      }

      const notification: Partial<EmailNotification> = {
        type: EmailNotificationType.WEEKLY_DIGEST,
        recipient_email: data.user_name,
        subject: `📈 Your weekly polling activity summary`,
        template_data: data,
        scheduled_at: new Date().toISOString()
      }

      console.log('TODO: Send weekly digest email via provider:', {
        to: data.user_name,
        subject: notification.subject,
        template: 'weekly_digest',
        data: data
      })

      return {
        success: true,
        message_id: `weekly_digest_${Date.now()}`,
        details: { notification_type: 'weekly_digest' }
      }
    } catch (error) {
      console.error('Error sending weekly digest:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get user notification preferences
   * 
   * @param userId - User ID or email
   * @returns Promise<EmailNotificationPreferences | null>
   */
  static async getUserNotificationPreferences(userId: string): Promise<EmailNotificationPreferences | null> {
    try {
      // TODO: Replace with actual Supabase query
      // const { data, error } = await supabase
      //   .from('email_notification_preferences')
      //   .select('*')
      //   .eq('user_id', userId)
      //   .single()

      console.log('TODO: Fetch user notification preferences from Supabase:', userId)

      // Return default preferences for development
      return {
        user_id: userId,
        poll_closing_notifications: true,
        poll_closed_notifications: true,
        new_comment_notifications: true,
        comment_reply_notifications: true,
        weekly_digest: true,
        email_frequency: 'immediate',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error)
      return null
    }
  }

  /**
   * Update user notification preferences
   * 
   * @param userId - User ID
   * @param preferences - Updated preferences
   * @returns Promise<boolean>
   */
  static async updateUserNotificationPreferences(
    userId: string, 
    preferences: Partial<EmailNotificationPreferences>
  ): Promise<boolean> {
    try {
      // TODO: Replace with actual Supabase update
      // const { error } = await supabase
      //   .from('email_notification_preferences')
      //   .upsert({
      //     user_id: userId,
      //     ...preferences,
      //     updated_at: new Date().toISOString()
      //   })

      console.log('TODO: Update user notification preferences in Supabase:', {
        userId,
        preferences
      })

      return true
    } catch (error) {
      console.error('Error updating user preferences:', error)
      return false
    }
  }

  /**
   * Check if user is subscribed to email notifications
   * 
   * @param userEmail - User email
   * @returns Promise<boolean>
   */
  static async isUserSubscribed(userEmail: string): Promise<boolean> {
    try {
      // TODO: Replace with actual Supabase query
      // const { data, error } = await supabase
      //   .from('user_subscriptions')
      //   .select('is_subscribed')
      //   .eq('email', userEmail)
      //   .single()

      console.log('TODO: Check user subscription status in Supabase:', userEmail)

      // Default to subscribed for development
      return true
    } catch (error) {
      console.error('Error checking subscription status:', error)
      return false
    }
  }

  /**
   * Unsubscribe user from email notifications
   * 
   * @param userEmail - User email
   * @param unsubscribeToken - Unsubscribe token for security
   * @returns Promise<boolean>
   */
  static async unsubscribeUser(userEmail: string, unsubscribeToken?: string): Promise<boolean> {
    try {
      // TODO: Replace with actual Supabase update
      // const { error } = await supabase
      //   .from('user_subscriptions')
      //   .update({
      //     is_subscribed: false,
      //     unsubscribed_at: new Date().toISOString()
      //   })
      //   .eq('email', userEmail)
      //   .eq('unsubscribe_token', unsubscribeToken)

      console.log('TODO: Unsubscribe user in Supabase:', {
        userEmail,
        unsubscribeToken
      })

      return true
    } catch (error) {
      console.error('Error unsubscribing user:', error)
      return false
    }
  }

  /**
   * Validate email address
   * 
   * @param email - Email to validate
   * @returns EmailValidationResult
   */
  static validateEmail(email: string): EmailValidationResult {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const errors: string[] = []

    if (!email || email.trim().length === 0) {
      errors.push('Email is required')
    } else if (!emailRegex.test(email)) {
      errors.push('Invalid email format')
    } else if (email.length > 254) {
      errors.push('Email is too long')
    }

    // Check for common typos
    const suggestions: string[] = []
    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com']
    const domain = email.split('@')[1]?.toLowerCase()
    
    if (domain && !commonDomains.includes(domain)) {
      // Simple typo detection for common domains
      commonDomains.forEach(commonDomain => {
        if (this.levenshteinDistance(domain, commonDomain) <= 2) {
          suggestions.push(email.replace(domain, commonDomain))
        }
      })
    }

    return {
      is_valid: errors.length === 0,
      email: email.trim().toLowerCase(),
      errors,
      suggestions: suggestions.length > 0 ? suggestions : undefined
    }
  }

  /**
   * Schedule notification for later sending
   * 
   * @param type - Notification type
   * @param recipientEmail - Recipient email
   * @param templateData - Template data
   * @param options - Scheduling options
   * @returns Promise<string> - Queue item ID
   */
  static async scheduleNotification(
    type: EmailNotificationType,
    recipientEmail: string,
    templateData: Record<string, unknown>,
    options: NotificationScheduleOptions = {}
  ): Promise<string> {
    try {
      const scheduleTime = options.immediate 
        ? new Date()
        : new Date(Date.now() + (options.delay_minutes || 0) * 60000)

      const queueItem: Partial<NotificationQueueItem> = {
        type,
        recipient_email: recipientEmail,
        template_data: templateData,
        priority: 'normal',
        scheduled_at: scheduleTime.toISOString(),
        attempts: 0,
        max_attempts: 3
      }

      // TODO: Replace with actual Supabase insertion
      // const { data, error } = await supabase
      //   .from('notification_queue')
      //   .insert(queueItem)
      //   .select()
      //   .single()

      console.log('TODO: Schedule notification in Supabase queue:', queueItem)

      const queueId = `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      return queueId
    } catch (error) {
      console.error('Error scheduling notification:', error)
      throw error
    }
  }

  /**
   * Process notification queue (to be run by cron job)
   * 
   * @returns Promise<number> - Number of notifications processed
   */
  static async processNotificationQueue(): Promise<number> {
    try {
      // TODO: Replace with actual Supabase query for pending notifications
      console.log('TODO: Process notification queue from Supabase')

      // Mock processing
      return 0
    } catch (error) {
      console.error('Error processing notification queue:', error)
      return 0
    }
  }

  /**
   * Calculate Levenshtein distance for typo detection
   * 
   * @param str1 - First string
   * @param str2 - Second string
   * @returns number - Edit distance
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        )
      }
    }

    return matrix[str2.length][str1.length]
  }

  /**
   * Generate unsubscribe token
   * 
   * @param userEmail - User email
   * @returns string - Secure unsubscribe token
   */
  static generateUnsubscribeToken(userEmail: string): string {
    // In production, use proper cryptographic functions
    const timestamp = Date.now().toString()
    const randomPart = Math.random().toString(36).substr(2, 15)
    return Buffer.from(`${userEmail}:${timestamp}:${randomPart}`).toString('base64')
  }
}

/**
 * Database schema for Supabase (to be created)
 */
/*
-- Email notification preferences table
CREATE TABLE email_notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  poll_closing_notifications BOOLEAN DEFAULT true,
  poll_closed_notifications BOOLEAN DEFAULT true,
  new_comment_notifications BOOLEAN DEFAULT true,
  comment_reply_notifications BOOLEAN DEFAULT true,
  weekly_digest BOOLEAN DEFAULT true,
  email_frequency VARCHAR(20) DEFAULT 'immediate' CHECK (email_frequency IN ('immediate', 'daily', 'weekly')),
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User subscriptions table
CREATE TABLE user_subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  is_subscribed BOOLEAN DEFAULT true,
  subscription_source VARCHAR(50) DEFAULT 'registration',
  unsubscribe_token VARCHAR(255) UNIQUE,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  
  INDEX idx_user_subscriptions_email (email),
  INDEX idx_user_subscriptions_token (unsubscribe_token)
);

-- Email notifications log table
CREATE TABLE email_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  subject TEXT NOT NULL,
  template_data JSONB NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_email_notifications_type (type),
  INDEX idx_email_notifications_recipient (recipient_email),
  INDEX idx_email_notifications_scheduled (scheduled_at),
  INDEX idx_email_notifications_status (sent_at, failed_at)
);

-- Notification queue table
CREATE TABLE notification_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  template_data JSONB NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_notification_queue_scheduled (scheduled_at),
  INDEX idx_notification_queue_priority (priority),
  INDEX idx_notification_queue_status (processed_at)
);

-- RLS Policies
ALTER TABLE email_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- Users can manage their own preferences
CREATE POLICY "Users can manage their notification preferences" ON email_notification_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Users can manage their own subscription
CREATE POLICY "Users can manage their subscription" ON user_subscriptions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Users can view their own notification history
CREATE POLICY "Users can view their notification history" ON email_notifications
  FOR SELECT USING (recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid()));
*/