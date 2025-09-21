/**
 * Comment Service
 * 
 * Handles all comment-related operations including CRUD operations,
 * real-time updates, and moderation.
 */

import { supabase } from './supabaseClient'
import { 
  Comment, 
  CommentSubmissionPayload, 
  CommentSubmissionResult,
  CommentThreadConfig,
  CommentStats,
  CommentModerationStatus
} from '@/types/comments'

/**
 * Comment service class for managing poll comments
 */
export class CommentService {
  
  /**
   * Get all comments for a poll with optional threading
   * 
   * @param pollId - ID of the poll
   * @param config - Thread configuration options
   * @returns Promise<Comment[]> - Array of comments with replies
   */
  static async getComments(
    pollId: string, 
    config: Partial<CommentThreadConfig> = {}
  ): Promise<Comment[]> {
    try {
      // TODO: Replace with actual Supabase query
      // const { data, error } = await supabase
      //   .from('poll_comments')
      //   .select(`
      //     *,
      //     author:user_profiles(id, display_name, avatar_url),
      //     replies:poll_comments!parent_id(
      //       *,
      //       author:user_profiles(id, display_name, avatar_url)
      //     )
      //   `)
      //   .eq('poll_id', pollId)
      //   .is('parent_id', null)
      //   .eq('is_deleted', false)
      //   .order('created_at', { ascending: config.sort_order !== 'newest' })

      console.log('TODO: Fetch comments from Supabase:', { pollId, config })
      
      // Mock data for development
      return this.getMockComments(pollId)
    } catch (error) {
      console.error('Error fetching comments:', error)
      throw new Error('Failed to fetch comments')
    }
  }

  /**
   * Submit a new comment
   * 
   * @param payload - Comment submission data
   * @returns Promise<CommentSubmissionResult> - Result of submission
   */
  static async submitComment(payload: CommentSubmissionPayload): Promise<CommentSubmissionResult> {
    try {
      // Validate input
      const validation = this.validateComment(payload)
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors[0]?.message || 'Invalid comment data',
          message: 'Comment validation failed'
        }
      }

      // TODO: Replace with actual Supabase insertion
      // const { data, error } = await supabase
      //   .from('poll_comments')
      //   .insert({
      //     poll_id: payload.poll_id,
      //     user_id: payload.user_id,
      //     content: payload.content,
      //     parent_id: payload.parent_id || null,
      //     is_moderated: false
      //   })
      //   .select(`
      //     *,
      //     author:user_profiles(id, display_name, avatar_url)
      //   `)
      //   .single()

      console.log('TODO: Insert comment in Supabase:', payload)
      
      // Mock successful response
      const mockComment: Comment = {
        id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        poll_id: payload.poll_id,
        user_id: payload.user_id,
        parent_id: payload.parent_id || null,
        content: payload.content,
        is_moderated: false,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        author: {
          id: payload.user_id,
          display_name: 'Current User',
          email: 'user@example.com'
        },
        replies: [],
        reply_count: 0,
        is_edited: false
      }

