/**
 * Performance Tests for RealTimeService
 * 
 * These tests specifically focus on performance optimization features:
 * - Update throttling
 * - Batch processing
 * - Connection optimization
 * - Memory management
 * - Resource cleanup
 */

import { 
  RealTimeService, 
  createPollUpdateEvent,
  SSEConnectionConfig,
  PollUpdateEvent 
} from '@/lib/realTimeService'

describe('RealTimeService Performance Optimizations', () => {
  let realTimeService: RealTimeService

  beforeEach(() => {
    realTimeService = RealTimeService.getInstance()
    realTimeService.cleanup() // Start fresh
  })

  afterEach(() => {
    realTimeService.cleanup()
  })

  describe('Update Throttling', () => {
    it('should throttle rapid updates using broadcastPollUpdateThrottled', async () => {
      const pollId = 'throttle-test-poll'
      const updates: PollUpdateEvent[] = []
      
      // Listen for updates
      realTimeService.on('pollUpdate', (event: PollUpdateEvent) => {
        updates.push(event)
      })

      // Send rapid updates
      const rapidUpdates = Array.from({ length: 20 }, (_, i) => 
        createPollUpdateEvent(pollId, 'option-1', i + 1, (i + 1) * 2)
      )

      // Use throttled broadcasting
      const promises = rapidUpdates.map(update => 
        realTimeService.broadcastPollUpdateThrottled(update)
      )
      await Promise.all(promises)

      // Wait for throttle to process
      await new Promise(resolve => setTimeout(resolve, 200))

      // Should have fewer updates than sent due to throttling/batching
      expect(updates.length).toBeLessThan(rapidUpdates.length)
      expect(updates.length).toBeGreaterThan(0)

      // Latest update should reflect a high state (may not be final due to batching)
      const lastUpdate = updates[updates.length - 1]
      expect(lastUpdate.newVoteCount).toBeGreaterThan(5)
    })

    it('should consolidate multiple updates for the same option', async () => {
      const pollId = 'consolidation-test-poll'
      const updates: PollUpdateEvent[] = []
      
      realTimeService.on('pollUpdate', (event: PollUpdateEvent) => {
        updates.push(event)
      })

      // Send multiple updates for same option rapidly
      for (let i = 1; i <= 10; i++) {
        await realTimeService.broadcastPollUpdateThrottled(
          createPollUpdateEvent(pollId, 'option-1', i, i * 2)
        )
      }

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 200))

      // Should have consolidated to fewer updates
      const option1Updates = updates.filter(u => u.optionId === 'option-1')
      expect(option1Updates.length).toBeLessThanOrEqual(3) // Should be batched
      
      // Final state should be correct
      const finalUpdate = option1Updates[option1Updates.length - 1]
      expect(finalUpdate.newVoteCount).toBe(10)
    })

    it('should handle mixed updates for different options', async () => {
      const pollId = 'mixed-options-poll'
      const updates: PollUpdateEvent[] = []
      
      realTimeService.on('pollUpdate', (event: PollUpdateEvent) => {
        updates.push(event)
      })

      // Send mixed updates
      for (let i = 1; i <= 15; i++) {
        const optionId = i % 3 === 0 ? 'option-3' : i % 2 === 0 ? 'option-2' : 'option-1'
        await realTimeService.broadcastPollUpdateThrottled(
          createPollUpdateEvent(pollId, optionId, i, i * 2)
        )
      }

      await new Promise(resolve => setTimeout(resolve, 200))

      // Should have updates for all three options
      const option1Updates = updates.filter(u => u.optionId === 'option-1')
      const option2Updates = updates.filter(u => u.optionId === 'option-2')
      const option3Updates = updates.filter(u => u.optionId === 'option-3')

      expect(option1Updates.length).toBeGreaterThan(0)
      expect(option2Updates.length).toBeGreaterThan(0)
      expect(option3Updates.length).toBeGreaterThan(0)
    })

    it('should respect custom throttle intervals', async () => {
      const pollId = 'custom-throttle-poll'
      const updates: PollUpdateEvent[] = []
      
      // Set custom throttle interval
      realTimeService.setThrottleInterval(50) // 50ms
      
      realTimeService.on('pollUpdate', (event: PollUpdateEvent) => {
        updates.push(event)
      })

      const startTime = Date.now()

      // Send 5 rapid updates
      for (let i = 1; i <= 5; i++) {
        await realTimeService.broadcastPollUpdateThrottled(
          createPollUpdateEvent(pollId, 'option-1', i, i * 2)
        )
      }

      await new Promise(resolve => setTimeout(resolve, 100))
      const endTime = Date.now()

      // Should complete within reasonable time with faster throttling
      expect(endTime - startTime).toBeLessThan(150) // Should be faster than default
      expect(updates.length).toBeGreaterThan(0)
    })
  })

  describe('Connection Optimization', () => {
    it('should track performance metrics accurately', async () => {
      // Create some connections
      const configs: SSEConnectionConfig[] = [
        { pollId: 'metrics-poll-1', userId: 'user-1' },
        { pollId: 'metrics-poll-1', userId: 'user-2' },
        { pollId: 'metrics-poll-2', userId: 'user-3' }
      ]

      for (const config of configs) {
        await realTimeService.subscribeToPoll(config)
      }

      const metrics = realTimeService.getPerformanceMetrics()

      expect(metrics.totalConnections).toBe(3)
      expect(metrics.totalPolls).toBeGreaterThanOrEqual(0)
      expect(metrics.activePolls).toBe(2) // Two different polls
      expect(metrics.memoryUsage.connections).toBe(3)
      expect(metrics.timestamp).toBeTruthy()
    })

    it('should optimize connections by removing stale ones', async () => {
      // Create connections
      const config1 = { pollId: 'stale-test-1', userId: 'user-1' }
      const config2 = { pollId: 'stale-test-2', userId: 'user-2' }
      
      await realTimeService.subscribeToPoll(config1)
      await realTimeService.subscribeToPoll(config2)

      let metrics = realTimeService.getPerformanceMetrics()
      expect(metrics.totalConnections).toBe(2)

      // Simulate stale connections (very short idle time for testing)
      realTimeService.optimizeConnections(1) // 1ms idle time

      await new Promise(resolve => setTimeout(resolve, 50)) // Wait longer for cleanup

      metrics = realTimeService.getPerformanceMetrics()
      expect(metrics.totalConnections).toBeLessThanOrEqual(1) // Should remove most/all stale connections
    })

    it('should allow custom batch size configuration', () => {
      // Test setting valid batch size
      expect(() => realTimeService.setMaxBatchSize(5)).not.toThrow()
      
      // Test invalid batch sizes
      expect(() => realTimeService.setMaxBatchSize(0)).toThrow()
      expect(() => realTimeService.setMaxBatchSize(101)).toThrow()
    })

    it('should clear pending updates for specific polls', async () => {
      const pollId = 'clear-test-poll'
      
      // Add some pending updates
      for (let i = 1; i <= 5; i++) {
        await realTimeService.broadcastPollUpdateThrottled(
          createPollUpdateEvent(pollId, 'option-1', i, i * 2)
        )
      }

      let metrics = realTimeService.getPerformanceMetrics()
      expect(metrics.totalPendingUpdates).toBeGreaterThan(0)

      // Clear pending updates
      realTimeService.clearPendingUpdates(pollId)

      metrics = realTimeService.getPerformanceMetrics()
      expect(metrics.totalPendingUpdates).toBe(0)
    })

    it('should flush all pending updates immediately', async () => {
      const updates: PollUpdateEvent[] = []
      
      realTimeService.on('pollUpdate', (event: PollUpdateEvent) => {
        updates.push(event)
      })

      // Add pending updates for multiple polls
      for (let pollNum = 1; pollNum <= 3; pollNum++) {
        for (let i = 1; i <= 3; i++) {
          await realTimeService.broadcastPollUpdateThrottled(
            createPollUpdateEvent(`flush-poll-${pollNum}`, 'option-1', i, i * 2)
          )
        }
      }

      let metrics = realTimeService.getPerformanceMetrics()
      expect(metrics.totalPendingUpdates).toBeGreaterThan(0)

      // Flush all pending updates
      await realTimeService.flushAllPendingUpdates()

      // Should have processed updates
      expect(updates.length).toBeGreaterThan(0)
      
      metrics = realTimeService.getPerformanceMetrics()
      expect(metrics.totalPendingUpdates).toBe(0)
    })
  })

  describe('Memory Management', () => {
    it('should prevent memory leaks with large update queues', async () => {
      const pollId = 'memory-test-poll'
      
      // Send more updates than the queue limit
      for (let i = 1; i <= 100; i++) {
        await realTimeService.broadcastPollUpdateThrottled(
          createPollUpdateEvent(pollId, 'option-1', i, i * 2)
        )
      }

      const metrics = realTimeService.getPerformanceMetrics()
      
      // Should limit pending updates to prevent memory issues
      expect(metrics.totalPendingUpdates).toBeLessThanOrEqual(50) // UPDATE_QUEUE_SIZE
    })

    it('should clean up all resources properly', async () => {
      // Create various resources
      await realTimeService.subscribeToPoll({ pollId: 'cleanup-poll-1', userId: 'user-1' })
      await realTimeService.subscribeToPoll({ pollId: 'cleanup-poll-2', userId: 'user-2' })
      
      for (let i = 1; i <= 5; i++) {
        await realTimeService.broadcastPollUpdateThrottled(
          createPollUpdateEvent('cleanup-poll-1', 'option-1', i, i * 2)
        )
      }

      let metrics = realTimeService.getPerformanceMetrics()
      expect(metrics.totalConnections).toBeGreaterThan(0)
      expect(metrics.totalPendingUpdates).toBeGreaterThan(0)

      // Cleanup
      realTimeService.cleanup()

      metrics = realTimeService.getPerformanceMetrics()
      expect(metrics.totalConnections).toBe(0)
      expect(metrics.totalPendingUpdates).toBe(0)
      expect(metrics.memoryUsage.connections).toBe(0)
      expect(metrics.memoryUsage.heartbeats).toBe(0)
      expect(metrics.memoryUsage.throttles).toBe(0)
    })
  })

  describe('Load Testing', () => {
    it('should handle high-frequency updates efficiently', async () => {
      const pollId = 'load-test-poll'
      const startTime = Date.now()
      
      // Simulate high load - 100 rapid updates
      const promises = Array.from({ length: 100 }, (_, i) =>
        realTimeService.broadcastPollUpdateThrottled(
          createPollUpdateEvent(pollId, `option-${i % 5}`, i + 1, (i + 1) * 2)
        )
      )

      await Promise.all(promises)
      await new Promise(resolve => setTimeout(resolve, 500)) // Wait longer for processing

      const endTime = Date.now()
      const duration = endTime - startTime

      // Should complete reasonably quickly
      expect(duration).toBeLessThan(2000) // Less than 2 seconds
      
      const metrics = realTimeService.getPerformanceMetrics()
      expect(metrics.totalPendingUpdates).toBeLessThanOrEqual(25) // May have some pending due to queue limits
    })

    it('should maintain performance with multiple concurrent polls', async () => {
      const pollCount = 10
      const updatesPerPoll = 20
      const startTime = Date.now()

      // Create updates for multiple polls concurrently
      const allPromises = []
      for (let pollNum = 1; pollNum <= pollCount; pollNum++) {
        for (let updateNum = 1; updateNum <= updatesPerPoll; updateNum++) {
          allPromises.push(
            realTimeService.broadcastPollUpdateThrottled(
              createPollUpdateEvent(
                `concurrent-poll-${pollNum}`, 
                `option-${updateNum % 3}`, 
                updateNum, 
                updateNum * 2
              )
            )
          )
        }
      }

      await Promise.all(allPromises)
      await new Promise(resolve => setTimeout(resolve, 500)) // Wait for processing

      const endTime = Date.now()
      const duration = endTime - startTime

      // Should handle concurrent load efficiently
      expect(duration).toBeLessThan(2000) // Less than 2 seconds
      
      const metrics = realTimeService.getPerformanceMetrics()
      expect(metrics.totalPendingUpdates).toBe(0) // All should be processed
    })
  })
})