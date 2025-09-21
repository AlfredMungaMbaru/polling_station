'use client'

import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { MOCK_POLLS } from '@/data/mockPolls'
import { voteSchema, VoteFormData, VoteStatus, VOTE_STATUSES, VOTE_SUBMISSION_DELAY, THANK_YOU_DISPLAY_DURATION } from '@/types/voting'
import { PollService } from '@/lib/pollService'
import { VoteSubmissionResult } from '@/lib/votingService'
import { PollNavigation } from '@/components/poll/PollNavigation'
import { PollHeader } from '@/components/poll/PollHeader'
import { VotingForm } from '@/components/poll/VotingForm'
import { LoadingState } from '@/components/poll/LoadingState'
import { ThankYouMessage } from '@/components/poll/ThankYouMessage'
import { PollResults } from '@/components/poll/PollResults'
import { PollNotFound } from '@/components/poll/PollNotFound'
import { ErrorMessage } from '@/components/poll/ErrorMessage'

export default function PollDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  // State management with better naming
  const [currentVoteStatus, setCurrentVoteStatus] = useState<VoteStatus>(VOTE_STATUSES.VOTING)
  const [userSubmittedVote, setUserSubmittedVote] = useState<string | null>(null)
  const [voteError, setVoteError] = useState<string | null>(null)
  const [voteErrorDetails, setVoteErrorDetails] = useState<string | null>(null)

  // Get poll data
  const pollId = params.id as string
  const currentPoll = MOCK_POLLS[pollId as keyof typeof MOCK_POLLS]

  // Form setup with proper configuration
  const voteForm = useForm<VoteFormData>({
    resolver: zodResolver(voteSchema),
    defaultValues: { optionId: '' },
  })

  // Clear error messages
  const clearError = useCallback(() => {
    setVoteError(null)
    setVoteErrorDetails(null)
  }, [])

  // Optimized vote submission handler with robust error handling
  const handleVoteSubmission = useCallback(async (formData: VoteFormData) => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    setCurrentVoteStatus(VOTE_STATUSES.SUBMITTING)
    clearError()

    try {
      // Use the new VotingService for robust vote submission
      const result: VoteSubmissionResult = await PollService.submitVote(
        pollId,
        formData.optionId,
        user.id
      )

      if (result.success) {
        // Update state on successful submission
        setUserSubmittedVote(formData.optionId)
        setCurrentVoteStatus(VOTE_STATUSES.VOTED)
        voteForm.reset()

        // Auto-transition to results
        setTimeout(() => {
          setCurrentVoteStatus(VOTE_STATUSES.RESULTS)
        }, THANK_YOU_DISPLAY_DURATION)

        console.log('Vote submitted successfully:', result.voteId)
      } else {
        // Handle voting errors with detailed feedback
        setVoteError(result.message)
        setVoteErrorDetails(result.error?.message || 'Unknown error occurred')
        setCurrentVoteStatus(VOTE_STATUSES.VOTING)
        
        console.error('Vote submission failed:', result.error)
      }

    } catch (error) {
      console.error('Unexpected error submitting vote:', error)
      setVoteError('An unexpected error occurred while submitting your vote')
      setVoteErrorDetails(error instanceof Error ? error.message : 'Unknown error')
      setCurrentVoteStatus(VOTE_STATUSES.VOTING)
    }
  }, [user, router, pollId, voteForm, clearError])

  // Vote again handler with useCallback
  const handleVoteAgain = useCallback(() => {
    setCurrentVoteStatus(VOTE_STATUSES.VOTING)
    voteForm.reset()
    setUserSubmittedVote(null)
    clearError()
  }, [voteForm, clearError])

  // Retry vote submission
  const handleRetryVote = useCallback(() => {
    clearError()
    setCurrentVoteStatus(VOTE_STATUSES.VOTING)
  }, [clearError])

  // Early returns for loading and error states
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!currentPoll) {
    return <PollNotFound />
  }

  // Render main poll interface
  return (
    <div className="min-h-screen bg-gray-50">
      <PollNavigation />
      
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <PollHeader poll={currentPoll} />
          
          {/* Show error message if vote submission failed */}
          {voteError && (
            <ErrorMessage
              title="Vote Submission Failed"
              message={voteError}
              details={voteErrorDetails || undefined}
              onRetry={handleRetryVote}
              onDismiss={clearError}
            />
          )}
          
          {currentVoteStatus === VOTE_STATUSES.VOTING && (
            <VotingForm
              poll={currentPoll}
              user={user}
              form={voteForm}
              onSubmit={handleVoteSubmission}
            />
          )}

          {currentVoteStatus === VOTE_STATUSES.SUBMITTING && (
            <LoadingState message="Submitting your vote..." />
          )}

          {currentVoteStatus === VOTE_STATUSES.VOTED && <ThankYouMessage />}

          {currentVoteStatus === VOTE_STATUSES.RESULTS && (
            <PollResults
              poll={currentPoll}
              submittedVote={userSubmittedVote}
              onVoteAgain={handleVoteAgain}
            />
          )}
        </div>
      </main>
    </div>
  )
}