/**
 * Core Poll Voting Service
 * 
 * This module provides the core voting functionality for the polling application.
 * It handles vote submission, validation, duplicate prevention, and error handling
 * with full Supabase integration support.
 * 
 * @module VotingService
 * @version 1.0.0
 */

import { supabase } from './supabaseClient'
import { z } from 'zod'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Core vote data structure for database storage
 */
export interface VoteRecord {
  id?: string
  poll_id: string
  option_id: string
  user_id: string
  created_at?: string
  updated_at?: string
}

/**
 * Vote submission payload from frontend
 */
export interface VoteSubmissionPayload {
  pollId: string
  optionId: string
  userId: string
}

/**
 * Vote validation result
 */
export interface VoteValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Vote submission result with detailed feedback
 */
export interface VoteSubmissionResult {
  success: boolean
  voteId?: string
  message: string
  error?: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
  metadata?: {
    pollId: string
    optionId: string
    userId: string
    timestamp: string
    attemptCount?: number
  }
}

/**
 * Poll state for vote validation
 */
export interface PollState {
  id: string
  isActive: boolean
  hasEnded: boolean
  allowsMultipleVotes: boolean
  endDate?: string
  optionIds: string[]
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Zod schema for vote submission validation
 * Provides runtime type checking and detailed error messages
 */
export const voteSubmissionSchema = z.object({
  pollId: z
    .string()
    .min(1, 'Poll ID is required')
    .max(50, 'Poll ID is too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Poll ID contains invalid characters'),
  
  optionId: z
    .string()
    .min(1, 'Option ID is required')
    .max(50, 'Option ID is too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Option ID contains invalid characters'),
  
  userId: z
    .string()
    .min(1, 'User ID is required')
    .max(50, 'User ID is too long')
    .uuid('User ID must be a valid UUID')
})

/**
 * Type derived from validation schema
 */
export type ValidatedVotePayload = z.infer<typeof voteSubmissionSchema>

// ============================================================================
// ERROR CLASSES
// ============================================================================

/**
 * Base class for voting-related errors
 */
export class VotingError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'VotingError'
  }
}

/**
 * Error for invalid vote submissions
 */
export class VoteValidationError extends VotingError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VOTE_VALIDATION_ERROR', details)
    this.name = 'VoteValidationError'
  }
}

/**
 * Error for duplicate vote attempts
 */
export class DuplicateVoteError extends VotingError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'DUPLICATE_VOTE_ERROR', details)
    this.name = 'DuplicateVoteError'
  }
}

/**
 * Error for inactive or ended polls
 */
export class PollStateError extends VotingError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'POLL_STATE_ERROR', details)
    this.name = 'PollStateError'
  }
}

/**
 * Error for database operations
 */
export class DatabaseError extends VotingError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'DATABASE_ERROR', details)
    this.name = 'DatabaseError'
  }
}

// ============================================================================
// CORE VOTING SERVICE
// ============================================================================

/**
 * Core voting service class
 * 
 * Provides methods for vote submission, validation, and management.
 * Handles all aspects of the voting process including security,
 * validation, and error handling.
 */
export class VotingService {
  