      return {
        success: true,
        comment: mockComment,
        message: 'Comment posted successfully'
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
      return {
        success: false,
        error: 'Failed to submit comment',
        message: 'An error occurred while posting your comment'
      }
    }
  }

  /**
   * Update an existing comment
   * 
   * @param commentId - ID of the comment to update
   * @param content - New content for the comment
   * @param userId - ID of the user making the update
   * @returns Promise<CommentSubmissionResult> - Result of update
   */
  static async updateComment(
    commentId: string, 
    content: string, 
    userId: string
  ): Promise<CommentSubmissionResult> {
    try {
      // TODO: Replace with actual Supabase update
      // const { data, error } = await supabase
      //   .from('poll_comments')
      //   .update({ 
      //     content, 
      //     updated_at: new Date().toISOString(),
      //     is_edited: true
      //   })
      //   .eq('id', commentId)
      //   .eq('user_id', userId) // Ensure user can only update their own comments
      //   .select(`
      //     *,
      //     author:user_profiles(id, display_name, avatar_url)
      //   `)
      //   .single()

      console.log('TODO: Update comment in Supabase:', { commentId, content, userId })
      
      return {
        success: true,
        message: 'Comment updated successfully'
      }
    } catch (error) {
      console.error('Error updating comment:', error)
      return {
        success: false,
        error: 'Failed to update comment',
        message: 'An error occurred while updating your comment'
      }
    }
  }

  /**
   * Delete a comment (soft delete)
   * 
   * @param commentId - ID of the comment to delete
   * @param userId - ID of the user making the deletion
   * @returns Promise<CommentSubmissionResult> - Result of deletion
   */
  static async deleteComment(commentId: string, userId: string): Promise<CommentSubmissionResult> {
    try {
      // TODO: Replace with actual Supabase update
      // const { data, error } = await supabase
      //   .from('poll_comments')
      //   .update({ 
      //     is_deleted: true, 
      //     updated_at: new Date().toISOString() 
      //   })
      //   .eq('id', commentId)
      //   .eq('user_id', userId) // Ensure user can only delete their own comments

      console.log('TODO: Soft delete comment in Supabase:', { commentId, userId })
      
      return {
        success: true,
        message: 'Comment deleted successfully'
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
      return {
        success: false,
        error: 'Failed to delete comment',
        message: 'An error occurred while deleting your comment'
      }
    }
  }

  /**
   * Get comment statistics for a poll
   * 
   * @param pollId - ID of the poll
   * @returns Promise<CommentStats> - Comment statistics
   */
  static async getCommentStats(pollId: string): Promise<CommentStats> {
    try {
      // TODO: Replace with actual Supabase aggregation query
      console.log('TODO: Fetch comment stats from Supabase:', pollId)
      
      return {
        poll_id: pollId,
        total_comments: 0,
        total_replies: 0,
        unique_commenters: 0,
        latest_comment_at: null
      }
    } catch (error) {
      console.error('Error fetching comment stats:', error)
      throw new Error('Failed to fetch comment statistics')
    }
  }

  /**
   * Subscribe to real-time comment updates for a poll
   * 
   * @param pollId - ID of the poll
   * @param callback - Function to call when comments update
   * @returns Unsubscribe function
   */
  static subscribeToComments(
    pollId: string,
    callback: (comment: Comment) => void
  ): () => void {
    // TODO: Replace with actual Supabase real-time subscription
    // const subscription = supabase
    //   .channel('poll_comments')
    //   .on(
    //     'postgres_changes',
    //     {
    //       event: '*',
    //       schema: 'public',
    //       table: 'poll_comments',
    //       filter: `poll_id=eq.${pollId}`
    //     },
    //     (payload) => {
    //       if (payload.new) {
    //         callback(payload.new as Comment)
    //       }
    //     }
    //   )
    //   .subscribe()

    console.log('TODO: Set up real-time comment subscription:', pollId)
    
    // Return mock unsubscribe function
    return () => {
      console.log('TODO: Unsubscribe from comment updates')
    }
  }

  /**
   * Validate comment data
   * 
   * @param payload - Comment data to validate
   * @returns Validation result
   */
  private static validateComment(payload: CommentSubmissionPayload): {
    isValid: boolean
    errors: Array<{ field: string; message: string }>
  } {
    const errors: Array<{ field: string; message: string }> = []

    // Validate content
    if (!payload.content || payload.content.trim().length === 0) {
      errors.push({ field: 'content', message: 'Comment content is required' })
    } else if (payload.content.length > 1000) {
      errors.push({ field: 'content', message: 'Comment must be less than 1000 characters' })
    }

    // Validate poll ID
    if (!payload.poll_id || payload.poll_id.trim().length === 0) {
      errors.push({ field: 'poll_id', message: 'Poll ID is required' })
    }

    // Validate user ID
    if (!payload.user_id || payload.user_id.trim().length === 0) {
      errors.push({ field: 'user_id', message: 'User ID is required' })
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Generate mock comments for development
   * 
   * @param pollId - ID of the poll
   * @returns Array of mock comments
   */
  private static getMockComments(pollId: string): Comment[] {
    return [
      {
        id: 'comment_1',
        poll_id: pollId,
        user_id: 'user_1',
        parent_id: null,
        content: 'Great poll! I really think TypeScript is the way forward for large applications.',
        is_moderated: true,
        is_deleted: false,
        created_at: '2025-09-21T08:30:00Z',
        updated_at: '2025-09-21T08:30:00Z',
        author: {
          id: 'user_1',
          display_name: 'Sarah Johnson',
          email: 'sarah@example.com'
        },
        replies: [
          {
            id: 'comment_2',
            poll_id: pollId,
            user_id: 'user_2',
            parent_id: 'comment_1',
            content: 'I agree! The type safety really helps with refactoring.',
            is_moderated: true,
            is_deleted: false,
            created_at: '2025-09-21T09:15:00Z',
            updated_at: '2025-09-21T09:15:00Z',
            author: {
              id: 'user_2',
              display_name: 'Mike Chen',
              email: 'mike@example.com'
            },
            replies: [],
            reply_count: 0,
            is_edited: false
          }
        ],
        reply_count: 1,
        is_edited: false
      },
      {
        id: 'comment_3',
        poll_id: pollId,
        user_id: 'user_3',
        parent_id: null,
        content: 'JavaScript is still my go-to for quick prototypes and smaller projects. The ecosystem is just so rich!',
        is_moderated: true,
        is_deleted: false,
        created_at: '2025-09-21T10:45:00Z',
        updated_at: '2025-09-21T10:45:00Z',
        author: {
          id: 'user_3',
          display_name: 'Alex Rivera',
          email: 'alex@example.com'
        },
        replies: [],
        reply_count: 0,
        is_edited: false
      }
    ]
  }
}

/**
 * Database schema for Supabase (to be created)
 */
/*
-- Comments table
CREATE TABLE poll_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES poll_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 1000),
  is_moderated BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for performance
  INDEX idx_poll_comments_poll_id (poll_id),
  INDEX idx_poll_comments_user_id (user_id),
  INDEX idx_poll_comments_parent_id (parent_id),
  INDEX idx_poll_comments_created_at (created_at)
);

-- RLS Policies
ALTER TABLE poll_comments ENABLE ROW LEVEL SECURITY;

-- Users can read all approved comments
CREATE POLICY "Comments are viewable by everyone" ON poll_comments
  FOR SELECT USING (is_moderated = true AND is_deleted = false);

-- Users can insert their own comments
CREATE POLICY "Users can insert their own comments" ON poll_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments" ON poll_comments
  FOR UPDATE USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Users can soft delete their own comments
CREATE POLICY "Users can delete their own comments" ON poll_comments
  FOR UPDATE USING (auth.uid() = user_id AND is_deleted = false) 
  WITH CHECK (auth.uid() = user_id);
*/