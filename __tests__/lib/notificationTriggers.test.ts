/**
 * Notification Trigger Service Tests
 * 
 * Tests for the notification trigger system that integrates with poll and comment events.
 */

import { NotificationTriggerService } from '../../src/lib/notificationTriggers'
import { EmailNotificationService } from '../../src/lib/emailNotificationService'
import type { Poll } from '../../src/data/mockPolls'
import type { Comment } from '../../src/types/comments'

// Mock the EmailNotificationService
jest.mock('../../src/lib/emailNotificationService')

// Mock poll data with future end date
const mockPoll: Poll & { votes?: any[], endsAt?: string } = {
  id: 'test-poll-1',
  question: 'What is your favorite programming language?',
  description: 'A poll to determine the most popular programming language.',
  options: [
    { id: 'opt-1', label: 'JavaScript', votes: 15 },
    { id: 'opt-2', label: 'TypeScript', votes: 25 },
    { id: 'opt-3', label: 'Python', votes: 10 }
  ],
  totalVotes: 50,
  createdAt: '2024-01-15T09:00:00Z',
  isActive: true,
  endsAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours from now
  votes: [
    { user: 'user1@example.com', option: 'opt-1', timestamp: '2024-01-15T10:00:00Z' },
    { user: 'user2@example.com', option: 'opt-2', timestamp: '2024-01-15T11:00:00Z' },
    { user: 'user3@example.com', option: 'opt-3', timestamp: '2024-01-15T12:00:00Z' }
  ]
}

const mockComment: Comment = {
  id: 'comment-1',
  poll_id: 'test-poll-1',
  user_id: 'user123',
  parent_id: null,
  content: 'I think TypeScript is the future of web development!',
  is_moderated: false,
  is_deleted: false,
  created_at: '2024-01-15T14:30:00Z',
  updated_at: '2024-01-15T14:30:00Z',
  author: {
    id: 'user123',
    display_name: 'Jane Smith',
    email: 'jane.smith@example.com',
    avatar_url: 'https://example.com/avatar.jpg'
  }
}

const mockReplyComment: Comment = {
  id: 'comment-2',
  poll_id: 'test-poll-1',
  user_id: 'user456',
  parent_id: 'comment-1',
  content: 'I agree! The type safety makes development so much more reliable.',
  is_moderated: false,
  is_deleted: false,
  created_at: '2024-01-15T15:00:00Z',
  updated_at: '2024-01-15T15:00:00Z',
  author: {
    id: 'user456',
    display_name: 'Bob Wilson',
    email: 'bob.wilson@example.com'
  }
}