  /**
   * Submit a vote for a poll with comprehensive validation and error handling
   * 
   * This is the main voting function that handles the complete vote submission
   * process including validation, duplicate checking, and database persistence.
   * 
   * @param payload - Vote submission data
   * @returns Promise<VoteSubmissionResult> - Detailed result of vote submission
   * 
   * @example
   * ```typescript
   * const result = await VotingService.submitVote({
   *   pollId: 'poll-123',
   *   optionId: 'option-456',
   *   userId: 'user-789'
   * })
   * 
   * if (result.success) {
   *   console.log('Vote submitted successfully:', result.voteId)
   * } else {
   *   console.error('Vote failed:', result.error.message)
   * }
   * ```
   */
  static async submitVote(payload: VoteSubmissionPayload): Promise<VoteSubmissionResult> {
    const attemptCount = 1
    
    try {
      // Step 1: Validate input payload
      const validationResult = await this.validateVoteSubmission(payload)
      if (!validationResult.isValid) {
        return {
          success: false,
          message: 'Vote validation failed',
          error: {
            code: 'VALIDATION_ERROR',
            message: validationResult.errors.join(', '),
            details: { errors: validationResult.errors, warnings: validationResult.warnings }
          },
          metadata: {
            pollId: payload.pollId,
            optionId: payload.optionId,
            userId: payload.userId,
            timestamp: new Date().toISOString(),
            attemptCount
          }
        }
      }

      // Step 2: Get validated payload
      const validatedPayload = voteSubmissionSchema.parse(payload)

      // Step 3: Check poll state and permissions
      const pollState = await this.getPollState(validatedPayload.pollId)
      if (!pollState) {
        throw new PollStateError('Poll not found', { pollId: validatedPayload.pollId })
      }

      if (!pollState.isActive) {
        throw new PollStateError('Poll is not active', { pollId: validatedPayload.pollId })
      }

      if (pollState.hasEnded) {
        throw new PollStateError('Poll has ended', { 
          pollId: validatedPayload.pollId,
          endDate: pollState.endDate
        })
      }

      // Step 4: Validate option exists for this poll
      if (!pollState.optionIds.includes(validatedPayload.optionId)) {
        throw new VoteValidationError('Invalid option for this poll', {
          pollId: validatedPayload.pollId,
          optionId: validatedPayload.optionId,
          validOptions: pollState.optionIds
        })
      }

      // Step 5: Check for duplicate votes (unless multiple votes allowed)
      if (!pollState.allowsMultipleVotes) {
        const hasVoted = await this.hasUserVoted(validatedPayload.pollId, validatedPayload.userId)
        if (hasVoted) {
          throw new DuplicateVoteError('User has already voted on this poll', {
            pollId: validatedPayload.pollId,
            userId: validatedPayload.userId
          })
        }
      }

      // Step 6: Submit vote to database
      const voteRecord = await this.insertVoteRecord({
        poll_id: validatedPayload.pollId,
        option_id: validatedPayload.optionId,
        user_id: validatedPayload.userId
      })

      // Step 7: Return success result
      return {
        success: true,
        voteId: voteRecord.id,
        message: 'Vote submitted successfully',
        metadata: {
          pollId: validatedPayload.pollId,
          optionId: validatedPayload.optionId,
          userId: validatedPayload.userId,
          timestamp: new Date().toISOString(),
          attemptCount
        }
      }

    } catch (error) {
      // Handle specific error types with appropriate responses
      if (error instanceof VotingError) {
        return {
          success: false,
          message: error.message,
          error: {
            code: error.code,
            message: error.message,
            details: error.details
          },
          metadata: {
            pollId: payload.pollId,
            optionId: payload.optionId,
            userId: payload.userId,
            timestamp: new Date().toISOString(),
            attemptCount
          }
        }
      }

      // Handle unexpected errors
      console.error('Unexpected error in vote submission:', error)
      return {
        success: false,
        message: 'An unexpected error occurred while submitting your vote',
        error: {
          code: 'UNEXPECTED_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        metadata: {
          pollId: payload.pollId,
          optionId: payload.optionId,
          userId: payload.userId,
          timestamp: new Date().toISOString(),
          attemptCount
        }
      }
    }
  }

  /**
   * Validate vote submission payload
   * 
   * Performs comprehensive validation of the vote submission data
   * including format validation, security checks, and business rules.
   * 
   * @param payload - Vote submission data to validate
   * @returns Promise<VoteValidationResult> - Validation result with errors/warnings
   */
  private static async validateVoteSubmission(payload: VoteSubmissionPayload): Promise<VoteValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Use Zod schema for basic validation
      voteSubmissionSchema.parse(payload)
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.issues.map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`))
      } else {
        errors.push('Invalid payload format')
      }
    }

    // Additional business logic validation
    if (payload.pollId === payload.optionId) {
      errors.push('Poll ID and Option ID cannot be the same')
    }

    // Security checks
    if (payload.pollId.includes('../') || payload.optionId.includes('../')) {
      errors.push('Invalid characters detected in IDs')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Get current state of a poll for validation
   * 
   * @param pollId - ID of the poll to check
   * @returns Promise<PollState | null> - Current poll state or null if not found
   */
  private static async getPollState(pollId: string): Promise<PollState | null> {
    try {
      // TODO: Replace with actual Supabase query
      // const { data, error } = await supabase
      //   .from('polls')
      //   .select(`
      //     id,
      //     is_active,
      //     end_date,
      //     allows_multiple_votes,
      //     poll_options(id)
      //   `)
      //   .eq('id', pollId)
      //   .single()

