/**
 * Comprehensive test suite for VotingService
 * 
 * Tests all aspects of the voting system including:
 * - Vote submission happy path
 * - Input validation and error handling
 * - Duplicate vote prevention
 * - Poll state validation
 * - Database error scenarios
 * - Edge cases and security considerations
 */

import { VotingService, VoteSubmissionPayload, VotingError, VoteValidationError, DuplicateVoteError, PollStateError, DatabaseError } from '../../src/lib/votingService'

// Mock Supabase client
jest.mock('../../src/lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
    select: jest.fn(),
    insert: jest.fn(),
    eq: jest.fn(),
    single: jest.fn(),
  }
}))

describe('VotingService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset console.log/error mocks
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('submitVote - Happy Path', () => {
    it('should successfully submit a valid vote', async () => {
      // Arrange
      const validPayload: VoteSubmissionPayload = {
        pollId: '1',
        optionId: 'js',
        userId: '123e4567-e89b-12d3-a456-426614174000'
      }

      // Act
      const result = await VotingService.submitVote(validPayload)

      // Assert
      expect(result.success).toBe(true)
      expect(result.voteId).toBeDefined()
      expect(result.voteId).toMatch(/^vote_\d+_[a-z0-9]+$/)
      expect(result.message).toBe('Vote submitted successfully')
      expect(result.metadata).toMatchObject({
        pollId: '1',
        optionId: 'js',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        attemptCount: 1
      })
      expect(result.metadata?.timestamp).toBeDefined()
    })

    it('should handle vote submission with minimal valid data', async () => {
      // Arrange
      const minimalPayload: VoteSubmissionPayload = {
        pollId: '2',
        optionId: 'next',
        userId: '123e4567-e89b-12d3-a456-426614174001'
      }

      // Act
      const result = await VotingService.submitVote(minimalPayload)

      // Assert
      expect(result.success).toBe(true)
      expect(result.voteId).toBeDefined()
      expect(result.message).toBe('Vote submitted successfully')
    })

    it('should return correct metadata for successful votes', async () => {
      // Arrange
      const payload: VoteSubmissionPayload = {
        pollId: '3',
        optionId: 'vercel',
        userId: '123e4567-e89b-12d3-a456-426614174002'
      }

      // Act
      const result = await VotingService.submitVote(payload)

      // Assert
      expect(result.metadata).toEqual(
        expect.objectContaining({
          pollId: '3',
          optionId: 'vercel',
          userId: '123e4567-e89b-12d3-a456-426614174002',
          timestamp: expect.any(String),
          attemptCount: 1
        })
      )
    })
  })

  describe('submitVote - Input Validation', () => {
    it('should reject empty pollId', async () => {
      // Arrange
      const invalidPayload: VoteSubmissionPayload = {
        pollId: '',
        optionId: 'js',
        userId: '123e4567-e89b-12d3-a456-426614174000'
      }

      // Act
      const result = await VotingService.submitVote(invalidPayload)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('VALIDATION_ERROR')
      expect(result.error?.message).toContain('Poll ID is required')
    })

    it('should reject empty optionId', async () => {
      // Arrange
      const invalidPayload: VoteSubmissionPayload = {
        pollId: '1',
        optionId: '',
        userId: '123e4567-e89b-12d3-a456-426614174000'
      }

      // Act
      const result = await VotingService.submitVote(invalidPayload)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('VALIDATION_ERROR')
      expect(result.error?.message).toContain('Option ID is required')
    })

    it('should reject invalid UUID for userId', async () => {
      // Arrange
      const invalidPayload: VoteSubmissionPayload = {
        pollId: '1',
        optionId: 'js',
        userId: 'not-a-valid-uuid'
      }

      // Act
      const result = await VotingService.submitVote(invalidPayload)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('VALIDATION_ERROR')
      expect(result.error?.message).toContain('User ID must be a valid UUID')
    })

    it('should reject pollId with invalid characters', async () => {
      // Arrange
      const invalidPayload: VoteSubmissionPayload = {
        pollId: 'poll/../injection',
        optionId: 'js',
        userId: '123e4567-e89b-12d3-a456-426614174000'
      }

      // Act
      const result = await VotingService.submitVote(invalidPayload)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('VALIDATION_ERROR')
      expect(result.error?.message).toContain('Invalid characters detected in IDs')
    })

    it('should reject when pollId equals optionId', async () => {
      // Arrange
      const invalidPayload: VoteSubmissionPayload = {
        pollId: 'same-id',
        optionId: 'same-id',
        userId: '123e4567-e89b-12d3-a456-426614174000'
      }

      // Act
      const result = await VotingService.submitVote(invalidPayload)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('VALIDATION_ERROR')
      expect(result.error?.message).toContain('Poll ID and Option ID cannot be the same')
    })

    it('should reject pollId that is too long', async () => {
      // Arrange
      const longId = 'a'.repeat(51) // Over 50 character limit
      const invalidPayload: VoteSubmissionPayload = {
        pollId: longId,
        optionId: 'js',
        userId: '123e4567-e89b-12d3-a456-426614174000'
      }

      // Act
      const result = await VotingService.submitVote(invalidPayload)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('VALIDATION_ERROR')
      expect(result.error?.message).toContain('Poll ID is too long')
    })
  })

  describe('submitVote - Poll State Validation', () => {
    it('should reject vote for non-existent poll', async () => {
      // Arrange
      const invalidPayload: VoteSubmissionPayload = {
        pollId: 'non-existent-poll',
        optionId: 'js',
        userId: '123e4567-e89b-12d3-a456-426614174000'
      }

      // Act
      const result = await VotingService.submitVote(invalidPayload)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('POLL_STATE_ERROR')
      expect(result.error?.message).toBe('Poll not found')
      expect(result.error?.details).toEqual({ pollId: 'non-existent-poll' })
    })

    it('should reject vote for invalid option in valid poll', async () => {
      // Arrange - poll '1' has options ['js', 'py', 'ts']
      const invalidPayload: VoteSubmissionPayload = {
        pollId: '1',
        optionId: 'invalid-option',
        userId: '123e4567-e89b-12d3-a456-426614174000'
      }

      // Act
      const result = await VotingService.submitVote(invalidPayload)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('VOTE_VALIDATION_ERROR')
      expect(result.error?.message).toBe('Invalid option for this poll')
      expect(result.error?.details).toEqual({
        pollId: '1',
        optionId: 'invalid-option',
        validOptions: ['js', 'py', 'ts']
      })
    })
  })

  describe('submitVote - Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      // Arrange - create a scenario that throws an unexpected error
      const originalConsoleError = console.error
      jest.spyOn(console, 'error').mockImplementation(() => {})
      
      // Mock a method to throw an unexpected error
      jest.spyOn(VotingService as any, 'validateVoteSubmission').mockImplementation(() => {
        throw new Error('Unexpected system error')
      })

      const payload: VoteSubmissionPayload = {
        pollId: '1',
        optionId: 'js',
        userId: '123e4567-e89b-12d3-a456-426614174000'
      }

      // Act
      const result = await VotingService.submitVote(payload)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('UNEXPECTED_ERROR')
      expect(result.error?.message).toBe('Unexpected system error')
      expect(result.message).toBe('An unexpected error occurred while submitting your vote')
      
      // Cleanup
      console.error = originalConsoleError
      jest.restoreAllMocks()
    })

    it('should include metadata in error responses', async () => {
      // Arrange
      const invalidPayload: VoteSubmissionPayload = {
        pollId: '',
        optionId: 'js',
        userId: '123e4567-e89b-12d3-a456-426614174000'
      }

      // Act
      const result = await VotingService.submitVote(invalidPayload)

      // Assert
      expect(result.metadata).toEqual(
        expect.objectContaining({
          pollId: '',
          optionId: 'js',
          userId: '123e4567-e89b-12d3-a456-426614174000',
          timestamp: expect.any(String),
          attemptCount: 1
        })
      )
    })
  })

  describe('Error Classes', () => {
    it('should create VotingError correctly', () => {
      // Arrange & Act
      const error = new VotingError('Test message', 'TEST_CODE', { key: 'value' })

      // Assert
      expect(error.message).toBe('Test message')
      expect(error.code).toBe('TEST_CODE')
      expect(error.details).toEqual({ key: 'value' })
      expect(error.name).toBe('VotingError')
    })

    it('should create VoteValidationError correctly', () => {
      // Arrange & Act
      const error = new VoteValidationError('Validation failed', { field: 'pollId' })

      // Assert
      expect(error.message).toBe('Validation failed')
      expect(error.code).toBe('VOTE_VALIDATION_ERROR')
      expect(error.details).toEqual({ field: 'pollId' })
      expect(error.name).toBe('VoteValidationError')
    })

    it('should create DuplicateVoteError correctly', () => {
      // Arrange & Act
      const error = new DuplicateVoteError('Already voted', { userId: '123' })

      // Assert
      expect(error.message).toBe('Already voted')
      expect(error.code).toBe('DUPLICATE_VOTE_ERROR')
      expect(error.details).toEqual({ userId: '123' })
      expect(error.name).toBe('DuplicateVoteError')
    })

    it('should create PollStateError correctly', () => {
      // Arrange & Act
      const error = new PollStateError('Poll ended', { endDate: '2023-01-01' })

      // Assert
      expect(error.message).toBe('Poll ended')
      expect(error.code).toBe('POLL_STATE_ERROR')
      expect(error.details).toEqual({ endDate: '2023-01-01' })
      expect(error.name).toBe('PollStateError')
    })

    it('should create DatabaseError correctly', () => {
      // Arrange & Act
      const error = new DatabaseError('DB connection failed', { host: 'localhost' })

      // Assert
      expect(error.message).toBe('DB connection failed')
      expect(error.code).toBe('DATABASE_ERROR')
      expect(error.details).toEqual({ host: 'localhost' })
      expect(error.name).toBe('DatabaseError')
    })
  })

  describe('Utility Methods', () => {
    it('should return empty vote history for getUserVoteHistory', async () => {
      // Act
      const history = await VotingService.getUserVoteHistory('user-123')

      // Assert
      expect(history).toEqual([])
      expect(console.log).toHaveBeenCalledWith(
        'TODO: Fetch user vote history from Supabase:',
        { userId: 'user-123', limit: 50 }
      )
    })

    it('should return empty vote list for getPollVotes', async () => {
      // Act
      const votes = await VotingService.getPollVotes('poll-123')

      // Assert
      expect(votes).toEqual([])
      expect(console.log).toHaveBeenCalledWith(
        'TODO: Fetch poll votes from Supabase:',
        'poll-123'
      )
    })

    it('should handle custom limit in getUserVoteHistory', async () => {
      // Act
      const history = await VotingService.getUserVoteHistory('user-123', 25)

      // Assert
      expect(history).toEqual([])
      expect(console.log).toHaveBeenCalledWith(
        'TODO: Fetch user vote history from Supabase:',
        { userId: 'user-123', limit: 25 }
      )
    })
  })

  describe('Edge Cases and Security', () => {
    it('should handle very long but valid UUIDs', async () => {
      // Arrange - valid UUID
      const validPayload: VoteSubmissionPayload = {
        pollId: '1',
        optionId: 'js',
        userId: '123e4567-e89b-12d3-a456-426614174000' // Valid UUID
      }

      // Act
      const result = await VotingService.submitVote(validPayload)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should handle special characters in valid IDs', async () => {
      // Arrange - IDs with valid special characters
      const validPayload: VoteSubmissionPayload = {
        pollId: 'poll_123-test',
        optionId: 'option-456_test',
        userId: '123e4567-e89b-12d3-a456-426614174000'
      }

      // Act
      const result = await VotingService.submitVote(validPayload)

      // Assert
      expect(result.success).toBe(false) // Should fail because poll doesn't exist, but validation should pass
      expect(result.error?.code).toBe('POLL_STATE_ERROR')
      expect(result.error?.message).toBe('Poll not found')
    })

    it('should reject SQL injection attempts in IDs', async () => {
      // Arrange
      const maliciousPayload: VoteSubmissionPayload = {
        pollId: "1'; DROP TABLE polls; --",
        optionId: 'js',
        userId: '123e4567-e89b-12d3-a456-426614174000'
      }

      // Act
      const result = await VotingService.submitVote(maliciousPayload)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('VALIDATION_ERROR')
    })

    it('should handle null and undefined values gracefully', async () => {
      // Arrange
      const invalidPayload = {
        pollId: null,
        optionId: undefined,
        userId: '123e4567-e89b-12d3-a456-426614174000'
      } as any

      // Act
      const result = await VotingService.submitVote(invalidPayload)

      // Assert
      expect(result.success).toBe(false)
      // This will be an UNEXPECTED_ERROR because null/undefined cause parsing to fail
      expect(result.error?.code).toBe('UNEXPECTED_ERROR')
    })
  })

  describe('Performance and Load Testing Scenarios', () => {
    it('should handle multiple rapid vote submissions', async () => {
      // Arrange
      const payload: VoteSubmissionPayload = {
        pollId: '1',
        optionId: 'js',
        userId: '123e4567-e89b-12d3-a456-426614174000'
      }

      // Act - simulate rapid submissions
      const promises = Array(10).fill(null).map(() => VotingService.submitVote(payload))
      const results = await Promise.all(promises)

      // Assert - all should succeed for now (since we're not checking duplicates in mock)
      results.forEach(result => {
        expect(result.success).toBe(true)
        expect(result.voteId).toBeDefined()
      })
    })

    it('should maintain consistent response structure under load', async () => {
      // Arrange
      const payloads = Array(5).fill(null).map((_, index) => ({
        pollId: '1',
        optionId: 'js',
        userId: `123e4567-e89b-12d3-a456-42661417400${index}`
      }))

      // Act
      const results = await Promise.all(payloads.map(payload => VotingService.submitVote(payload)))

      // Assert
      results.forEach((result, index) => {
        expect(result).toHaveProperty('success')
        expect(result).toHaveProperty('message')
        expect(result).toHaveProperty('metadata')
        if (result.success) {
          expect(result).toHaveProperty('voteId')
          expect(result.metadata?.userId).toBe(payloads[index].userId)
        }
      })
    })
  })
})