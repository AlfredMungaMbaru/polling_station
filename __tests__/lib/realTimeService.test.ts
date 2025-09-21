/**
 * Real-time Service Tests
 * 
 * Comprehensive tests for the RealTimeService including:
 * - Connection management and lifecycle
 * - Event handling and broadcasting
 * - Error scenarios and recovery
 * - Performance under load
 * - Data consistency and synchronization
 */

import { RealTimeService, createPollUpdateEvent, formatLiveResults } from '../../src/lib/realTimeService'
import type { PollUpdateEvent, LivePollResults, ConnectionStatus } from '../../src/lib/realTimeService'

// Mock EventSource for testing
class MockEventSource {
  public readyState: number = 1
  public onopen: ((event: Event) => void) | null = null
  public onmessage: ((event: MessageEvent) => void) | null = null
  public onerror: ((event: Event) => void) | null = null
  private listeners: Map<string, ((event: any) => void)[]> = new Map()

  constructor(public url: string) {
    // Simulate connection opening
    setTimeout(() => {
      if (this.onopen) {
        this.onopen(new Event('open'))
      }
    }, 100)
  }

  addEventListener(type: string, handler: (event: any) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, [])
    }
    this.listeners.get(type)!.push(handler)
  }

  removeEventListener(type: string, handler: (event: any) => void) {
    const handlers = this.listeners.get(type)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  close() {
    this.readyState = 2 // CLOSED
  }

  // Test helper to simulate incoming messages
  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }))
    }
  }

  // Test helper to simulate errors
  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'))
    }
  }
}

// Mock global EventSource
Object.defineProperty(global, 'EventSource', {
  value: MockEventSource,
  writable: true
})

