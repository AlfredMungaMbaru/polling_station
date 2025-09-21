import { z } from 'zod'

// Vote form validation schema
export const voteSchema = z.object({
  optionId: z.string().min(1, 'Please select an option'),
})

export type VoteFormData = z.infer<typeof voteSchema>

// Vote status enum with better type safety
export const VOTE_STATUSES = {
  VOTING: 'voting',
  SUBMITTING: 'submitting', 
  VOTED: 'voted',
  RESULTS: 'results'
} as const

export type VoteStatus = typeof VOTE_STATUSES[keyof typeof VOTE_STATUSES]

// Constants for better maintainability
export const VOTE_SUBMISSION_DELAY = 1000 // ms
export const THANK_YOU_DISPLAY_DURATION = 3000 // ms