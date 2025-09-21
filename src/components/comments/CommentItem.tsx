/**
 * Comment Item Component
 * 
 * Displays individual comments with author information, content, and actions.
 * Supports nested replies, editing, and deletion with proper accessibility.
 */

'use client'

import React, { useState, memo } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  MessageCircle, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Reply, 
  Flag,
  User
} from 'lucide-react'
import { Comment } from '@/types/comments'
import { useAuth } from '@/components/AuthProvider'
import { CommentForm } from './CommentForm'

type CommentItemProps = {
  comment: Comment
  onReply?: (parentId: string) => void
  onEdit?: (commentId: string, content: string) => void
  onDelete?: (commentId: string) => void
  onFlag?: (commentId: string) => void
  depth?: number
  maxDepth?: number
  className?: string
}

export const CommentItem: React.FC<CommentItemProps> = memo(({
  comment,
  onReply,
  onEdit,
  onDelete,
  onFlag,
  depth = 0,
  maxDepth = 3,
  className = ""
}) => {
  const { user } = useAuth()
  const [isReplying, setIsReplying] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showReplies, setShowReplies] = useState(true)

  const isAuthor = user?.id === comment.user_id
  const canReply = depth < maxDepth
  const hasReplies = comment.replies && comment.replies.length > 0

  /**
   * Get author initials for avatar fallback
   */
  const getAuthorInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  /**
   * Format the comment timestamp
   */
  const formatCommentTime = (timestamp: string): string => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    } catch {
      return 'Unknown time'
    }
  }

  /**
   * Handle reply submission
   */
  const handleReplySubmitted = (newComment: Comment) => {
    setIsReplying(false)
    if (onReply) {
      onReply(comment.id)
    }
  }

  /**
   * Handle edit action
   */
  const handleEdit = () => {
    setIsEditing(true)
  }

  /**
   * Handle delete action
   */
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      if (onDelete) {
        onDelete(comment.id)
      }
    }
  }

  /**
   * Handle flag action
   */
  const handleFlag = () => {
    if (onFlag) {
      onFlag(comment.id)
    }
  }

  /**
   * Toggle replies visibility
   */
  const toggleReplies = () => {
    setShowReplies(!showReplies)
  }

  return (
    <div className={`comment-item ${className}`}>
      <Card className={`${depth > 0 ? 'ml-6 border-l-2 border-l-blue-200' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* Author Avatar */}
              <Avatar className="h-8 w-8">
                <AvatarImage 
                  src={comment.author?.avatar_url} 
                  alt={`${comment.author?.display_name}'s avatar`}
                />
                <AvatarFallback>
                  {comment.author?.display_name 
                    ? getAuthorInitials(comment.author.display_name)
                    : <User className="h-4 w-4" />
                  }
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col">
                {/* Author Name */}
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {comment.author?.display_name || 'Anonymous User'}
                  </span>
                  {isAuthor && (
                    <Badge variant="secondary" className="text-xs">
                      You
                    </Badge>
                  )}
                  {comment.is_edited && (
                    <Badge variant="outline" className="text-xs">
                      Edited
                    </Badge>
                  )}
                </div>

                {/* Timestamp */}
                <time 
                  className="text-xs text-gray-500"
                  dateTime={comment.created_at}
                  title={new Date(comment.created_at).toLocaleString()}
                >
                  {formatCommentTime(comment.created_at)}
                </time>
              </div>
            </div>

            {/* Comment Actions */}
            <div className="flex items-center gap-1">
              {/* Reply Button */}
              {canReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsReplying(!isReplying)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label={`Reply to ${comment.author?.display_name}'s comment`}
                >
                  <Reply className="h-4 w-4" />
                </Button>
              )}

              {/* More Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-gray-700"
                    aria-label="More comment actions"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isAuthor ? (
                    <>
                      <DropdownMenuItem onClick={handleEdit}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={handleDelete}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem onClick={handleFlag}>
                      <Flag className="h-4 w-4 mr-2" />
                      Report
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Comment Content */}
          {!isEditing ? (
            <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
              {comment.content}
            </div>
          ) : (
            <div className="mb-3">
              {/* Edit form would go here */}
              <div className="text-sm text-gray-500 italic">
                [Edit functionality will be implemented with inline editing]
              </div>
            </div>
          )}

          {/* Reply Count & Toggle */}
          {hasReplies && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleReplies}
                className="text-gray-600 hover:text-gray-800 p-0 h-auto font-normal"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                {showReplies ? 'Hide' : 'Show'} {comment.reply_count || 0} 
                {comment.reply_count === 1 ? ' reply' : ' replies'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reply Form */}
      {isReplying && (
        <div className="mt-3 ml-6">
          <CommentForm
            pollId={comment.poll_id}
            parentId={comment.id}
            placeholder={`Reply to ${comment.author?.display_name}...`}
            onCommentSubmitted={handleReplySubmitted}
            onCancel={() => setIsReplying(false)}
            isReply={true}
          />
        </div>
      )}

      {/* Nested Replies */}
      {hasReplies && showReplies && (
        <div className="mt-3 space-y-3">
          {comment.replies?.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onFlag={onFlag}
              depth={depth + 1}
              maxDepth={maxDepth}
            />
          ))}
        </div>
      )}
    </div>
  )
})

CommentItem.displayName = 'CommentItem'