      console.log('TODO: Fetch poll state from Supabase:', pollId)
      
      // Mock implementation for development
      const mockPollStates: Record<string, PollState> = {
        '1': {
          id: '1',
          isActive: true,
          hasEnded: false,
          allowsMultipleVotes: false,
          optionIds: ['js', 'py', 'ts']
        },
        '2': {
          id: '2',
          isActive: true,
          hasEnded: false,
          allowsMultipleVotes: false,
          optionIds: ['next', 'remix', 'vite']
        },
        '3': {
          id: '3',
          isActive: true,
          hasEnded: false,
          allowsMultipleVotes: false,
          optionIds: ['vercel', 'netlify', 'aws', 'railway']
        }
      }

      return mockPollStates[pollId] || null

    } catch (error) {
      console.error('Error fetching poll state:', error)
      throw new DatabaseError('Failed to fetch poll state', { pollId })
    }
  }

  /**
   * Check if user has already voted on a poll
   * 
   * @param pollId - ID of the poll
   * @param userId - ID of the user
   * @returns Promise<boolean> - True if user has voted, false otherwise
   */
  private static async hasUserVoted(pollId: string, userId: string): Promise<boolean> {
    try {
      // TODO: Replace with actual Supabase query
      // const { data, error } = await supabase
      //   .from('poll_votes')
      //   .select('id')
      //   .eq('poll_id', pollId)
      //   .eq('user_id', userId)
      //   .maybeSingle()

      console.log('TODO: Check if user has voted in Supabase:', { pollId, userId })
      
      // Mock implementation - return false for development
      return false

    } catch (error) {
      console.error('Error checking vote status:', error)
      throw new DatabaseError('Failed to check vote status', { pollId, userId })
    }
  }

  /**
   * Insert vote record into database
   * 
   * @param voteRecord - Vote data to insert
   * @returns Promise<VoteRecord> - Inserted vote record with generated ID
   */
  private static async insertVoteRecord(voteRecord: Omit<VoteRecord, 'id' | 'created_at' | 'updated_at'>): Promise<VoteRecord> {
    try {
      // TODO: Replace with actual Supabase insertion
      // const { data, error } = await supabase
      //   .from('poll_votes')
      //   .insert({
      //     poll_id: voteRecord.poll_id,
      //     option_id: voteRecord.option_id,
      //     user_id: voteRecord.user_id
      //   })
      //   .select()
      //   .single()

      console.log('TODO: Insert vote record in Supabase:', voteRecord)
      
      // Mock implementation - simulate database insertion
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const mockVoteRecord: VoteRecord = {
        id: `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...voteRecord,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      return mockVoteRecord

    } catch (error) {
      console.error('Error inserting vote record:', error)
      throw new DatabaseError('Failed to insert vote record', voteRecord)
    }
  }

  /**
   * Get vote history for a user
   * 
   * @param userId - ID of the user
   * @param limit - Maximum number of votes to return
   * @returns Promise<VoteRecord[]> - Array of user's votes
   */
  static async getUserVoteHistory(userId: string, limit: number = 50): Promise<VoteRecord[]> {
    try {
      // TODO: Replace with actual Supabase query
      console.log('TODO: Fetch user vote history from Supabase:', { userId, limit })
      return []
    } catch (error) {
      console.error('Error fetching vote history:', error)
      throw new DatabaseError('Failed to fetch vote history', { userId })
    }
  }

  /**
   * Get all votes for a specific poll
   * 
   * @param pollId - ID of the poll
   * @returns Promise<VoteRecord[]> - Array of all votes for the poll
   */
  static async getPollVotes(pollId: string): Promise<VoteRecord[]> {
    try {
      // TODO: Replace with actual Supabase query
      console.log('TODO: Fetch poll votes from Supabase:', pollId)
      return []
    } catch (error) {
      console.error('Error fetching poll votes:', error)
      throw new DatabaseError('Failed to fetch poll votes', { pollId })
    }
  }
}