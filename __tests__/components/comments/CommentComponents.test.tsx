/**
 * Comment Components Integration Tests
 * 
 * Test suite for comment form, list, and item components
 * to ensure proper functionality and user interactions.
 */

import '@testing-library/jest-dom'
import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CommentForm } from '@/components/comments/CommentForm'
import { CommentList } from '@/components/comments/CommentList'
import { CommentItem } from '@/components/comments/CommentItem'
import { Comment } from '@/types/comments'

// Mock dependencies
jest.mock('@/lib/commentService')
jest.mock('@/components/AuthProvider', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-123',
      email: 'test@example.com'
    },
    loading: false
  })
}))

// Mock comment data
const mockComment: Comment = {
  id: 'comment-1',
  poll_id: 'poll-1',
  user_id: 'user-1',
  parent_id: null,
  content: 'This is a test comment with some content.',
  is_moderated: true,
  is_deleted: false,
  created_at: '2025-09-21T10:00:00Z',
  updated_at: '2025-09-21T10:00:00Z',
  author: {
    id: 'user-1',
    display_name: 'Test User',
    email: 'test@example.com'
  },
  replies: [],
  reply_count: 0,
  is_edited: false
}

const mockCommentWithReplies: Comment = {
  ...mockComment,
  id: 'comment-2',
  replies: [
    {
      id: 'reply-1',
      poll_id: 'poll-1',
      user_id: 'user-2',
      parent_id: 'comment-2',
      content: 'This is a reply to the comment.',
      is_moderated: true,
      is_deleted: false,
      created_at: '2025-09-21T11:00:00Z',
      updated_at: '2025-09-21T11:00:00Z',
      author: {
        id: 'user-2',
        display_name: 'Reply User',
        email: 'reply@example.com'
      },
      replies: [],
      reply_count: 0,
      is_edited: false
    }
  ],
  reply_count: 1
}

describe('CommentForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render comment form with correct elements', () => {
      render(<CommentForm pollId="poll-1" />)

      expect(screen.getByRole('textbox')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /post comment/i })).toBeInTheDocument()
      expect(screen.getByText('Add a comment')).toBeInTheDocument()
      expect(screen.getByText('0/1000')).toBeInTheDocument()
    })

    it('should render as reply form when isReply is true', () => {
      render(
        <CommentForm 
          pollId="poll-1" 
          parentId="comment-1" 
          isReply={true}
        />
      )

      expect(screen.getByText('Reply to comment')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /post reply/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('should show login prompt when user is not authenticated', () => {
      // Mock unauthenticated user
      jest.doMock('@/components/AuthProvider', () => ({
        useAuth: () => ({
          user: null,
          loading: false
        })
      }))

      render(<CommentForm pollId="poll-1" />)

      expect(screen.getByText(/please sign in to participate/i)).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should show validation error for empty content', async () => {
      const user = userEvent.setup()
      render(<CommentForm pollId="poll-1" />)

      const submitButton = screen.getByRole('button', { name: /post comment/i })
      
      // Try to submit empty form
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/comment cannot be empty/i)).toBeInTheDocument()
      })
    })

    it('should show character count and update dynamically', async () => {
      const user = userEvent.setup()
      render(<CommentForm pollId="poll-1" />)

      const textbox = screen.getByRole('textbox')
      
      // Type some content
      await user.type(textbox, 'Hello world')

      expect(screen.getByText('11/1000')).toBeInTheDocument()
    })

    it('should show warning when approaching character limit', async () => {
      const user = userEvent.setup()
      render(<CommentForm pollId="poll-1" />)

      const textbox = screen.getByRole('textbox')
      const longText = 'a'.repeat(900) // 90% of limit
      
      await user.type(textbox, longText)

      const charCount = screen.getByText('900/1000')
      expect(charCount).toHaveClass('text-yellow-600')
    })

    it('should show error when exceeding character limit', async () => {
      const user = userEvent.setup()
      render(<CommentForm pollId="poll-1" />)

      const textbox = screen.getByRole('textbox')
      const tooLongText = 'a'.repeat(1001)
      
      await user.type(textbox, tooLongText)

      await waitFor(() => {
        expect(screen.getByText(/comment must be less than 1000 characters/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should disable submit button when content is empty', () => {
      render(<CommentForm pollId="poll-1" />)

      const submitButton = screen.getByRole('button', { name: /post comment/i })
      expect(submitButton).toBeDisabled()
    })

    it('should enable submit button when content is provided', async () => {
      const user = userEvent.setup()
      render(<CommentForm pollId="poll-1" />)

      const textbox = screen.getByRole('textbox')
      const submitButton = screen.getByRole('button', { name: /post comment/i })
      
      await user.type(textbox, 'Valid comment content')

      expect(submitButton).toBeEnabled()
    })

    it('should show loading state during submission', async () => {
      const user = userEvent.setup()
      render(<CommentForm pollId="poll-1" />)

      const textbox = screen.getByRole('textbox')
      await user.type(textbox, 'Test comment')

      const submitButton = screen.getByRole('button', { name: /post comment/i })
      await user.click(submitButton)

      expect(screen.getByRole('button', { name: /posting.../i })).toBeInTheDocument()
    })
  })
})

