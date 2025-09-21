/**
 * Email Notification Triggers
 * 
 * Integrates email notifications with poll and comment events.
 * Handles automatic notification scheduling and delivery.
 */

import { EmailNotificationService } from './emailNotificationService'
import { 
  PollClosingEmailData,
  PollClosedEmailData,
  NewCommentEmailData,
  CommentReplyEmailData,
  EmailNotificationType
} from '@/types/notifications'
import type { Poll } from '@/data/mockPolls'
import type { Comment } from '@/types/comments'

/**
 * Mock poll interface that includes votes array (for development)
 */
interface PollWithVotes extends Poll {
  votes?: Array<{
    user: string
    option: string
    timestamp: string
  }>
  endsAt?: string
}

/**
 * Notification trigger service for poll and comment events
 */
export class NotificationTriggerService {
  /**
   * Schedule poll closing reminders
   * 
   * @param poll - Poll object
   * @param subscribers - Array of user emails/names
   * @returns Promise<void>
   */
  static async schedulePollClosingReminders(poll: PollWithVotes, subscribers: string[]): Promise<void> {
    try {
      const pollUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/polls/${poll.id}`
      
      // Schedule reminders for different time intervals
      const reminderIntervals = [
        { hours: 24, label: '1 day' },
        { hours: 2, label: '2 hours' },
        { hours: 1, label: '1 hour' }
      ]

      for (const interval of reminderIntervals) {
        if (!poll.endsAt) continue
        
        const reminderTime = new Date(poll.endsAt)
        reminderTime.setHours(reminderTime.getHours() - interval.hours)

        // Only schedule if reminder time is in the future
        if (reminderTime > new Date()) {
          for (const subscriber of subscribers) {
            const emailData: PollClosingEmailData = {
              poll_id: poll.id,
              poll_title: poll.question,
              poll_url: pollUrl,
              user_name: subscriber,
              hours_remaining: interval.hours,
              current_vote_count: poll.votes?.length || 0,
              is_user_voted: poll.votes?.some((vote: any) => vote.user === subscriber) || false
            }

            const delayMinutes = Math.max(0, Math.floor((reminderTime.getTime() - Date.now()) / (1000 * 60)))

            await EmailNotificationService.scheduleNotification(
              EmailNotificationType.POLL_CLOSING_SOON,
              subscriber,
              emailData,
              { delay_minutes: delayMinutes }
            )
          }

          console.log(`Scheduled ${subscribers.length} poll closing reminders for ${interval.label} before closing`)
        }
      }
    } catch (error) {
      console.error('Error scheduling poll closing reminders:', error)
    }
  }

  /**
   * Send poll closed notifications with results
   * 
   * @param poll - Closed poll object
   * @param subscribers - Array of user emails/names
   * @returns Promise<void>
   */
  static async sendPollClosedNotifications(poll: PollWithVotes, subscribers: string[]): Promise<void> {
    try {
      const pollUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/polls/${poll.id}`
      
      // Calculate results
      const voteCounts = poll.options.map((option: any) => ({
        option: option.label, // Use 'label' instead of 'text'
        votes: poll.votes?.filter((vote: any) => vote.option === option.id).length || 0
      }))

      const totalVotes = voteCounts.reduce((sum: number, result: any) => sum + result.votes, 0)
      const winner = voteCounts.reduce((prev: any, current: any) => 
        current.votes > prev.votes ? current : prev
      ).option

      const results_summary = voteCounts.map((result: any) => ({
        option: result.option,
        votes: result.votes,
        percentage: totalVotes > 0 ? Math.round((result.votes / totalVotes) * 100) : 0
      }))

      // Send notifications to all subscribers
      for (const subscriber of subscribers) {
        const userVote = poll.votes?.find((vote: any) => vote.user === subscriber)
        const userVoteOption = userVote ? 
          poll.options.find((opt: any) => opt.id === userVote.option)?.label : undefined

        const emailData: PollClosedEmailData = {
          poll_id: poll.id,
          poll_title: poll.question,
          poll_url: pollUrl,
          user_name: subscriber,
          winner,
          total_votes: totalVotes,
          user_vote: userVoteOption,
          results_summary
        }

        await EmailNotificationService.sendPollClosedNotification(emailData)
      }

      console.log(`Sent poll closed notifications to ${subscribers.length} subscribers`)
    } catch (error) {
      console.error('Error sending poll closed notifications:', error)
    }
  }

