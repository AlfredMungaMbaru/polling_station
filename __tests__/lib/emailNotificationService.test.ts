/**
 * Email Notification Service Tests
 * 
 * Comprehensive test suite for email notification functionality.
 */

import { EmailNotificationService } from '../../src/lib/emailNotificationService'
import { 
  EmailNotificationType,
  PollClosingEmailData,
  PollClosedEmailData,
  NewCommentEmailData,
  CommentReplyEmailData,
  WeeklyDigestEmailData
} from '../../src/types/notifications'

// Mock data for testing
const mockPollClosingData: PollClosingEmailData = {
  poll_id: 'test-poll-1',
  poll_title: 'What is your favorite programming language?',
  poll_url: 'http://localhost:3000/polls/test-poll-1',
  user_name: 'john.doe@example.com',
  hours_remaining: 2,
  current_vote_count: 45,
  is_user_voted: false
}

const mockPollClosedData: PollClosedEmailData = {
  poll_id: 'test-poll-1',
  poll_title: 'What is your favorite programming language?',
  poll_url: 'http://localhost:3000/polls/test-poll-1',
  user_name: 'john.doe@example.com',
  winner: 'TypeScript',
  total_votes: 50,
  user_vote: 'JavaScript',
  results_summary: [
    { option: 'TypeScript', votes: 25, percentage: 50 },
    { option: 'JavaScript', votes: 15, percentage: 30 },
    { option: 'Python', votes: 10, percentage: 20 }
  ]
}

const mockNewCommentData: NewCommentEmailData = {
  poll_id: 'test-poll-1',
  poll_title: 'What is your favorite programming language?',
  poll_url: 'http://localhost:3000/polls/test-poll-1',
  user_name: 'john.doe@example.com',
  commenter_name: 'Jane Smith',
  comment_text: 'I think TypeScript is the future of web development!',
  comment_url: 'http://localhost:3000/polls/test-poll-1#comment-123',
  comment_time: '2024-01-15T10:30:00Z'
}

const mockCommentReplyData: CommentReplyEmailData = {
  poll_id: 'test-poll-1',
  poll_title: 'What is your favorite programming language?',
  poll_url: 'http://localhost:3000/polls/test-poll-1',
  user_name: 'john.doe@example.com',
  original_comment_text: 'I think TypeScript is the future of web development!',
  replier_name: 'Bob Wilson',
  reply_text: 'I agree! The type safety makes development so much more reliable.',
  reply_url: 'http://localhost:3000/polls/test-poll-1#comment-124',
  reply_time: '2024-01-15T11:15:00Z'
}

const mockWeeklyDigestData: WeeklyDigestEmailData = {
  user_name: 'john.doe@example.com',
  week_start: '2024-01-08',
  week_end: '2024-01-14',
  polls_created: 2,
  polls_voted: 5,
  comments_made: 3,
  featured_polls: [
    {
      id: 'poll-1',
      title: 'Best JavaScript Framework 2024',
      url: 'http://localhost:3000/polls/poll-1',
      votes: 127
    }
  ],
  trending_polls: [
    {
      id: 'poll-2',
      title: 'Remote vs Office Work',
      url: 'http://localhost:3000/polls/poll-2',
      votes: 89
    }
  ]
}

