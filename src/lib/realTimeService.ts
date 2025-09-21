/**
 * Real-time Poll Results Service
 * 
 * Provides real-time updates for poll results using Server-Sent Events (SSE).
 * Handles live vote counting, result broadcasting, and connection management
 * for a seamless real-time polling experience.
 * 
 * @module RealTimeService
 * @version 1.0.0
 */

import { EventEmitter } from 'events'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Real-time poll update event data
 */
export interface PollUpdateEvent {
  pollId: string
  optionId: string
  newVoteCount: number
  totalVotes: number
  timestamp: string
  eventType: 'vote_added' | 'vote_removed' | 'poll_updated' | 'poll_ended'
}

/**
 * Live poll results structure
 */
export interface LivePollResults {
  pollId: string
  options: LiveOptionResult[]
  totalVotes: number
  lastUpdated: string
  isActive: boolean
}

/**
 * Live option result with real-time data
 */
export interface LiveOptionResult {
  id: string
  label: string
  votes: number
  percentage: number
  trend: 'up' | 'down' | 'stable'
  recentVotes: number // Votes in last 30 seconds
}

/**
 * SSE connection configuration
 */
export interface SSEConnectionConfig {
  pollId: string
  userId?: string
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
}

/**
 * Real-time connection status
 */
export interface ConnectionStatus {
  isConnected: boolean
  connectionId: string
  lastHeartbeat: string
  reconnectAttempts: number
  error?: string
}

// ============================================================================
// REAL-TIME POLL RESULTS SERVICE
// ============================================================================

/**
 * Real-time service for managing live poll updates
 * 
 * Provides Server-Sent Events (SSE) for real-time poll result updates,
 * handles connection management, and ensures reliable data delivery.
 */
export class RealTimeService extends EventEmitter {
  private static instance: RealTimeService
  private connections = new Map<string, EventSource>()
  private pollData = new Map<string, LivePollResults>()
  private connectionStatus = new Map<string, ConnectionStatus>()
  private heartbeatIntervals = new Map<string, NodeJS.Timeout>()
  private pollConnections = new Map<string, Set<string>>() // pollId -> Set of connectionIds
  
  // Performance optimization properties
  private updateThrottles = new Map<string, NodeJS.Timeout>() // pollId -> throttle timeout
  private pendingUpdates = new Map<string, PollUpdateEvent[]>() // pollId -> pending updates
  private readonly THROTTLE_INTERVAL = 100 // ms - minimum time between updates
  private readonly MAX_BATCH_SIZE = 10 // maximum updates to batch together
  private readonly UPDATE_QUEUE_SIZE = 50 // maximum pending updates per poll

  private constructor() {
    super()
    this.setMaxListeners(100) // Allow many poll subscriptions
  }

  /**
   * Get singleton instance
   */
  static getInstance(): RealTimeService {
    if (!RealTimeService.instance) {
      RealTimeService.instance = new RealTimeService()
    }
    return RealTimeService.instance
  }