  /**
   * Send new comment notification
   * 
   * @param comment - New comment object
   * @param poll - Poll where comment was made
   * @param subscribers - Array of user emails/names to notify
   * @returns Promise<void>
   */
  static async sendNewCommentNotifications(
    comment: Comment, 
    poll: Poll, 
    subscribers: string[]
  ): Promise<void> {
    try {
      const pollUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/polls/${poll.id}`
      const commentUrl = `${pollUrl}#comment-${comment.id}`

      // Don't notify the comment author
      const authorName = comment.author?.display_name || comment.author?.email || 'Anonymous'
      const recipientsToNotify = subscribers.filter(subscriber => subscriber !== authorName)

      for (const subscriber of recipientsToNotify) {
        const emailData: NewCommentEmailData = {
          poll_id: poll.id,
          poll_title: poll.question,
          poll_url: pollUrl,
          user_name: subscriber,
          commenter_name: authorName,
          comment_text: comment.content,
          comment_url: commentUrl,
          comment_time: comment.created_at
        }

        await EmailNotificationService.sendNewCommentNotification(emailData)
      }

      console.log(`Sent new comment notifications to ${recipientsToNotify.length} subscribers`)
    } catch (error) {
      console.error('Error sending new comment notifications:', error)
    }
  }

  /**
   * Send comment reply notification
   * 
   * @param reply - Reply comment object
   * @param originalComment - Original comment being replied to
   * @param poll - Poll where reply was made
   * @returns Promise<void>
   */
  static async sendCommentReplyNotification(
    reply: Comment,
    originalComment: Comment,
    poll: Poll
  ): Promise<void> {
    try {
      const originalAuthorName = originalComment.author?.display_name || originalComment.author?.email || 'Anonymous'
      const replierName = reply.author?.display_name || reply.author?.email || 'Anonymous'
      
      // Only notify the original comment author
      if (replierName === originalAuthorName) {
        console.log('Skipping reply notification - user replied to their own comment')
        return
      }

      const pollUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/polls/${poll.id}`
      const replyUrl = `${pollUrl}#comment-${reply.id}`

      const emailData: CommentReplyEmailData = {
        poll_id: poll.id,
        poll_title: poll.question,
        poll_url: pollUrl,
        user_name: originalAuthorName,
        original_comment_text: originalComment.content,
        replier_name: replierName,
        reply_text: reply.content,
        reply_url: replyUrl,
        reply_time: reply.created_at
      }

      await EmailNotificationService.sendCommentReplyNotification(emailData)
      
      console.log(`Sent comment reply notification to ${originalAuthorName}`)
    } catch (error) {
      console.error('Error sending comment reply notification:', error)
    }
  }

  /**
   * Get poll subscribers (users who voted or commented)
   * 
   * @param poll - Poll object
   * @returns Promise<string[]> - Array of user identifiers
   */
  static async getPollSubscribers(poll: PollWithVotes): Promise<string[]> {
    try {
      const subscribers = new Set<string>()

      // Add poll creator (would need to be added to poll interface)
      // if (poll.createdBy) {
      //   subscribers.add(poll.createdBy)
      // }

      // Add voters
      poll.votes?.forEach((vote: any) => {
        if (vote.user) {
          subscribers.add(vote.user)
        }
      })

      // TODO: Add commenters when we have access to comments
      // This would require fetching comments for the poll
      // const comments = await CommentService.getComments(poll.id)
      // comments.forEach(comment => {
      //   const authorName = comment.author?.name || comment.author?.email
      //   if (authorName) {
      //     subscribers.add(authorName)
      //   }
      // })

      return Array.from(subscribers)
    } catch (error) {
      console.error('Error getting poll subscribers:', error)
      return []
    }
  }