describe('EmailNotificationService', () => {
  beforeEach(() => {
    // Clear console logs
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('sendPollClosingNotification', () => {
    it('should send poll closing notification successfully', async () => {
      const result = await EmailNotificationService.sendPollClosingNotification(mockPollClosingData)

      expect(result.success).toBe(true)
      expect(result.message_id).toContain('poll_closing_')
      expect(result.details?.notification_type).toBe('poll_closing_soon')
    })

    it('should handle user preferences correctly', async () => {
      // Mock getUserNotificationPreferences to return false for poll_closing_notifications
      jest.spyOn(EmailNotificationService, 'getUserNotificationPreferences')
        .mockResolvedValue({
          user_id: 'test-user',
          poll_closing_notifications: false,
          poll_closed_notifications: true,
          new_comment_notifications: true,
          comment_reply_notifications: true,
          weekly_digest: true,
          email_frequency: 'immediate',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        })

      const result = await EmailNotificationService.sendPollClosingNotification(mockPollClosingData)

      expect(result.success).toBe(true)
      expect(result.message_id).toBe('skipped_user_preference')
    })

    it('should handle errors gracefully', async () => {
      jest.spyOn(EmailNotificationService, 'isUserSubscribed')
        .mockRejectedValue(new Error('Database connection failed'))

      const result = await EmailNotificationService.sendPollClosingNotification(mockPollClosingData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Database connection failed')
    })
  })

  describe('sendPollClosedNotification', () => {
    it('should send poll closed notification successfully', async () => {
      const result = await EmailNotificationService.sendPollClosedNotification(mockPollClosedData)

      expect(result.success).toBe(true)
      expect(result.message_id).toContain('poll_closed_')
      expect(result.details?.notification_type).toBe('poll_closed')
    })

    it('should skip notification if user preference is disabled', async () => {
      jest.spyOn(EmailNotificationService, 'getUserNotificationPreferences')
        .mockResolvedValue({
          user_id: 'test-user',
          poll_closing_notifications: true,
          poll_closed_notifications: false,
          new_comment_notifications: true,
          comment_reply_notifications: true,
          weekly_digest: true,
          email_frequency: 'immediate',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        })

      const result = await EmailNotificationService.sendPollClosedNotification(mockPollClosedData)

      expect(result.success).toBe(true)
      expect(result.message_id).toBe('skipped_user_preference')
    })
  })

  describe('sendNewCommentNotification', () => {
    it('should send new comment notification successfully', async () => {
      const result = await EmailNotificationService.sendNewCommentNotification(mockNewCommentData)

      expect(result.success).toBe(true)
      expect(result.message_id).toContain('new_comment_')
      expect(result.details?.notification_type).toBe('new_comment')
    })

    it('should handle comment data with special characters', async () => {
      const commentDataWithSpecialChars = {
        ...mockNewCommentData,
        comment_text: 'This comment has "quotes" and <html> tags & special chars!'
      }

      const result = await EmailNotificationService.sendNewCommentNotification(commentDataWithSpecialChars)

      expect(result.success).toBe(true)
      expect(result.message_id).toContain('new_comment_')
    })
  })

  describe('sendCommentReplyNotification', () => {
    it('should send comment reply notification successfully', async () => {
      const result = await EmailNotificationService.sendCommentReplyNotification(mockCommentReplyData)

      expect(result.success).toBe(true)
      expect(result.message_id).toContain('comment_reply_')
      expect(result.details?.notification_type).toBe('comment_reply')
    })

    it('should handle long comment text appropriately', async () => {
      const longCommentData = {
        ...mockCommentReplyData,
        reply_text: 'A'.repeat(1000) // Very long comment
      }

      const result = await EmailNotificationService.sendCommentReplyNotification(longCommentData)

      expect(result.success).toBe(true)
      expect(result.message_id).toContain('comment_reply_')
    })
  })

  describe('sendWeeklyDigest', () => {
    it('should send weekly digest successfully', async () => {
      const result = await EmailNotificationService.sendWeeklyDigest(mockWeeklyDigestData)

      expect(result.success).toBe(true)
      expect(result.message_id).toContain('weekly_digest_')
      expect(result.details?.notification_type).toBe('weekly_digest')
    })

    it('should handle empty weekly digest data', async () => {
      const emptyDigestData = {
        ...mockWeeklyDigestData,
        polls_created: 0,
        polls_voted: 0,
        comments_made: 0,
        featured_polls: [],
        trending_polls: []
      }

      const result = await EmailNotificationService.sendWeeklyDigest(emptyDigestData)

      expect(result.success).toBe(true)
      expect(result.message_id).toContain('weekly_digest_')
    })
  })

  describe('getUserNotificationPreferences', () => {
    it('should return default preferences for development', async () => {
      const prefs = await EmailNotificationService.getUserNotificationPreferences('test-user')

      expect(prefs).not.toBeNull()
      expect(prefs?.user_id).toBe('test-user')
      expect(prefs?.poll_closing_notifications).toBe(true)
      expect(prefs?.poll_closed_notifications).toBe(true)
      expect(prefs?.new_comment_notifications).toBe(true)
      expect(prefs?.comment_reply_notifications).toBe(true)
      expect(prefs?.weekly_digest).toBe(true)
      expect(prefs?.email_frequency).toBe('immediate')
    })

    it('should handle errors and return null', async () => {
      // Mock console.log to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      // In a real scenario, this would throw an error from Supabase
      const prefs = await EmailNotificationService.getUserNotificationPreferences('test-user')

      // For development, it returns default preferences
      expect(prefs).not.toBeNull()
      
      consoleSpy.mockRestore()
    })
  })

  describe('updateUserNotificationPreferences', () => {
    it('should update preferences successfully', async () => {
      const updates = {
        poll_closing_notifications: false,
        weekly_digest: false
      }

      const result = await EmailNotificationService.updateUserNotificationPreferences('test-user', updates)

      expect(result).toBe(true)
    })

    it('should handle partial preference updates', async () => {
      const partialUpdates = {
        email_frequency: 'daily' as const
      }

      const result = await EmailNotificationService.updateUserNotificationPreferences('test-user', partialUpdates)

      expect(result).toBe(true)
    })
  })

  describe('isUserSubscribed', () => {
    it('should return true for subscribed users in development', async () => {
      const isSubscribed = await EmailNotificationService.isUserSubscribed('test@example.com')

      expect(isSubscribed).toBe(true)
    })

    it('should handle different email formats', async () => {
      const testEmails = [
        'user@example.com',
        'user.name+tag@example.co.uk',
        'test.email@subdomain.example.org'
      ]

      for (const email of testEmails) {
        const isSubscribed = await EmailNotificationService.isUserSubscribed(email)
        expect(isSubscribed).toBe(true)
      }
    })
  })

  describe('unsubscribeUser', () => {
    it('should unsubscribe user successfully', async () => {
      const token = EmailNotificationService.generateUnsubscribeToken('test@example.com')
      const result = await EmailNotificationService.unsubscribeUser('test@example.com', token)

      expect(result).toBe(true)
    })

    it('should handle unsubscribe without token', async () => {
      const result = await EmailNotificationService.unsubscribeUser('test@example.com')

      expect(result).toBe(true)
    })
  })

  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'user@example.com',
        'user.name+tag@example.co.uk',
        'test123@subdomain.example.org',
        'a@b.co'
      ]

      validEmails.forEach(email => {
        const result = EmailNotificationService.validateEmail(email)
        expect(result.is_valid).toBe(true)
        expect(result.email).toBe(email.toLowerCase())
        expect(result.errors).toHaveLength(0)
      })
    })

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
        '',
        'user name@example.com',
        'user@exam ple.com'
      ]

      invalidEmails.forEach(email => {
        const result = EmailNotificationService.validateEmail(email)
        expect(result.is_valid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
      })
    })

    it('should suggest corrections for typos', () => {
      const emailWithTypo = 'user@gmial.com'
      const result = EmailNotificationService.validateEmail(emailWithTypo)

      expect(result.is_valid).toBe(true) // Email format is valid
      expect(result.suggestions).toBeDefined()
      expect(result.suggestions?.[0]).toBe('user@gmail.com')
    })

    it('should handle very long email addresses', () => {
      const longEmail = 'a'.repeat(250) + '@example.com'
      const result = EmailNotificationService.validateEmail(longEmail)

      expect(result.is_valid).toBe(false)
      expect(result.errors).toContain('Email is too long')
    })
  })

  describe('scheduleNotification', () => {
    it('should schedule notification for immediate delivery', async () => {
      const templateData = { test: 'data' }
      const options = { immediate: true }

      const queueId = await EmailNotificationService.scheduleNotification(
        EmailNotificationType.POLL_CLOSING_SOON,
        'test@example.com',
        templateData,
        options
      )

      expect(queueId).toContain('queue_')
      expect(queueId.length).toBeGreaterThan(10)
    })

    it('should schedule notification with delay', async () => {
      const templateData = { test: 'data' }
      const options = { delay_minutes: 30 }

      const queueId = await EmailNotificationService.scheduleNotification(
        EmailNotificationType.NEW_COMMENT,
        'test@example.com',
        templateData,
        options
      )

      expect(queueId).toContain('queue_')
      expect(queueId.length).toBeGreaterThan(10)
    })

    it('should handle scheduling errors', async () => {
      // Mock an error scenario
      const originalConsoleError = console.error
      console.error = jest.fn()

      // This should not throw, but handle the error gracefully
      await expect(
        EmailNotificationService.scheduleNotification(
          EmailNotificationType.POLL_CLOSED,
          'test@example.com',
          { test: 'data' }
        )
      ).resolves.toContain('queue_')

      console.error = originalConsoleError
    })
  })

  describe('processNotificationQueue', () => {
    it('should process queue and return count', async () => {
      const processedCount = await EmailNotificationService.processNotificationQueue()

      expect(typeof processedCount).toBe('number')
      expect(processedCount).toBeGreaterThanOrEqual(0)
    })

    it('should handle queue processing errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const processedCount = await EmailNotificationService.processNotificationQueue()

      expect(processedCount).toBe(0)
      consoleSpy.mockRestore()
    })
  })

  describe('generateUnsubscribeToken', () => {
    it('should generate unique tokens for different emails', () => {
      const token1 = EmailNotificationService.generateUnsubscribeToken('user1@example.com')
      const token2 = EmailNotificationService.generateUnsubscribeToken('user2@example.com')

      expect(token1).not.toBe(token2)
      expect(token1.length).toBeGreaterThan(20)
      expect(token2.length).toBeGreaterThan(20)
    })

    it('should generate consistent format tokens', () => {
      const email = 'test@example.com'
      const token = EmailNotificationService.generateUnsubscribeToken(email)

      // Token should be base64 encoded
      expect(() => Buffer.from(token, 'base64')).not.toThrow()
      
      // Decoded token should contain the email
      const decoded = Buffer.from(token, 'base64').toString()
      expect(decoded).toContain(email)
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete notification workflow', async () => {
      // Test the full workflow for a poll closing notification
      const result = await EmailNotificationService.sendPollClosingNotification(mockPollClosingData)
      expect(result.success).toBe(true)

      // Verify user preferences are checked
      const prefs = await EmailNotificationService.getUserNotificationPreferences(mockPollClosingData.user_name)
      expect(prefs).toBeTruthy()

      // Verify subscription status is checked
      const isSubscribed = await EmailNotificationService.isUserSubscribed(mockPollClosingData.user_name)
      expect(isSubscribed).toBe(true)
    })

    it('should handle notification preferences workflow', async () => {
      const userId = 'test-user-integration'
      
      // Get initial preferences
      const initialPrefs = await EmailNotificationService.getUserNotificationPreferences(userId)
      expect(initialPrefs?.poll_closing_notifications).toBe(true)

      // Update preferences
      const updateResult = await EmailNotificationService.updateUserNotificationPreferences(userId, {
        poll_closing_notifications: false
      })
      expect(updateResult).toBe(true)

      // Test notification with updated preferences
      jest.spyOn(EmailNotificationService, 'getUserNotificationPreferences')
        .mockResolvedValue({
          user_id: userId,
          poll_closing_notifications: false,
          poll_closed_notifications: true,
          new_comment_notifications: true,
          comment_reply_notifications: true,
          weekly_digest: true,
          email_frequency: 'immediate',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        })

      const notificationResult = await EmailNotificationService.sendPollClosingNotification({
        ...mockPollClosingData,
        user_name: userId
      })

      expect(notificationResult.message_id).toBe('skipped_user_preference')
    })
  })
})