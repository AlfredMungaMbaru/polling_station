/**
 * Comment Form Component
 * 
 * A form component for submitting new comments or replies to existing comments.
 * Includes validation, character counting, and loading states.
 */

'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MessageCircle, Send, X, AlertCircle } from 'lucide-react'
import { CommentService } from '@/lib/commentService'
import { CommentFormData, Comment } from '@/types/comments'
import { useAuth } from '@/components/AuthProvider'

/**
 * Comment form validation schema
 */
const commentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment must be less than 1000 characters')
    .refine(
      (content) => content.trim().length > 0,
      'Comment cannot be only whitespace'
    ),
})

type CommentFormProps = {
  pollId: string
  parentId?: string | null
  placeholder?: string
  onCommentSubmitted?: (comment: Comment) => void
  onCancel?: () => void
  isReply?: boolean
  className?: string
}

export const CommentForm: React.FC<CommentFormProps> = ({
  pollId,
  parentId = null,
  placeholder = "Share your thoughts on this poll...",
  onCommentSubmitted,
  onCancel,
  isReply = false,
  className = ""
}) => {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: '',
      parent_id: parentId
    }
  })

  const { watch, reset } = form
  const content = watch('content') || ''
  const characterCount = content.length
  const maxCharacters = 1000

  /**
   * Handle form submission
   */
  const onSubmit = async (data: CommentFormData) => {
    if (!user?.id) {
      setSubmitError('You must be logged in to comment')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(false)

    try {
      const result = await CommentService.submitComment({
        poll_id: pollId,
        user_id: user.id,
        content: data.content.trim(),
        parent_id: parentId
      })

      if (result.success && result.comment) {
        setSubmitSuccess(true)
        reset() // Clear the form
        
        // Call the callback function if provided
        if (onCommentSubmitted) {
          onCommentSubmitted(result.comment)
        }

        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setSubmitSuccess(false)
        }, 3000)
      } else {
        setSubmitError(result.error || 'Failed to submit comment')
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
      setSubmitError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Handle cancel action
   */
  const handleCancel = () => {
    reset()
    setSubmitError(null)
    setSubmitSuccess(false)
    if (onCancel) {
      onCancel()
    }
  }

  if (!user) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please sign in to participate in the discussion.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className={isReply ? "pb-3" : undefined}>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircle className="h-4 w-4" />
          {isReply ? 'Reply to comment' : 'Add a comment'}
        </CardTitle>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className={isReply ? "pt-0" : undefined}>
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">
                    {isReply ? 'Reply content' : 'Comment content'}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={placeholder}
                      className="min-h-[100px] resize-none"
                      {...field}
                      disabled={isSubmitting}
                      aria-describedby="character-count"
                    />
                  </FormControl>
                  
                  {/* Character count */}
                  <div 
                    id="character-count"
                    className={`text-sm text-right ${
                      characterCount > maxCharacters * 0.9 
                        ? 'text-orange-600' 
                        : characterCount > maxCharacters * 0.8 
                        ? 'text-yellow-600' 
                        : 'text-gray-500'
                    }`}
                    aria-live="polite"
                  >
                    {characterCount}/{maxCharacters}
                  </div>
                  
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Success Message */}
            {submitSuccess && (
              <Alert className="mt-4">
                <AlertDescription className="text-green-700">
                  ✓ {isReply ? 'Reply posted successfully!' : 'Comment posted successfully!'}
                </AlertDescription>
              </Alert>
            )}

            {/* Error Message */}
            {submitError && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}
          </CardContent>

          <CardFooter className="flex justify-between gap-2">
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isSubmitting || !content.trim()}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {isSubmitting 
                  ? (isReply ? 'Posting Reply...' : 'Posting...') 
                  : (isReply ? 'Post Reply' : 'Post Comment')
                }
              </Button>

              {(isReply || onCancel) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              )}
            </div>

            {/* Character count indicator */}
            <div className="hidden sm:block text-xs text-gray-400">
              {isReply ? 'Replying to comment' : 'Sharing your thoughts'}
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}

CommentForm.displayName = 'CommentForm'