describe('NotificationTriggerService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
    
    // Mock environment variables
    process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000'
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('schedulePollClosingReminders', () => {
    it('should schedule reminders for all time intervals', async () => {
      const subscribers = ['user1@example.com', 'user2@example.com']
      const mockScheduleNotification = jest.spyOn(EmailNotificationService, 'scheduleNotification')
        .mockResolvedValue('queue_123')

      await NotificationTriggerService.schedulePollClosingReminders(mockPoll, subscribers)

      // Should schedule 3 reminders (24h, 2h, 1h) for 2 subscribers = 6 calls
      expect(mockScheduleNotification).toHaveBeenCalledTimes(6)
      
      // Verify the correct data structure is passed
      expect(mockScheduleNotification).toHaveBeenCalledWith(
        'poll_closing_soon',
        'user1@example.com',
        expect.objectContaining({
          poll_id: 'test-poll-1',
          poll_title: 'What is your favorite programming language?',
          poll_url: 'http://localhost:3000/polls/test-poll-1',
          user_name: 'user1@example.com',
          current_vote_count: 3
        }),
        expect.objectContaining({
          delay_minutes: expect.any(Number)
        })
      )
    })

    it('should skip scheduling for polls without end dates', async () => {
      const pollWithoutEndDate = { ...mockPoll, endsAt: undefined }
      const subscribers = ['user1@example.com']
      const mockScheduleNotification = jest.spyOn(EmailNotificationService, 'scheduleNotification')

      await NotificationTriggerService.schedulePollClosingReminders(pollWithoutEndDate, subscribers)

      expect(mockScheduleNotification).not.toHaveBeenCalled()
    })

    it('should skip scheduling for past reminder times', async () => {
      // Set poll end time to 30 minutes from now (only 1-hour reminder should be skipped)
      const nearFuturePoll = {
        ...mockPoll,
        endsAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
      }
      const subscribers = ['user1@example.com']
      const mockScheduleNotification = jest.spyOn(EmailNotificationService, 'scheduleNotification')
        .mockResolvedValue('queue_123')

      await NotificationTriggerService.schedulePollClosingReminders(nearFuturePoll, subscribers)

      // Should not schedule any reminders since all reminder times would be in the past
      expect(mockScheduleNotification).not.toHaveBeenCalled()
    })

    it('should handle scheduling errors gracefully', async () => {
      const subscribers = ['user1@example.com']
      jest.spyOn(EmailNotificationService, 'scheduleNotification')
        .mockRejectedValue(new Error('Scheduling failed'))

      await expect(
        NotificationTriggerService.schedulePollClosingReminders(mockPoll, subscribers)
      ).resolves.not.toThrow()

      expect(console.error).toHaveBeenCalledWith(
        'Error scheduling poll closing reminders:',
        expect.any(Error)
      )
    })
  })

  describe('sendPollClosedNotifications', () => {
    it('should send notifications with correct poll results', async () => {
      const subscribers = ['user1@example.com', 'user2@example.com']
      const mockSendNotification = jest.spyOn(EmailNotificationService, 'sendPollClosedNotification')
        .mockResolvedValue({ success: true, message_id: 'msg_123' })

      await NotificationTriggerService.sendPollClosedNotifications(mockPoll, subscribers)

      expect(mockSendNotification).toHaveBeenCalledTimes(2)
      
      // Verify the correct results calculation
      expect(mockSendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          poll_id: 'test-poll-1',
          winner: 'JavaScript', // First option in results with equal votes
          total_votes: 3, // Based on votes array length
          results_summary: expect.arrayContaining([
            expect.objectContaining({ option: 'JavaScript', votes: 1, percentage: 33 }),
            expect.objectContaining({ option: 'TypeScript', votes: 1, percentage: 33 }),
            expect.objectContaining({ option: 'Python', votes: 1, percentage: 33 })
          ])
        })
      )
    })

    it('should include user vote information when available', async () => {
      const subscribers = ['user1@example.com']
      const mockSendNotification = jest.spyOn(EmailNotificationService, 'sendPollClosedNotification')
        .mockResolvedValue({ success: true, message_id: 'msg_123' })

      await NotificationTriggerService.sendPollClosedNotifications(mockPoll, subscribers)

      expect(mockSendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          user_vote: 'JavaScript' // user1 voted for opt-1 (JavaScript)
        })
      )
    })

    it('should handle empty votes array', async () => {
      const pollWithoutVotes = { ...mockPoll, votes: [] }
      const subscribers = ['user1@example.com']
      const mockSendNotification = jest.spyOn(EmailNotificationService, 'sendPollClosedNotification')
        .mockResolvedValue({ success: true, message_id: 'msg_123' })

      await NotificationTriggerService.sendPollClosedNotifications(pollWithoutVotes, subscribers)

      expect(mockSendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          total_votes: 0,
          user_vote: undefined,
          results_summary: expect.arrayContaining([
            expect.objectContaining({ votes: 0, percentage: 0 })
          ])
        })
      )
    })

    it('should handle notification sending errors', async () => {
      const subscribers = ['user1@example.com']
      jest.spyOn(EmailNotificationService, 'sendPollClosedNotification')
        .mockRejectedValue(new Error('Send failed'))

      await expect(
        NotificationTriggerService.sendPollClosedNotifications(mockPoll, subscribers)
      ).resolves.not.toThrow()

      expect(console.error).toHaveBeenCalledWith(
        'Error sending poll closed notifications:',
        expect.any(Error)
      )
    })
  })

  describe('sendNewCommentNotifications', () => {
    it('should send notifications to all subscribers except comment author', async () => {
      const subscribers = ['user1@example.com', 'user2@example.com', 'Jane Smith']
      const mockSendNotification = jest.spyOn(EmailNotificationService, 'sendNewCommentNotification')
        .mockResolvedValue({ success: true, message_id: 'msg_123' })

      await NotificationTriggerService.sendNewCommentNotifications(mockComment, mockPoll, subscribers)

      // Should send to 2 subscribers (excluding Jane Smith who is the comment author)
      expect(mockSendNotification).toHaveBeenCalledTimes(2)
      
      expect(mockSendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          poll_id: 'test-poll-1',
          commenter_name: 'Jane Smith',
          comment_text: 'I think TypeScript is the future of web development!',
          comment_url: 'http://localhost:3000/polls/test-poll-1#comment-comment-1'
        })
      )
    })

    it('should handle comment with undefined author', async () => {
      const commentWithoutAuthor = { ...mockComment, author: undefined }
      const subscribers = ['user1@example.com']
      const mockSendNotification = jest.spyOn(EmailNotificationService, 'sendNewCommentNotification')
        .mockResolvedValue({ success: true, message_id: 'msg_123' })

      await NotificationTriggerService.sendNewCommentNotifications(commentWithoutAuthor, mockPoll, subscribers)

      expect(mockSendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          commenter_name: 'Anonymous'
        })
      )
    })

    it('should handle empty subscribers list', async () => {
      const subscribers: string[] = []
      const mockSendNotification = jest.spyOn(EmailNotificationService, 'sendNewCommentNotification')

      await NotificationTriggerService.sendNewCommentNotifications(mockComment, mockPoll, subscribers)

      expect(mockSendNotification).not.toHaveBeenCalled()
    })

    it('should handle notification errors gracefully', async () => {
      const subscribers = ['user1@example.com']
      jest.spyOn(EmailNotificationService, 'sendNewCommentNotification')
        .mockRejectedValue(new Error('Send failed'))

      await expect(
        NotificationTriggerService.sendNewCommentNotifications(mockComment, mockPoll, subscribers)
      ).resolves.not.toThrow()

      expect(console.error).toHaveBeenCalledWith(
        'Error sending new comment notifications:',
        expect.any(Error)
      )
    })
  })

  describe('sendCommentReplyNotification', () => {
    it('should send reply notification to original comment author', async () => {
      const mockSendNotification = jest.spyOn(EmailNotificationService, 'sendCommentReplyNotification')
        .mockResolvedValue({ success: true, message_id: 'msg_123' })

      await NotificationTriggerService.sendCommentReplyNotification(mockReplyComment, mockComment, mockPoll)

      expect(mockSendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          user_name: 'Jane Smith',
          original_comment_text: 'I think TypeScript is the future of web development!',
          replier_name: 'Bob Wilson',
          reply_text: 'I agree! The type safety makes development so much more reliable.',
          reply_url: 'http://localhost:3000/polls/test-poll-1#comment-comment-2'
        })
      )
    })

    it('should skip notification when user replies to their own comment', async () => {
      const selfReply = { ...mockReplyComment, author: mockComment.author }
      const mockSendNotification = jest.spyOn(EmailNotificationService, 'sendCommentReplyNotification')

      await NotificationTriggerService.sendCommentReplyNotification(selfReply, mockComment, mockPoll)

      expect(mockSendNotification).not.toHaveBeenCalled()
      expect(console.log).toHaveBeenCalledWith(
        'Skipping reply notification - user replied to their own comment'
      )
    })

    it('should handle authors with only email', async () => {
      const commentWithEmailOnly = {
        ...mockComment,
        author: { id: 'user1', display_name: '', email: 'jane@example.com' }
      }
      const replyWithEmailOnly = {
        ...mockReplyComment,
        author: { id: 'user2', display_name: '', email: 'bob@example.com' }
      }
      
      const mockSendNotification = jest.spyOn(EmailNotificationService, 'sendCommentReplyNotification')
        .mockResolvedValue({ success: true, message_id: 'msg_123' })

      await NotificationTriggerService.sendCommentReplyNotification(replyWithEmailOnly, commentWithEmailOnly, mockPoll)

      expect(mockSendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          user_name: 'jane@example.com',
          replier_name: 'bob@example.com'
        })
      )
    })

    it('should handle notification errors gracefully', async () => {
      jest.spyOn(EmailNotificationService, 'sendCommentReplyNotification')
        .mockRejectedValue(new Error('Send failed'))

      await expect(
        NotificationTriggerService.sendCommentReplyNotification(mockReplyComment, mockComment, mockPoll)
      ).resolves.not.toThrow()

      expect(console.error).toHaveBeenCalledWith(
        'Error sending comment reply notification:',
        expect.any(Error)
      )
    })
  })

  describe('getPollSubscribers', () => {
    it('should return unique subscribers from votes', async () => {
      const subscribers = await NotificationTriggerService.getPollSubscribers(mockPoll)

      expect(subscribers).toEqual(expect.arrayContaining([
        'user1@example.com',
        'user2@example.com',
        'user3@example.com'
      ]))
      expect(subscribers).toHaveLength(3)
    })

    it('should handle poll without votes', async () => {
      const pollWithoutVotes = { ...mockPoll, votes: undefined }
      const subscribers = await NotificationTriggerService.getPollSubscribers(pollWithoutVotes)

      expect(subscribers).toEqual([])
    })

    it('should handle empty votes array', async () => {
      const pollWithEmptyVotes = { ...mockPoll, votes: [] }
      const subscribers = await NotificationTriggerService.getPollSubscribers(pollWithEmptyVotes)

      expect(subscribers).toEqual([])
    })

    it('should deduplicate subscribers', async () => {
      const pollWithDuplicateVoters = {
        ...mockPoll,
        votes: [
          { user: 'user1@example.com', option: 'opt-1', timestamp: '2024-01-15T10:00:00Z' },
          { user: 'user1@example.com', option: 'opt-2', timestamp: '2024-01-15T11:00:00Z' },
          { user: 'user2@example.com', option: 'opt-1', timestamp: '2024-01-15T12:00:00Z' }
        ]
      }

      const subscribers = await NotificationTriggerService.getPollSubscribers(pollWithDuplicateVoters)

      expect(subscribers).toEqual(['user1@example.com', 'user2@example.com'])
      expect(subscribers).toHaveLength(2)
    })

    it('should handle errors gracefully', async () => {
      const malformedPoll = null as any

      const subscribers = await NotificationTriggerService.getPollSubscribers(malformedPoll)

      expect(subscribers).toEqual([])
      expect(console.error).toHaveBeenCalledWith(
        'Error getting poll subscribers:',
        expect.any(Error)
      )
    })
  })

  describe('Event Handlers', () => {
    describe('handlePollCreated', () => {
      it('should schedule reminders for polls with end dates', async () => {
        const mockScheduleReminders = jest.spyOn(NotificationTriggerService, 'schedulePollClosingReminders')
          .mockResolvedValue()
        const mockGetSubscribers = jest.spyOn(NotificationTriggerService, 'getPollSubscribers')
          .mockResolvedValue(['user1@example.com', 'user2@example.com'])

        await NotificationTriggerService.handlePollCreated(mockPoll)

        expect(mockGetSubscribers).toHaveBeenCalledWith(mockPoll)
        expect(mockScheduleReminders).toHaveBeenCalledWith(mockPoll, ['user1@example.com', 'user2@example.com'])
      })

      it('should skip reminders for polls without end dates', async () => {
        const pollWithoutEndDate = { ...mockPoll, endsAt: undefined }
        const mockScheduleReminders = jest.spyOn(NotificationTriggerService, 'schedulePollClosingReminders')

        await NotificationTriggerService.handlePollCreated(pollWithoutEndDate)

        expect(mockScheduleReminders).not.toHaveBeenCalled()
      })
    })

    describe('handlePollClosed', () => {
      it('should send closed notifications to subscribers', async () => {
        const mockSendNotifications = jest.spyOn(NotificationTriggerService, 'sendPollClosedNotifications')
          .mockResolvedValue()
        const mockGetSubscribers = jest.spyOn(NotificationTriggerService, 'getPollSubscribers')
          .mockResolvedValue(['user1@example.com', 'user2@example.com'])

        await NotificationTriggerService.handlePollClosed(mockPoll)

        expect(mockGetSubscribers).toHaveBeenCalledWith(mockPoll)
        expect(mockSendNotifications).toHaveBeenCalledWith(mockPoll, ['user1@example.com', 'user2@example.com'])
      })
    })

    describe('handleCommentCreated', () => {
      it('should send new comment notifications for top-level comments', async () => {
        const mockSendNotifications = jest.spyOn(NotificationTriggerService, 'sendNewCommentNotifications')
          .mockResolvedValue()
        const mockGetSubscribers = jest.spyOn(NotificationTriggerService, 'getPollSubscribers')
          .mockResolvedValue(['user1@example.com', 'user2@example.com'])

        await NotificationTriggerService.handleCommentCreated(mockComment, mockPoll)

        expect(mockGetSubscribers).toHaveBeenCalledWith(mockPoll)
        expect(mockSendNotifications).toHaveBeenCalledWith(mockComment, mockPoll, ['user1@example.com', 'user2@example.com'])
      })

      it('should handle reply comments differently', async () => {
        const mockSendNotifications = jest.spyOn(NotificationTriggerService, 'sendNewCommentNotifications')

        await NotificationTriggerService.handleCommentCreated(mockReplyComment, mockPoll)

        expect(mockSendNotifications).not.toHaveBeenCalled()
        expect(console.log).toHaveBeenCalledWith(
          'TODO: Handle comment reply notification',
          expect.objectContaining({
            replyId: 'comment-2',
            parentId: 'comment-1'
          })
        )
      })
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete poll lifecycle', async () => {
      // Mock all dependencies
      jest.spyOn(NotificationTriggerService, 'getPollSubscribers')
        .mockResolvedValue(['user1@example.com', 'user2@example.com'])
      jest.spyOn(EmailNotificationService, 'scheduleNotification')
        .mockResolvedValue('queue_123')
      jest.spyOn(EmailNotificationService, 'sendPollClosedNotification')
        .mockResolvedValue({ success: true, message_id: 'msg_123' })

      // Test poll creation
      await NotificationTriggerService.handlePollCreated(mockPoll)

      // Test poll voting
      await NotificationTriggerService.handlePollVoted(mockPoll, 'new-voter@example.com')

      // Test poll closing
      await NotificationTriggerService.handlePollClosed(mockPoll)

      // Verify all handlers were called without errors
      expect(console.error).not.toHaveBeenCalled()
    })

    it('should handle complete comment lifecycle', async () => {
      jest.spyOn(NotificationTriggerService, 'getPollSubscribers')
        .mockResolvedValue(['user1@example.com', 'user2@example.com'])
      jest.spyOn(EmailNotificationService, 'sendNewCommentNotification')
        .mockResolvedValue({ success: true, message_id: 'msg_123' })

      // Test comment creation
      await NotificationTriggerService.handleCommentCreated(mockComment, mockPoll)

      // Test reply creation
      await NotificationTriggerService.handleCommentCreated(mockReplyComment, mockPoll)

      // Verify all handlers were called without errors
      expect(console.error).not.toHaveBeenCalled()
    })
  })
})