describe('RealTimeService', () => {
  let realTimeService: RealTimeService

  beforeEach(() => {
    // Get fresh instance for each test
    realTimeService = RealTimeService.getInstance()
    realTimeService.cleanup() // Clean up any previous state
    
    // Clear all event listeners
    realTimeService.removeAllListeners()
  })

  afterEach(() => {
    realTimeService.cleanup()
  })

  describe('Connection Management', () => {
    it('should successfully subscribe to poll updates', async () => {
      // Arrange
      const config = {
        pollId: 'test-poll-1',
        userId: 'test-user-1',
        reconnectInterval: 1000,
        maxReconnectAttempts: 3
      }

      // Act
      const status = await realTimeService.subscribeToPoll(config)

      // Assert
      expect(status).toBeDefined()
      expect(status.connectionId).toContain('test-poll-1_test-user-1')
      expect(status.reconnectAttempts).toBe(0)
    })

    it('should handle subscription without user ID', async () => {
      // Arrange
      const config = {
        pollId: 'test-poll-2',
        reconnectInterval: 1000
      }

      // Act
      const status = await realTimeService.subscribeToPoll(config)

      // Assert
      expect(status).toBeDefined()
      expect(status.connectionId).toContain('test-poll-2_anonymous')
    })

    it('should unsubscribe from poll updates', async () => {
      // Arrange
      const config = {
        pollId: 'test-poll-3',
        userId: 'test-user-3'
      }

      await realTimeService.subscribeToPoll(config)
      expect(realTimeService.hasActiveSubscribers('test-poll-3')).toBe(true)

      // Act
      await realTimeService.unsubscribeFromPoll('test-poll-3', 'test-user-3')

      // Assert
      expect(realTimeService.hasActiveSubscribers('test-poll-3')).toBe(false)
    })

    it('should close existing connections when resubscribing', async () => {
      // Arrange
      const config = {
        pollId: 'test-poll-4',
        userId: 'test-user-4'
      }

      // Subscribe first time
      await realTimeService.subscribeToPoll(config)
      const firstConnections = realTimeService.getConnectionStatuses().size

      // Act - Subscribe again
      await realTimeService.subscribeToPoll(config)
      const secondConnections = realTimeService.getConnectionStatuses().size

      // Assert - Should not have duplicate connections
      expect(secondConnections).toBe(firstConnections)
    })
  })

  describe('Event Handling', () => {
    it('should broadcast poll updates to subscribers', async () => {
      // Arrange
      const pollUpdateEvent: PollUpdateEvent = {
        pollId: 'test-poll-5',
        optionId: 'option-1',
        newVoteCount: 10,
        totalVotes: 25,
        timestamp: new Date().toISOString(),
        eventType: 'vote_added'
      }

      let receivedEvent: PollUpdateEvent | null = null
      realTimeService.on('pollUpdate', (event: PollUpdateEvent) => {
        receivedEvent = event
      })

      // Act
      await realTimeService.broadcastPollUpdate(pollUpdateEvent)

      // Assert
      expect(receivedEvent).toEqual(pollUpdateEvent)
    })

    it('should update poll data when broadcasting updates', async () => {
      // Arrange
      const pollId = 'test-poll-6'
      const updateEvent: PollUpdateEvent = {
        pollId,
        optionId: 'option-1',
        newVoteCount: 15,
        totalVotes: 30,
        timestamp: new Date().toISOString(),
        eventType: 'vote_added'
      }

      // Act
      await realTimeService.broadcastPollUpdate(updateEvent)
      const pollResults = realTimeService.getLivePollResults(pollId)

      // Assert
      expect(pollResults).toBeDefined()
      expect(pollResults?.pollId).toBe(pollId)
      expect(pollResults?.totalVotes).toBe(30)
      expect(pollResults?.lastUpdated).toBe(updateEvent.timestamp)
    })

    it('should handle poll ended events', async () => {
      // Arrange
      const pollId = 'test-poll-7'
      const endedEvent: PollUpdateEvent = {
        pollId,
        optionId: 'option-1',
        newVoteCount: 20,
        totalVotes: 50,
        timestamp: new Date().toISOString(),
        eventType: 'poll_ended'
      }

      // Act
      await realTimeService.broadcastPollUpdate(endedEvent)
      const pollResults = realTimeService.getLivePollResults(pollId)

      // Assert
      expect(pollResults?.isActive).toBe(false)
    })
  })

  describe('Connection Status Monitoring', () => {
    it('should track connection status correctly', async () => {
      // Arrange
      const config = {
        pollId: 'test-poll-8',
        userId: 'test-user-8'
      }

      // Act
      const status = await realTimeService.subscribeToPoll(config)
      const allStatuses = realTimeService.getConnectionStatuses()

      // Assert
      expect(allStatuses.has(status.connectionId)).toBe(true)
      expect(allStatuses.get(status.connectionId)?.connectionId).toBe(status.connectionId)
    })

    it('should detect active subscribers', async () => {
      // Arrange
      const config1 = { pollId: 'test-poll-9', userId: 'user-1' }
      const config2 = { pollId: 'test-poll-9', userId: 'user-2' }

      // Act
      await realTimeService.subscribeToPoll(config1)
      await realTimeService.subscribeToPoll(config2)

      // Assert
      expect(realTimeService.hasActiveSubscribers('test-poll-9')).toBe(true)
      expect(realTimeService.hasActiveSubscribers('non-existent-poll')).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle subscription errors gracefully', async () => {
      // Arrange
      const config = {
        pollId: '', // Invalid poll ID
        userId: 'test-user'
      }

      // Act & Assert
      await expect(realTimeService.subscribeToPoll(config)).rejects.toThrow()
    })

    it('should handle broadcast errors gracefully', async () => {
      // Arrange
      const invalidEvent = {
        pollId: 'test-poll',
        optionId: 'option-1',
        newVoteCount: -1, // Invalid vote count
        totalVotes: 0,
        timestamp: new Date().toISOString(),
        eventType: 'vote_added'
      } as PollUpdateEvent

      // Act & Assert - Should not throw
      await expect(realTimeService.broadcastPollUpdate(invalidEvent)).resolves.not.toThrow()
    })
  })

  describe('Data Management', () => {
    it('should return null for non-existent poll results', () => {
      // Act
      const results = realTimeService.getLivePollResults('non-existent-poll')

      // Assert
      expect(results).toBeNull()
    })

    it('should maintain data consistency across updates', async () => {
      // Arrange
      const pollId = 'consistency-test-poll'
      const events: PollUpdateEvent[] = [
        {
          pollId,
          optionId: 'option-1',
          newVoteCount: 5,
          totalVotes: 5,
          timestamp: new Date().toISOString(),
          eventType: 'vote_added'
        },
        {
          pollId,
          optionId: 'option-2',
          newVoteCount: 3,
          totalVotes: 8,
          timestamp: new Date().toISOString(),
          eventType: 'vote_added'
        }
      ]

      // Act
      for (const event of events) {
        await realTimeService.broadcastPollUpdate(event)
      }

      const results = realTimeService.getLivePollResults(pollId)

      // Assert
      expect(results?.totalVotes).toBe(8)
      expect(results?.pollId).toBe(pollId)
    })
  })

  describe('Cleanup and Resource Management', () => {
    it('should cleanup all resources properly', async () => {
      // Arrange
      const configs = [
        { pollId: 'cleanup-poll-1', userId: 'user-1' },
        { pollId: 'cleanup-poll-2', userId: 'user-2' }
      ]

      for (const config of configs) {
        await realTimeService.subscribeToPoll(config)
      }

      expect(realTimeService.getConnectionStatuses().size).toBeGreaterThan(0)

      // Act
      realTimeService.cleanup()

      // Assert
      expect(realTimeService.getConnectionStatuses().size).toBe(0)
      expect(realTimeService.getLivePollResults('cleanup-poll-1')).toBeNull()
      expect(realTimeService.getLivePollResults('cleanup-poll-2')).toBeNull()
    })
  })

  describe('Performance and Load Testing', () => {
    it('should handle multiple concurrent subscriptions', async () => {
      // Arrange
      const subscriptionPromises = []
      for (let i = 0; i < 50; i++) {
        subscriptionPromises.push(
          realTimeService.subscribeToPoll({
            pollId: `load-test-poll-${i}`,
            userId: `load-test-user-${i}`
          })
        )
      }

      // Act
      const results = await Promise.all(subscriptionPromises)

      // Assert
      expect(results).toHaveLength(50)
      results.forEach(result => {
        expect(result.connectionId).toBeDefined()
        expect(result.reconnectAttempts).toBe(0)
      })
    })

    it('should handle rapid poll updates efficiently', async () => {
      // Arrange
      const pollId = 'rapid-updates-poll'
      const updatePromises = []
      
      for (let i = 0; i < 100; i++) {
        updatePromises.push(
          realTimeService.broadcastPollUpdate({
            pollId,
            optionId: `option-${i % 3}`,
            newVoteCount: i,
            totalVotes: i * 2,
            timestamp: new Date().toISOString(),
            eventType: 'vote_added'
          })
        )
      }

      const startTime = Date.now()

      // Act
      await Promise.all(updatePromises)

      const endTime = Date.now()
      const totalTime = endTime - startTime

      // Assert
      expect(totalTime).toBeLessThan(5000) // Should complete within 5 seconds
      const finalResults = realTimeService.getLivePollResults(pollId)
      expect(finalResults).toBeDefined()
    })
  })
})

