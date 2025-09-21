/**
 * Integration tests for the complete voting flow
 * 
 * Tests the integration between VotingService, PollService, and the UI components
 * to ensure the complete voting workflow functions correctly.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PollService } from '../../src/lib/pollService'
import { VotingService } from '../../src/lib/votingService'

// Mock the Supabase client
jest.mock('../../src/lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
    select: jest.fn(),
    insert: jest.fn(),
    eq: jest.fn(),
    single: jest.fn(),
  }
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useParams: () => ({ id: '1' }),
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}))

// Mock Auth provider
jest.mock('../../src/components/AuthProvider', () => ({
  useAuth: () => ({
    user: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com'
    },
    loading: false
  })
}))

describe('Voting Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('PollService Integration with VotingService', () => {
    it('should successfully submit vote through PollService', async () => {
      // Arrange
      const pollId = '1'
      const optionId = 'js'
      const userId = '123e4567-e89b-12d3-a456-426614174000'

      // Act
      const result = await PollService.submitVote(pollId, optionId, userId)

      // Assert
      expect(result.success).toBe(true)
      expect(result.voteId).toBeDefined()
      expect(result.message).toBe('Vote submitted successfully')
      expect(result.metadata).toMatchObject({
        pollId,
        optionId,
        userId,
        attemptCount: 1
      })
    })

    it('should handle validation errors through PollService', async () => {
      // Arrange
      const pollId = ''  // Invalid empty poll ID
      const optionId = 'js'
      const userId = '123e4567-e89b-12d3-a456-426614174000'

      // Act
      const result = await PollService.submitVote(pollId, optionId, userId)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('VALIDATION_ERROR')
      expect(result.error?.message).toContain('Poll ID is required')
    })

    it('should handle non-existent poll errors', async () => {
      // Arrange
      const pollId = 'non-existent-poll'
      const optionId = 'js'
      const userId = '123e4567-e89b-12d3-a456-426614174000'

      // Act
      const result = await PollService.submitVote(pollId, optionId, userId)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('POLL_STATE_ERROR')
      expect(result.error?.message).toBe('Poll not found')
    })

    it('should handle invalid option for valid poll', async () => {
      // Arrange
      const pollId = '1'  // Valid poll with options ['js', 'py', 'ts']
      const optionId = 'invalid-option'
      const userId = '123e4567-e89b-12d3-a456-426614174000'

      // Act
      const result = await PollService.submitVote(pollId, optionId, userId)

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

    it('should handle invalid UUID format', async () => {
      // Arrange
      const pollId = '1'
      const optionId = 'js'
      const userId = 'not-a-valid-uuid'

      // Act
      const result = await PollService.submitVote(pollId, optionId, userId)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('VALIDATION_ERROR')
      expect(result.error?.message).toContain('User ID must be a valid UUID')
    })
  })

  describe('End-to-End Voting Scenarios', () => {
    it('should complete successful voting flow for all valid polls', async () => {
      // Test data for all mock polls
      const testCases = [
        { pollId: '1', optionId: 'js' },
        { pollId: '1', optionId: 'py' },
        { pollId: '1', optionId: 'ts' },
        { pollId: '2', optionId: 'next' },
        { pollId: '2', optionId: 'remix' },
        { pollId: '2', optionId: 'vite' },
        { pollId: '3', optionId: 'vercel' },
        { pollId: '3', optionId: 'netlify' },
        { pollId: '3', optionId: 'aws' },
        { pollId: '3', optionId: 'railway' }
      ]

      const userId = '123e4567-e89b-12d3-a456-426614174000'

      // Act & Assert
      for (const testCase of testCases) {
        const result = await PollService.submitVote(testCase.pollId, testCase.optionId, userId)
        
        expect(result.success).toBe(true)
        expect(result.voteId).toBeDefined()
        expect(result.metadata?.pollId).toBe(testCase.pollId)
        expect(result.metadata?.optionId).toBe(testCase.optionId)
        expect(result.metadata?.userId).toBe(userId)
      }
    })

    it('should handle multiple votes from different users', async () => {
      // Arrange
      const pollId = '1'
      const optionId = 'js'
      const users = [
        '123e4567-e89b-12d3-a456-426614174000',
        '123e4567-e89b-12d3-a456-426614174001',
        '123e4567-e89b-12d3-a456-426614174002'
      ]

      // Act & Assert
      const results = await Promise.all(
        users.map(userId => PollService.submitVote(pollId, optionId, userId))
      )

      results.forEach((result, index) => {
        expect(result.success).toBe(true)
        expect(result.voteId).toBeDefined()
        expect(result.metadata?.userId).toBe(users[index])
      })
    })

    it('should handle concurrent vote submissions', async () => {
      // Arrange
      const pollId = '1'
      const userId = '123e4567-e89b-12d3-a456-426614174000'
      const options = ['js', 'py', 'ts']

      // Act - simulate concurrent submissions
      const promises = options.map(optionId => 
        PollService.submitVote(pollId, optionId, userId)
      )
      const results = await Promise.all(promises)

      // Assert - all should succeed (for now, since we're not preventing duplicate votes in mock)
      results.forEach((result, index) => {
        expect(result.success).toBe(true)
        expect(result.metadata?.optionId).toBe(options[index])
      })
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should provide detailed error information for debugging', async () => {
      // Arrange
      const invalidPayload = {
        pollId: '',
        optionId: '',
        userId: 'invalid-uuid'
      }

      // Act
      const result = await PollService.submitVote(
        invalidPayload.pollId,
        invalidPayload.optionId,
        invalidPayload.userId
      )

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error?.code).toBeDefined()
      expect(result.error?.message).toBeDefined()
      expect(result.metadata).toBeDefined()
      expect(result.metadata?.timestamp).toBeDefined()
      expect(result.metadata?.attemptCount).toBe(1)
    })

    it('should handle database simulation errors gracefully', async () => {
      // Arrange - mock an error in the insertVoteRecord method
      const originalInsert = VotingService['insertVoteRecord']
      const mockError = new Error('Database connection failed')
      
      jest.spyOn(VotingService as any, 'insertVoteRecord').mockRejectedValueOnce(mockError)

      const pollId = '1'
      const optionId = 'js'
      const userId = '123e4567-e89b-12d3-a456-426614174000'

      // Act
      const result = await PollService.submitVote(pollId, optionId, userId)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('UNEXPECTED_ERROR')
      expect(result.error?.message).toBe('Database connection failed')

      // Cleanup
      jest.restoreAllMocks()
    })

    it('should maintain data consistency during errors', async () => {
      // Arrange
      const validPayload = {
        pollId: '1',
        optionId: 'js',
        userId: '123e4567-e89b-12d3-a456-426614174000'
      }

      const invalidPayload = {
        pollId: '',
        optionId: 'js',
        userId: '123e4567-e89b-12d3-a456-426614174000'
      }

      // Act
      const validResult = await PollService.submitVote(
        validPayload.pollId,
        validPayload.optionId,
        validPayload.userId
      )

      const invalidResult = await PollService.submitVote(
        invalidPayload.pollId,
        invalidPayload.optionId,
        invalidPayload.userId
      )

      // Assert
      expect(validResult.success).toBe(true)
      expect(invalidResult.success).toBe(false)
      
      // Both should have proper metadata structure
      expect(validResult.metadata).toBeDefined()
      expect(invalidResult.metadata).toBeDefined()
    })
  })

  describe('Security and Validation', () => {
    it('should prevent SQL injection attempts in all parameters', async () => {
      // Arrange
      const maliciousInputs = [
        { pollId: "1'; DROP TABLE polls; --", optionId: 'js', userId: '123e4567-e89b-12d3-a456-426614174000' },
        { pollId: '1', optionId: "js'; DELETE FROM votes; --", userId: '123e4567-e89b-12d3-a456-426614174000' },
        { pollId: '1', optionId: 'js', userId: "'; UNION SELECT * FROM users; --" }
      ]

      // Act & Assert
      for (const maliciousInput of maliciousInputs) {
        const result = await PollService.submitVote(
          maliciousInput.pollId,
          maliciousInput.optionId,
          maliciousInput.userId
        )

        expect(result.success).toBe(false)
        expect(result.error?.code).toBe('VALIDATION_ERROR')
      }
    })

    it('should handle extremely large input values', async () => {
      // Arrange
      const largePollId = 'a'.repeat(1000)
      const largeOptionId = 'b'.repeat(1000)
      const validUserId = '123e4567-e89b-12d3-a456-426614174000'

      // Act
      const result = await PollService.submitVote(largePollId, largeOptionId, validUserId)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('VALIDATION_ERROR')
      expect(result.error?.message).toContain('too long')
    })

    it('should validate UUID format strictly', async () => {
      // Arrange
      const invalidUUIDs = [
        '123',
        '123e4567-e89b-12d3-a456',
        '123e4567-e89b-12d3-a456-426614174000-extra',
        'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        '123e4567_e89b_12d3_a456_426614174000',
        ''
      ]

      const pollId = '1'
      const optionId = 'js'

      // Act & Assert
      for (const invalidUUID of invalidUUIDs) {
        const result = await PollService.submitVote(pollId, optionId, invalidUUID)
        
        expect(result.success).toBe(false)
        expect(result.error?.code).toBe('VALIDATION_ERROR')
        expect(result.error?.message).toContain('User ID must be a valid UUID')
      }
    })
  })

  describe('Performance and Load Testing', () => {
    it('should handle high-volume vote submissions', async () => {
      // Arrange
      const pollId = '1'
      const optionId = 'js'
      const numberOfVotes = 100
      
      const votes = Array(numberOfVotes).fill(null).map((_, index) => ({
        pollId,
        optionId,
        userId: `123e4567-e89b-12d3-a456-4266141740${index.toString().padStart(2, '0')}`
      }))

      // Act
      const startTime = Date.now()
      const results = await Promise.all(
        votes.map(vote => PollService.submitVote(vote.pollId, vote.optionId, vote.userId))
      )
      const endTime = Date.now()

      // Assert
      const successfulVotes = results.filter(result => result.success)
      const averageTimePerVote = (endTime - startTime) / numberOfVotes

      expect(successfulVotes).toHaveLength(numberOfVotes)
      expect(averageTimePerVote).toBeLessThan(100) // Should be under 100ms per vote
      
      console.log(`Processed ${numberOfVotes} votes in ${endTime - startTime}ms (avg: ${averageTimePerVote.toFixed(2)}ms per vote)`)
    })

    it('should maintain response time consistency under load', async () => {
      // Arrange
      const pollId = '1'
      const optionId = 'js'
      const userId = '123e4567-e89b-12d3-a456-426614174000'
      const iterations = 10

      // Act
      const responseTimes: number[] = []
      
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now()
        await PollService.submitVote(pollId, optionId, userId)
        const endTime = Date.now()
        responseTimes.push(endTime - startTime)
      }

      // Assert
      const averageTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      const maxTime = Math.max(...responseTimes)
      const minTime = Math.min(...responseTimes)
      const variance = maxTime - minTime

      expect(averageTime).toBeLessThan(200) // Average should be under 200ms
      expect(variance).toBeLessThan(100) // Variance should be under 100ms
      
      console.log(`Response time stats: avg=${averageTime.toFixed(2)}ms, min=${minTime}ms, max=${maxTime}ms, variance=${variance}ms`)
    })
  })
})