  /**
   * Subscribe to real-time updates for a specific poll
   * 
   * @param config - SSE connection configuration
   * @returns Promise<ConnectionStatus> - Connection status
   * 
   * @example
   * ```typescript
   * const service = RealTimeService.getInstance()
   * 
   * const status = await service.subscribeToPoll({
   *   pollId: 'poll-123',
   *   userId: 'user-456'
   * })
   * 
   * service.on('pollUpdate', (event: PollUpdateEvent) => {
   *   console.log('New vote:', event)
   * })
   * ```
   */
  async subscribeToPoll(config: SSEConnectionConfig): Promise<ConnectionStatus> {
    const { pollId, userId } = config
    
    // Validate pollId
    if (!pollId || pollId.trim() === '') {
      throw new Error('Poll ID is required and cannot be empty')
    }
    
    const connectionId = `${pollId}_${userId || 'anonymous'}_${Date.now()}`

    try {
      // Close existing connection if any
      await this.unsubscribeFromPoll(pollId, userId)

      // Create SSE connection
      const eventSource = this.createEventSource(pollId, connectionId)
      
      // Store connection
      this.connections.set(connectionId, eventSource)
      
      // Track poll connection
      if (!this.pollConnections.has(pollId)) {
        this.pollConnections.set(pollId, new Set())
      }
      this.pollConnections.get(pollId)!.add(connectionId)
      
      // Initialize connection status
      const status: ConnectionStatus = {
        isConnected: false,
        connectionId,
        lastHeartbeat: new Date().toISOString(),
        reconnectAttempts: 0
      }
      this.connectionStatus.set(connectionId, status)

      // Set up event handlers
      this.setupEventHandlers(eventSource, connectionId, config)

      // Start heartbeat monitoring
      this.startHeartbeat(connectionId, config.heartbeatInterval || 30000)

      return status

    } catch (error) {
      console.error('Error subscribing to poll:', error)
      throw new Error(`Failed to subscribe to poll ${pollId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Unsubscribe from real-time updates for a poll
   * 
   * @param pollId - ID of the poll
   * @param userId - Optional user ID for specific connection
   */
  async unsubscribeFromPoll(pollId: string, userId?: string): Promise<void> {
    const connectionPattern = userId ? `${pollId}_${userId}` : pollId

    for (const [connectionId, eventSource] of this.connections.entries()) {
      if (connectionId.startsWith(connectionPattern)) {
        // Close SSE connection
        eventSource.close()
        
        // Clear heartbeat
        const heartbeat = this.heartbeatIntervals.get(connectionId)
        if (heartbeat) {
          clearInterval(heartbeat)
          this.heartbeatIntervals.delete(connectionId)
        }
        
        // Clean up tracking
        this.connections.delete(connectionId)
        this.connectionStatus.delete(connectionId)
        
        // Remove from poll connections
        const pollConnections = this.pollConnections.get(pollId)
        if (pollConnections) {
          pollConnections.delete(connectionId)
          if (pollConnections.size === 0) {
            this.pollConnections.delete(pollId)
          }
        }
        
        console.log(`Unsubscribed from poll ${pollId} (connection: ${connectionId})`)
      }
    }
  }

  /**
   * Broadcast a poll update to all subscribers
   * 
   * @param event - Poll update event data
   */
  async broadcastPollUpdate(event: PollUpdateEvent): Promise<void> {
    try {
      // Update internal poll data
      await this.updatePollData(event)
      
      // Emit to local event listeners
      this.emit('pollUpdate', event)
      
      // In a real implementation, this would send to SSE server
      console.log('Broadcasting poll update:', event)
      
      // TODO: Send to actual SSE server endpoint
      // await this.sendToSSEServer('/api/polls/broadcast', event)

    } catch (error) {
      console.error('Error broadcasting poll update:', error)
    }
  }

  /**
   * Throttled poll update broadcasting with batching
   * 
   * @param event - Poll update event data
   */
  async broadcastPollUpdateThrottled(event: PollUpdateEvent): Promise<void> {
    const { pollId } = event

    // Add to pending updates queue
    if (!this.pendingUpdates.has(pollId)) {
      this.pendingUpdates.set(pollId, [])
    }
    
    const pending = this.pendingUpdates.get(pollId)!
    pending.push(event)

    // Limit queue size to prevent memory issues
    if (pending.length > this.UPDATE_QUEUE_SIZE) {
      pending.splice(0, pending.length - this.UPDATE_QUEUE_SIZE)
    }

    // Clear existing throttle
    const existingThrottle = this.updateThrottles.get(pollId)
    if (existingThrottle) {
      clearTimeout(existingThrottle)
    }

    // Set new throttle
    const throttleTimeout = setTimeout(() => {
      this.processPendingUpdates(pollId)
    }, this.THROTTLE_INTERVAL)

    this.updateThrottles.set(pollId, throttleTimeout)
  }

  /**
   * Process pending updates for a poll (batch processing)
   * 
   * @private
   * @param pollId - ID of the poll to process updates for
   */
  private async processPendingUpdates(pollId: string): Promise<void> {
    const pending = this.pendingUpdates.get(pollId)
    if (!pending || pending.length === 0) return

    try {
      // Take up to MAX_BATCH_SIZE updates
      const batchSize = Math.min(pending.length, this.MAX_BATCH_SIZE)
      const batch = pending.splice(0, batchSize)

      // Process batch - use the latest update for each option
      const consolidatedUpdates = this.consolidateUpdates(batch)

      // Broadcast consolidated updates
      for (const update of consolidatedUpdates) {
        await this.broadcastPollUpdate(update)
      }

      // Clear throttle
      this.updateThrottles.delete(pollId)

      // If more updates are pending, schedule another batch
      if (pending.length > 0) {
        const throttleTimeout = setTimeout(() => {
          this.processPendingUpdates(pollId)
        }, this.THROTTLE_INTERVAL)
        this.updateThrottles.set(pollId, throttleTimeout)
      }

    } catch (error) {
      console.error('Error processing pending updates:', error)
      this.updateThrottles.delete(pollId)
    }
  }

  /**
   * Consolidate multiple updates into the latest state per option
   * 
   * @private
   * @param updates - Array of poll update events
   * @returns PollUpdateEvent[] - Consolidated updates
   */
  private consolidateUpdates(updates: PollUpdateEvent[]): PollUpdateEvent[] {
    const latestByOption = new Map<string, PollUpdateEvent>()

    // Keep only the latest update for each option
    for (const update of updates) {
      const key = `${update.pollId}-${update.optionId}`
      latestByOption.set(key, update)
    }

    return Array.from(latestByOption.values())
  }

  /**
   * Get current live results for a poll
   * 
   * @param pollId - ID of the poll
   * @returns LivePollResults | null - Current poll results or null if not found
   */
  getLivePollResults(pollId: string): LivePollResults | null {
    return this.pollData.get(pollId) || null
  }

  /**
   * Get connection status for all active connections
   * 
   * @returns Map<string, ConnectionStatus> - All connection statuses
   */
  getConnectionStatuses(): Map<string, ConnectionStatus> {
    return new Map(this.connectionStatus)
  }

  /**
   * Check if a poll has active real-time subscribers
   * 
   * @param pollId - ID of the poll
   * @returns boolean - True if poll has subscribers
   */
  hasActiveSubscribers(pollId: string): boolean {
    return (
      this.pollConnections.has(pollId) &&
      this.pollConnections.get(pollId)!.size > 0
    )
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Create EventSource for SSE connection
   * 
   * @private
   */
  private createEventSource(pollId: string, connectionId: string): EventSource {
    // In a real implementation, this would connect to your SSE endpoint
    const sseUrl = `/api/polls/${pollId}/stream?connectionId=${connectionId}`
    
    // Mock EventSource for development
    const mockEventSource = {
      readyState: 1, // OPEN
      close: () => {
        console.log(`SSE connection closed: ${connectionId}`)
      },
      addEventListener: (type: string, handler: (event: MessageEvent) => void) => {
        console.log(`SSE event listener added: ${type} for ${connectionId}`)
      },
      onopen: null,
      onmessage: null,
      onerror: null
    } as EventSource

    console.log(`Mock SSE connection created for poll ${pollId}:`, sseUrl)
    return mockEventSource
  }

  /**
   * Set up event handlers for SSE connection
   * 
   * @private
   */
  private setupEventHandlers(
    eventSource: EventSource, 
    connectionId: string, 
    config: SSEConnectionConfig
  ): void {
    const status = this.connectionStatus.get(connectionId)
    if (!status) return

    // Connection opened
    eventSource.onopen = () => {
      status.isConnected = true
      status.reconnectAttempts = 0
      status.lastHeartbeat = new Date().toISOString()
      
      console.log(`SSE connection opened: ${connectionId}`)
      this.emit('connectionStatus', { connectionId, status: 'connected' })
    }

    // Message received
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.type === 'heartbeat') {
          status.lastHeartbeat = new Date().toISOString()
          return
        }

        if (data.type === 'pollUpdate') {
          this.handlePollUpdate(data.payload as PollUpdateEvent)
        }

      } catch (error) {
        console.error('Error parsing SSE message:', error)
      }
    }

    // Connection error
    eventSource.onerror = (error) => {
      status.isConnected = false
      status.error = 'Connection error'
      
      console.error(`SSE connection error for ${connectionId}:`, error)
      this.emit('connectionStatus', { connectionId, status: 'error', error })

      // Attempt reconnection
      this.attemptReconnection(connectionId, config)
    }
  }

  /**
   * Handle incoming poll update
   * 
   * @private
   */
  private handlePollUpdate(event: PollUpdateEvent): void {
    // Update local poll data
    this.updatePollData(event)
    
    // Emit to application listeners
    this.emit('pollUpdate', event)
    
    console.log('Received poll update:', event)
  }

  /**
   * Update internal poll data cache
   * 
   * @private
   */
  private async updatePollData(event: PollUpdateEvent): Promise<void> {
    let pollResults = this.pollData.get(event.pollId)
    
    if (!pollResults) {
      // Initialize new poll data
      pollResults = {
        pollId: event.pollId,
        options: [],
        totalVotes: 0,
        lastUpdated: event.timestamp,
        isActive: true
      }
    }

    // Update option data
    const option = pollResults.options.find(opt => opt.id === event.optionId)
    if (option) {
      const previousVotes = option.votes
      option.votes = event.newVoteCount
      option.recentVotes = Math.max(0, option.votes - previousVotes)
      
      // Determine trend
      if (option.votes > previousVotes) {
        option.trend = 'up'
      } else if (option.votes < previousVotes) {
        option.trend = 'down'
      } else {
        option.trend = 'stable'
      }
    }

    // Update totals and percentages
    pollResults.totalVotes = event.totalVotes
    pollResults.lastUpdated = event.timestamp
    
    // Recalculate percentages
    pollResults.options.forEach(opt => {
      opt.percentage = pollResults!.totalVotes > 0 
        ? Math.round((opt.votes / pollResults!.totalVotes) * 100) 
        : 0
    })

    // Handle poll ended event
    if (event.eventType === 'poll_ended') {
      pollResults.isActive = false
    }

    this.pollData.set(event.pollId, pollResults)
  }

  /**
   * Start heartbeat monitoring for connection
   * 
   * @private
   */
  private startHeartbeat(connectionId: string, interval: number): void {
    const heartbeat = setInterval(() => {
      const status = this.connectionStatus.get(connectionId)
      if (!status || !status.isConnected) {
        clearInterval(heartbeat)
        return
      }

      // Check if heartbeat is stale
      const lastHeartbeat = new Date(status.lastHeartbeat)
      const now = new Date()
      const timeSinceHeartbeat = now.getTime() - lastHeartbeat.getTime()

      if (timeSinceHeartbeat > interval * 2) {
        console.warn(`Stale heartbeat for connection ${connectionId}`)
        status.isConnected = false
        status.error = 'Heartbeat timeout'
        this.emit('connectionStatus', { connectionId, status: 'timeout' })
      }

    }, interval)

    this.heartbeatIntervals.set(connectionId, heartbeat)
  }

  /**
   * Attempt to reconnect a failed connection
   * 
   * @private
   */
  private attemptReconnection(connectionId: string, config: SSEConnectionConfig): void {
    const status = this.connectionStatus.get(connectionId)
    if (!status) return

    status.reconnectAttempts += 1

    if (status.reconnectAttempts <= (config.maxReconnectAttempts || 5)) {
      const delay = Math.min(1000 * Math.pow(2, status.reconnectAttempts), 30000)
      
      console.log(`Attempting reconnection ${status.reconnectAttempts} for ${connectionId} in ${delay}ms`)
      
      setTimeout(() => {
        this.subscribeToPoll(config).catch(error => {
          console.error('Reconnection failed:', error)
        })
      }, delay)
    } else {
      console.error(`Max reconnection attempts reached for ${connectionId}`)
      this.emit('connectionStatus', { connectionId, status: 'failed' })
    }
  }

  // ============================================================================
  // PERFORMANCE OPTIMIZATION METHODS
  // ============================================================================

  /**
   * Get performance metrics for the real-time system
   * 
   * @returns Performance metrics object
   */
  getPerformanceMetrics() {
    const totalConnections = this.connections.size
    const totalPolls = this.pollData.size
    const activePolls = Array.from(this.pollConnections.keys()).filter(pollId => 
      this.pollConnections.get(pollId)!.size > 0
    ).length
    
    const totalPendingUpdates = Array.from(this.pendingUpdates.values())
      .reduce((sum, updates) => sum + updates.length, 0)
    
    const memoryUsage = {
      connections: totalConnections,
      pollData: this.pollData.size,
      connectionStatus: this.connectionStatus.size,
      heartbeats: this.heartbeatIntervals.size,
      pendingUpdates: totalPendingUpdates,
      throttles: this.updateThrottles.size
    }

    return {
      totalConnections,
      totalPolls,
      activePolls,
      totalPendingUpdates,
      memoryUsage,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Optimize connections by removing stale ones
   * 
   * @param maxIdleTime - Maximum idle time in milliseconds (default: 5 minutes)
   */
  optimizeConnections(maxIdleTime: number = 300000): void {
    const now = Date.now()
    const staleConnections: string[] = []

    // Find stale connections
    for (const [connectionId, status] of this.connectionStatus.entries()) {
      const lastHeartbeat = new Date(status.lastHeartbeat).getTime()
      if (now - lastHeartbeat > maxIdleTime) {
        staleConnections.push(connectionId)
      }
    }

    // Remove stale connections
    for (const connectionId of staleConnections) {
      const eventSource = this.connections.get(connectionId)
      if (eventSource) {
        eventSource.close()
      }

      // Clean up all related data
      this.connections.delete(connectionId)
      this.connectionStatus.delete(connectionId)
      
      const heartbeat = this.heartbeatIntervals.get(connectionId)
      if (heartbeat) {
        clearInterval(heartbeat)
        this.heartbeatIntervals.delete(connectionId)
      }

      // Remove from poll connections
      for (const [pollId, connectionIds] of this.pollConnections.entries()) {
        connectionIds.delete(connectionId)
        if (connectionIds.size === 0) {
          this.pollConnections.delete(pollId)
        }
      }

      console.log(`Removed stale connection: ${connectionId}`)
    }

    console.log(`Connection optimization complete. Removed ${staleConnections.length} stale connections.`)
  }

  /**
   * Set throttle interval for updates (performance tuning)
   * 
   * @param interval - Throttle interval in milliseconds
   */
  setThrottleInterval(interval: number): void {
    if (interval < 10 || interval > 5000) {
      throw new Error('Throttle interval must be between 10ms and 5000ms')
    }
    
    // Type assertion to modify readonly property for configuration
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(this as any).THROTTLE_INTERVAL = interval
    console.log(`Throttle interval set to ${interval}ms`)
  }

  /**
   * Set maximum batch size for update processing
   * 
   * @param size - Maximum batch size
   */
  setMaxBatchSize(size: number): void {
    if (size < 1 || size > 100) {
      throw new Error('Batch size must be between 1 and 100')
    }
    
    // Type assertion to modify readonly property for configuration
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(this as any).MAX_BATCH_SIZE = size
    console.log(`Max batch size set to ${size}`)
  }

  /**
   * Clear pending updates for a specific poll (emergency cleanup)
   * 
   * @param pollId - ID of the poll to clear updates for
   */
  clearPendingUpdates(pollId: string): void {
    this.pendingUpdates.delete(pollId)
    
    const throttle = this.updateThrottles.get(pollId)
    if (throttle) {
      clearTimeout(throttle)
      this.updateThrottles.delete(pollId)
    }

    console.log(`Cleared pending updates for poll: ${pollId}`)
  }

  /**
   * Force process all pending updates immediately (emergency flush)
   */
  async flushAllPendingUpdates(): Promise<void> {
    const pollIds = Array.from(this.pendingUpdates.keys())
    
    // Clear all throttles
    for (const throttle of this.updateThrottles.values()) {
      clearTimeout(throttle)
    }
    this.updateThrottles.clear()

    // Process all pending updates
    const promises = pollIds.map(pollId => this.processPendingUpdates(pollId))
    await Promise.all(promises)

    console.log(`Flushed pending updates for ${pollIds.length} polls`)
  }

  /**
   * Cleanup all connections and intervals
   */
  public cleanup(): void {
    // Close all connections
    for (const eventSource of this.connections.values()) {
      eventSource.close()
    }

    // Clear all heartbeats
    for (const interval of this.heartbeatIntervals.values()) {
      clearInterval(interval)
    }

    // Clear all throttles
    for (const throttle of this.updateThrottles.values()) {
      clearTimeout(throttle)
    }

    // Clear all data
    this.connections.clear()
    this.connectionStatus.clear()
    this.heartbeatIntervals.clear()
    this.pollData.clear()
    this.pollConnections.clear()
    this.updateThrottles.clear()
    this.pendingUpdates.clear()

    console.log('RealTimeService cleaned up')
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a poll update event
 * 
 * @param pollId - ID of the poll
 * @param optionId - ID of the option that was voted for
 * @param newVoteCount - New vote count for the option
 * @param totalVotes - Total votes for the poll
 * @param eventType - Type of update event
 * @returns PollUpdateEvent - Formatted poll update event
 */
export function createPollUpdateEvent(
  pollId: string,
  optionId: string,
  newVoteCount: number,
  totalVotes: number,
  eventType: PollUpdateEvent['eventType'] = 'vote_added'
): PollUpdateEvent {
  return {
    pollId,
    optionId,
    newVoteCount,
    totalVotes,
    timestamp: new Date().toISOString(),
    eventType
  }
}

/**
 * Format live poll results for display
 * 
 * @param results - Live poll results
 * @returns Formatted results with trend indicators and recent activity
 */
export function formatLiveResults(results: LivePollResults): string {
  const lines = [
    `Poll: ${results.pollId}`,
    `Total Votes: ${results.totalVotes}`,
    `Last Updated: ${new Date(results.lastUpdated).toLocaleTimeString()}`,
    `Status: ${results.isActive ? 'Active' : 'Ended'}`,
    '',
    'Options:'
  ]

  results.options.forEach(option => {
    const trendIcon = option.trend === 'up' ? '📈' : option.trend === 'down' ? '📉' : '➡️'
    const recentActivity = option.recentVotes > 0 ? ` (+${option.recentVotes} recent)` : ''
    
    lines.push(
      `  ${trendIcon} ${option.label}: ${option.votes} votes (${option.percentage}%)${recentActivity}`
    )
  })

  return lines.join('\n')
}

/**
 * Export singleton instance for easy access
 */
export const realTimeService = RealTimeService.getInstance()