describe('Utility Functions', () => {
  describe('createPollUpdateEvent', () => {
    it('should create valid poll update event', () => {
      // Act
      const event = createPollUpdateEvent('poll-1', 'option-1', 10, 25, 'vote_added')

      // Assert
      expect(event.pollId).toBe('poll-1')
      expect(event.optionId).toBe('option-1')
      expect(event.newVoteCount).toBe(10)
      expect(event.totalVotes).toBe(25)
      expect(event.eventType).toBe('vote_added')
      expect(event.timestamp).toBeDefined()
    })

    it('should default to vote_added event type', () => {
      // Act
      const event = createPollUpdateEvent('poll-1', 'option-1', 5, 10)

      // Assert
      expect(event.eventType).toBe('vote_added')
    })
  })

  describe('formatLiveResults', () => {
    it('should format live results correctly', () => {
      // Arrange
      const liveResults: LivePollResults = {
        pollId: 'format-test-poll',
        options: [
          {
            id: 'option-1',
            label: 'Option 1',
            votes: 15,
            percentage: 60,
            trend: 'up',
            recentVotes: 3
          },
          {
            id: 'option-2',
            label: 'Option 2',
            votes: 10,
            percentage: 40,
            trend: 'down',
            recentVotes: 0
          }
        ],
        totalVotes: 25,
        lastUpdated: new Date().toISOString(),
        isActive: true
      }

      // Act
      const formatted = formatLiveResults(liveResults)

      // Assert
      expect(formatted).toContain('Poll: format-test-poll')
      expect(formatted).toContain('Total Votes: 25')
      expect(formatted).toContain('Status: Active')
      expect(formatted).toContain('📈 Option 1: 15 votes (60%) (+3 recent)')
      expect(formatted).toContain('📉 Option 2: 10 votes (40%)')
    })

    it('should handle inactive polls', () => {
      // Arrange
      const inactiveResults: LivePollResults = {
        pollId: 'inactive-poll',
        options: [],
        totalVotes: 0,
        lastUpdated: new Date().toISOString(),
        isActive: false
      }

      // Act
      const formatted = formatLiveResults(inactiveResults)

      // Assert
      expect(formatted).toContain('Status: Ended')
    })
  })
})