  /**
   * Get comment thread subscribers (users who commented in the thread)
   * 
   * @param pollId - Poll ID
   * @param parentCommentId - Parent comment ID (for replies)
   * @returns Promise<string[]> - Array of user identifiers
   */
  static async getCommentThreadSubscribers(
    pollId: string, 
    parentCommentId?: string
  ): Promise<string[]> {
    try {
      // TODO: Implement when we have comment service integration
      // This would fetch all comments in a thread and return unique authors
      
      console.log('TODO: Get comment thread subscribers', { pollId, parentCommentId })
      
      // Mock implementation for development
      return []
    } catch (error) {
      console.error('Error getting comment thread subscribers:', error)
      return []
    }
  }

  /**
   * Handle poll creation event
   * 
   * @param poll - Newly created poll
   * @returns Promise<void>
   */
  static async handlePollCreated(poll: PollWithVotes): Promise<void> {
    try {
      // For polls with end dates, schedule closing reminders
      if (poll.endsAt) {
        const subscribers = await this.getPollSubscribers(poll)
        await this.schedulePollClosingReminders(poll, subscribers)
      }

      console.log(`Handled poll creation for poll: ${poll.id}`)
    } catch (error) {
      console.error('Error handling poll created event:', error)
    }
  }

  /**
   * Handle poll vote event
   * 
   * @param poll - Poll that was voted on
   * @param voterName - Name/ID of the voter
   * @returns Promise<void>
   */
  static async handlePollVoted(poll: PollWithVotes, voterName: string): Promise<void> {
    try {
      // Update any scheduled closing reminders with new vote count
      // In a real implementation, this might update existing scheduled notifications
      
      console.log(`Handled vote event for poll: ${poll.id} by ${voterName}`)
    } catch (error) {
      console.error('Error handling poll voted event:', error)
    }
  }

  /**
   * Handle poll closed event
   * 
   * @param poll - Poll that was closed
   * @returns Promise<void>
   */
  static async handlePollClosed(poll: PollWithVotes): Promise<void> {
    try {
      const subscribers = await this.getPollSubscribers(poll)
      await this.sendPollClosedNotifications(poll, subscribers)

      console.log(`Handled poll closed event for poll: ${poll.id}`)
    } catch (error) {
      console.error('Error handling poll closed event:', error)
    }
  }

  /**
   * Handle comment created event
   * 
   * @param comment - New comment
   * @param poll - Poll where comment was made
   * @returns Promise<void>
   */
  static async handleCommentCreated(comment: Comment, poll: Poll): Promise<void> {
    try {
      if (comment.parent_id) {
        // This is a reply - notify the original comment author
        // TODO: Fetch original comment when we have comment service integration
        console.log('TODO: Handle comment reply notification', { 
          replyId: comment.id, 
          parentId: comment.parent_id 
        })
      } else {
        // This is a top-level comment - notify poll subscribers
        const subscribers = await this.getPollSubscribers(poll as PollWithVotes)
        await this.sendNewCommentNotifications(comment, poll, subscribers)
      }

      console.log(`Handled comment created event for comment: ${comment.id}`)
    } catch (error) {
      console.error('Error handling comment created event:', error)
    }
  }
}

/**
 * Notification event hooks for easy integration
 */
export const notificationHooks = {
  onPollCreated: NotificationTriggerService.handlePollCreated,
  onPollVoted: NotificationTriggerService.handlePollVoted,
  onPollClosed: NotificationTriggerService.handlePollClosed,
  onCommentCreated: NotificationTriggerService.handleCommentCreated,
}