describe('CommentItem', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render comment with author and content', () => {
      render(<CommentItem comment={mockComment} />)

      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.getByText('This is a test comment with some content.')).toBeInTheDocument()
      expect(screen.getByText(/ago/)).toBeInTheDocument() // Relative time
    })

    it('should show author badge for current user', () => {
      const userComment = { ...mockComment, user_id: 'test-user-123' }
      render(<CommentItem comment={userComment} />)

      expect(screen.getByText('You')).toBeInTheDocument()
    })

    it('should show edited badge when comment is edited', () => {
      const editedComment = { ...mockComment, is_edited: true }
      render(<CommentItem comment={editedComment} />)

      expect(screen.getByText('Edited')).toBeInTheDocument()
    })

    it('should render replies when present', () => {
      render(<CommentItem comment={mockCommentWithReplies} />)

      expect(screen.getByText('Reply User')).toBeInTheDocument()
      expect(screen.getByText('This is a reply to the comment.')).toBeInTheDocument()
      expect(screen.getByText(/1 reply/)).toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('should show reply form when reply button is clicked', async () => {
      const user = userEvent.setup()
      render(<CommentItem comment={mockComment} />)

      const replyButton = screen.getByRole('button', { name: /reply to/i })
      await user.click(replyButton)

      expect(screen.getByText('Reply to comment')).toBeInTheDocument()
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('should show edit and delete options for own comments', async () => {
      const user = userEvent.setup()
      const userComment = { ...mockComment, user_id: 'test-user-123' }
      render(<CommentItem comment={userComment} />)

      const moreButton = screen.getByRole('button', { name: /more comment actions/i })
      await user.click(moreButton)

      expect(screen.getByText('Edit')).toBeInTheDocument()
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    it('should show report option for other users comments', async () => {
      const user = userEvent.setup()
      render(<CommentItem comment={mockComment} />)

      const moreButton = screen.getByRole('button', { name: /more comment actions/i })
      await user.click(moreButton)

      expect(screen.getByText('Report')).toBeInTheDocument()
    })

    it('should toggle replies visibility', async () => {
      const user = userEvent.setup()
      render(<CommentItem comment={mockCommentWithReplies} />)

      const toggleButton = screen.getByRole('button', { name: /hide 1 reply/i })
      await user.click(toggleButton)

      expect(screen.getByRole('button', { name: /show 1 reply/i })).toBeInTheDocument()
      expect(screen.queryByText('Reply User')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<CommentItem comment={mockComment} />)

      const replyButton = screen.getByRole('button', { name: /reply to test user's comment/i })
      expect(replyButton).toBeInTheDocument()

      const moreButton = screen.getByRole('button', { name: /more comment actions/i })
      expect(moreButton).toBeInTheDocument()
    })

    it('should provide proper time information', () => {
      render(<CommentItem comment={mockComment} />)

      const timeElement = screen.getByRole('time')
      expect(timeElement).toHaveAttribute('datetime', '2025-09-21T10:00:00Z')
    })
  })
})

describe('CommentList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render comment list header', () => {
      render(<CommentList pollId="poll-1" />)

      expect(screen.getByText('Discussion')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument()
    })

    it('should render comment form', () => {
      render(<CommentList pollId="poll-1" />)

      expect(screen.getByText('Add a comment')).toBeInTheDocument()
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('should show loading state initially', () => {
      render(<CommentList pollId="poll-1" />)

      // Should show skeleton loaders
      expect(screen.getAllByTestId(/skeleton/i).length).toBeGreaterThan(0)
    })

    it('should show empty state when no comments exist', async () => {
      // Mock empty comments response
      const mockCommentService = require('@/lib/commentService')
      mockCommentService.CommentService.getComments.mockResolvedValueOnce([])
      mockCommentService.CommentService.getCommentStats.mockResolvedValueOnce({
        poll_id: 'poll-1',
        total_comments: 0,
        total_replies: 0,
        unique_commenters: 0,
        latest_comment_at: null
      })

      render(<CommentList pollId="poll-1" />)

      await waitFor(() => {
        expect(screen.getByText('No comments yet')).toBeInTheDocument()
        expect(screen.getByText('Be the first to share your thoughts')).toBeInTheDocument()
      })
    })
  })

  describe('Data Loading', () => {
    it('should load comments on mount', async () => {
      const mockCommentService = require('@/lib/commentService')
      mockCommentService.CommentService.getComments.mockResolvedValueOnce([mockComment])
      mockCommentService.CommentService.getCommentStats.mockResolvedValueOnce({
        poll_id: 'poll-1',
        total_comments: 1,
        total_replies: 0,
        unique_commenters: 1,
        latest_comment_at: '2025-09-21T10:00:00Z'
      })

      render(<CommentList pollId="poll-1" />)

      await waitFor(() => {
        expect(mockCommentService.CommentService.getComments).toHaveBeenCalledWith(
          'poll-1',
          { sort_order: 'newest' }
        )
        expect(mockCommentService.CommentService.getCommentStats).toHaveBeenCalledWith('poll-1')
      })
    })

    it('should handle refresh action', async () => {
      const user = userEvent.setup()
      const mockCommentService = require('@/lib/commentService')
      
      render(<CommentList pollId="poll-1" />)

      const refreshButton = screen.getByRole('button', { name: /refresh/i })
      await user.click(refreshButton)

      expect(mockCommentService.CommentService.getComments).toHaveBeenCalled()
    })
  })

  describe('Real-time Updates', () => {
    it('should set up real-time subscription on mount', () => {
      const mockCommentService = require('@/lib/commentService')
      const mockUnsubscribe = jest.fn()
      mockCommentService.CommentService.subscribeToComments.mockReturnValueOnce(mockUnsubscribe)

      render(<CommentList pollId="poll-1" />)

      expect(mockCommentService.CommentService.subscribeToComments).toHaveBeenCalledWith(
        'poll-1',
        expect.any(Function)
      )
    })
  })

  describe('Error Handling', () => {
    it('should show error state when loading fails', async () => {
      const mockCommentService = require('@/lib/commentService')
      mockCommentService.CommentService.getComments.mockRejectedValueOnce(new Error('Network error'))

      render(<CommentList pollId="poll-1" />)

      await waitFor(() => {
        expect(screen.getByText(/failed to load comments/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      })
    })
  })
})