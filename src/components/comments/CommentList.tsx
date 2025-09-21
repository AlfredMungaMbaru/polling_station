/**
 * Comment List Component
 * 
 * Container component for displaying all comments in a poll.
 * Handles loading states, empty states, and real-time updates.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  MessageCircle, 
  RefreshCw, 
  Users, 
  Clock,
  MessageSquare
} from 'lucide-react'
import { CommentService } from '@/lib/commentService'
import { CommentForm } from './CommentForm'
import { CommentItem } from './CommentItem'
import { Comment, CommentStats } from '@/types/comments'

type CommentListProps = {
  pollId: string
  className?: string
}

export const CommentList: React.FC<CommentListProps> = ({ 
  pollId, 
  className = "" 
}) => {
  const [comments, setComments] = useState<Comment[]>([])
  const [stats, setStats] = useState<CommentStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Load comments from the service
   */
  const loadComments = async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }
    
    setError(null)

    try {
      const [commentsData, statsData] = await Promise.all([
        CommentService.getComments(pollId, { sort_order: 'newest' }),
        CommentService.getCommentStats(pollId)
      ])

      setComments(commentsData)
      setStats(statsData)
    } catch (err) {
      console.error('Error loading comments:', err)
      setError('Failed to load comments. Please try again.')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  /**
   * Handle new comment submission
   */
  const handleCommentSubmitted = (newComment: Comment) => {
    setComments(prev => [newComment, ...prev])
    
    // Update stats
    if (stats) {
      setStats({
        ...stats,
        total_comments: stats.total_comments + 1,
        latest_comment_at: newComment.created_at
      })
    }
  }

  /**
   * Handle comment editing
   */
  const handleCommentEdit = (commentId: string, content: string) => {
    console.log('TODO: Implement comment editing:', { commentId, content })
    // This would update the comment in the list
  }

  /**
   * Handle comment deletion
   */
  const handleCommentDelete = (commentId: string) => {
    console.log('TODO: Implement comment deletion:', commentId)
    // This would remove or mark the comment as deleted
  }

  /**
   * Handle comment flagging
   */
  const handleCommentFlag = (commentId: string) => {
    console.log('TODO: Implement comment flagging:', commentId)
    // This would report the comment for moderation
  }

  /**
   * Handle reply action
   */
  const handleReply = (parentId: string) => {
    console.log('TODO: Handle reply to comment:', parentId)
    // This would refresh the comments to show the new reply
    loadComments(true)
  }

  /**
   * Manual refresh
   */
  const handleRefresh = () => {
    loadComments(true)
  }

  // Load comments on component mount
  useEffect(() => {
    loadComments()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollId])

  // Set up real-time subscription
  useEffect(() => {
    const unsubscribe = CommentService.subscribeToComments(pollId, (newComment) => {
      console.log('New comment received:', newComment)
      // In a real implementation, this would add the comment to the list
      loadComments(true)
    })

    return unsubscribe
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollId])

  /**
   * Loading skeleton
   */
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 3 }, (_, i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )

  /**
   * Empty state
   */
  const EmptyState = () => (
    <Card>
      <CardContent className="py-12 text-center">
        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No comments yet
        </h3>
        <p className="text-gray-600 mb-6">
          Be the first to share your thoughts on this poll!
        </p>
      </CardContent>
    </Card>
  )

  /**
   * Error state
   */
  const ErrorState = () => (
    <Alert variant="destructive">
      <AlertDescription className="flex items-center justify-between">
        <span>{error}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Try Again
        </Button>
      </AlertDescription>
    </Alert>
  )

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Comment Section Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Discussion
            </CardTitle>
            
            <div className="flex items-center gap-4">
              {stats && (
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {stats.total_comments} comments
                  </div>
                  
                  {stats.latest_comment_at && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Latest activity
                    </div>
                  )}
                </div>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="text-gray-600"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Comment Form */}
      <CommentForm
        pollId={pollId}
        onCommentSubmitted={handleCommentSubmitted}
        placeholder="Share your thoughts on this poll..."
      />

      {/* Comments List */}
      <div className="space-y-4">
        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState />
        ) : comments.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Comments Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">
                {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
              </h3>
              
              {/* Sort options could go here */}
              <div className="text-sm text-gray-500">
                Sorted by newest first
              </div>
            </div>

            {/* Comments */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onReply={handleReply}
                  onEdit={handleCommentEdit}
                  onDelete={handleCommentDelete}
                  onFlag={handleCommentFlag}
                  maxDepth={3}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

CommentList.displayName = 'CommentList'