/**
 * Real-time Poll Results Component
 * 
 * Displays live poll results with real-time updates, animations,
 * and interactive visualizations. Connects to the RealTimeService
 * for live data streaming.
 */

'use client'

import { useState, useEffect, useCallback, memo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, Minus, Wifi, WifiOff, Users, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Poll } from '@/data/mockPolls'
import { 
  RealTimeService, 
  PollUpdateEvent, 
  ConnectionStatus,
  createPollUpdateEvent,
  formatLiveResults 
} from '@/lib/realTimeService'
import type { LivePollResults as LivePollResultsType } from '@/lib/realTimeService'

interface LivePollResultsProps {
  poll: Poll
  submittedVote?: string | null
  className?: string
  showDetailedStats?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

interface LiveOptionDisplayProps {
  option: {
    id: string
    label: string
    votes: number
    percentage: number
    trend: 'up' | 'down' | 'stable'
    recentVotes: number
  }
  isUserChoice: boolean
  totalVotes: number
  isAnimating: boolean
}

interface ConnectionIndicatorProps {
  status: ConnectionStatus | null
  onReconnect: () => void
}

export const LivePollResults = memo(({ 
  poll, 
  submittedVote,
  className,
  showDetailedStats = true,
  autoRefresh = true,
  refreshInterval = 30000
}: LivePollResultsProps) => {
  // State management
  const [liveResults, setLiveResults] = useState<LivePollResultsType | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null)
  const [animatingOptions, setAnimatingOptions] = useState<Set<string>>(new Set())
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [recentActivity, setRecentActivity] = useState<PollUpdateEvent[]>([])

  // Real-time service instance
  const realTimeService = RealTimeService.getInstance()

  // Initialize live results from poll data
  useEffect(() => {
    if (poll) {
      const initialResults: LivePollResultsType = {
        pollId: poll.id,
        options: poll.options.map(opt => ({
          id: opt.id,
          label: opt.label,
          votes: opt.votes,
          percentage: Math.round((opt.votes / poll.totalVotes) * 100) || 0,
          trend: 'stable' as const,
          recentVotes: 0
        })),
        totalVotes: poll.totalVotes,
        lastUpdated: new Date().toISOString(),
        isActive: poll.isActive
      }
      setLiveResults(initialResults)
    }
  }, [poll])

  // Handle real-time poll updates
  const handlePollUpdate = useCallback((event: PollUpdateEvent) => {
    if (event.pollId !== poll.id) return

    console.log('Received live poll update:', event)

    // Add to recent activity
    setRecentActivity(prev => [event, ...prev.slice(0, 4)]) // Keep last 5 events

    // Trigger animation for updated option
    setAnimatingOptions(prev => new Set([...prev, event.optionId]))
    setTimeout(() => {
      setAnimatingOptions(prev => {
        const newSet = new Set(prev)
        newSet.delete(event.optionId)
        return newSet
      })
    }, 1000)

    // Update live results
    setLiveResults((prev: LivePollResultsType | null) => {
      if (!prev) return null

      const updatedOptions = prev.options.map((opt: any) => {
        if (opt.id === event.optionId) {
          const previousVotes = opt.votes
          return {
            ...opt,
            votes: event.newVoteCount,
            percentage: event.totalVotes > 0 ? Math.round((event.newVoteCount / event.totalVotes) * 100) : 0,
            trend: event.newVoteCount > previousVotes ? 'up' as const :
                   event.newVoteCount < previousVotes ? 'down' as const : 'stable' as const,
            recentVotes: Math.max(0, event.newVoteCount - previousVotes)
          }
        }
        // Recalculate percentages for other options
        return {
          ...opt,
          percentage: event.totalVotes > 0 ? Math.round((opt.votes / event.totalVotes) * 100) : 0
        }
      })

      return {
        ...prev,
        options: updatedOptions,
        totalVotes: event.totalVotes,
        lastUpdated: event.timestamp,
        isActive: event.eventType !== 'poll_ended'
      }
    })

    setLastUpdate(new Date().toLocaleTimeString())
  }, [poll.id])

  // Handle connection status changes
  const handleConnectionStatus = useCallback((status: { status: string; error?: string }) => {
    setConnectionStatus((prev: ConnectionStatus | null) => {
      if (!prev) {
        return {
          isConnected: status.status === 'connected',
          connectionId: '',
          lastHeartbeat: new Date().toISOString(),
          reconnectAttempts: 0,
          error: status.error
        }
      }
      return {
        ...prev,
        isConnected: status.status === 'connected',
        error: status.error
      }
    })
  }, [])

  // Subscribe to real-time updates
  useEffect(() => {
    let mounted = true

    const subscribeToUpdates = async () => {
      try {
        const status = await realTimeService.subscribeToPoll({
          pollId: poll.id,
          userId: 'current-user', // Replace with actual user ID
          reconnectInterval: 5000,
          maxReconnectAttempts: 5,
          heartbeatInterval: 30000
        })

        if (mounted) {
          setConnectionStatus(status)
        }

        // Set up event listeners
        realTimeService.on('pollUpdate', handlePollUpdate)
        realTimeService.on('connectionStatus', handleConnectionStatus)

      } catch (error) {
        console.error('Failed to subscribe to real-time updates:', error)
        if (mounted) {
          setConnectionStatus((prev: ConnectionStatus | null) => {
            if (!prev) {
              return {
                isConnected: false,
                connectionId: '',
                lastHeartbeat: new Date().toISOString(),
                reconnectAttempts: 0,
                error: error instanceof Error ? error.message : 'Connection failed'
              }
            }
            return {
              ...prev,
              isConnected: false,
              error: error instanceof Error ? error.message : 'Connection failed'
            }
          })
        }
      }
    }

    subscribeToUpdates()

    // Simulate live updates for development
    const simulateUpdates = () => {
      if (Math.random() > 0.7) { // 30% chance of update
        const randomOption = poll.options[Math.floor(Math.random() * poll.options.length)]
        const currentResults = realTimeService.getLivePollResults(poll.id)
        const currentVotes = currentResults?.options.find(opt => opt.id === randomOption.id)?.votes || randomOption.votes
        
        const updateEvent = createPollUpdateEvent(
          poll.id,
          randomOption.id,
          currentVotes + 1,
          (currentResults?.totalVotes || poll.totalVotes) + 1,
          'vote_added'
        )
        
        realTimeService.broadcastPollUpdate(updateEvent)
      }
    }

    // Start simulation interval
    const simulationInterval = autoRefresh ? setInterval(simulateUpdates, refreshInterval / 6) : null

    return () => {
      mounted = false
      
      // Clean up event listeners
      realTimeService.off('pollUpdate', handlePollUpdate)
      realTimeService.off('connectionStatus', handleConnectionStatus)
      
      // Unsubscribe from updates
      realTimeService.unsubscribeFromPoll(poll.id, 'current-user')
      
      // Clear simulation
      if (simulationInterval) {
        clearInterval(simulationInterval)
      }
    }
  }, [poll.id, poll.options, poll.totalVotes, autoRefresh, refreshInterval, handlePollUpdate, handleConnectionStatus, realTimeService])

  // Reconnect handler
  const handleReconnect = useCallback(async () => {
    try {
      const status = await realTimeService.subscribeToPoll({
        pollId: poll.id,
        userId: 'current-user',
        reconnectInterval: 5000,
        maxReconnectAttempts: 5
      })
      setConnectionStatus(status)
    } catch (error) {
      console.error('Reconnection failed:', error)
    }
  }, [poll.id, realTimeService])

  if (!liveResults) {
    return <div className="animate-pulse bg-gray-200 rounded-lg h-64" />
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Live Results
              {liveResults.isActive && (
                <Badge variant="default" className="bg-green-500">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1" />
                  Live
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {liveResults.totalVotes} total votes
              {lastUpdate && ` • Last update: ${lastUpdate}`}
            </CardDescription>
          </div>
          
          <ConnectionIndicator 
            status={connectionStatus} 
            onReconnect={handleReconnect}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Live Results Display */}
        <div className="space-y-3">
          {liveResults.options.map((option: any) => (
            <LiveOptionDisplay
              key={option.id}
              option={option}
              isUserChoice={option.id === submittedVote}
              totalVotes={liveResults.totalVotes}
              isAnimating={animatingOptions.has(option.id)}
            />
          ))}
        </div>

        {/* Detailed Stats */}
        {showDetailedStats && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Total Votes:</span>
                <span className="font-medium">{liveResults.totalVotes}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Last Updated:</span>
                <span className="font-medium">
                  {new Date(liveResults.lastUpdated).toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* Recent Activity */}
            {recentActivity.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Activity</h4>
                <div className="space-y-1 text-xs text-gray-600">
                  {recentActivity.slice(0, 3).map((event, index) => {
                    const option = liveResults.options.find((opt: any) => opt.id === event.optionId)
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <span>
                          Vote for "{option?.label}" • {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
})

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const LiveOptionDisplay = memo(({ 
  option, 
  isUserChoice, 
  totalVotes, 
  isAnimating 
}: LiveOptionDisplayProps) => {
  const getTrendIcon = () => {
    switch (option.trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />
      default: return <Minus className="h-4 w-4 text-gray-400" />
    }
  }

  const getTrendColor = () => {
    switch (option.trend) {
      case 'up': return 'border-green-200 bg-green-50'
      case 'down': return 'border-red-200 bg-red-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  return (
    <div className={cn(
      "relative p-4 border rounded-lg transition-all duration-300",
      getTrendColor(),
      isUserChoice && "ring-2 ring-blue-500 ring-opacity-50",
      isAnimating && "scale-105 shadow-lg"
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">{option.label}</span>
          {getTrendIcon()}
          {isUserChoice && (
            <Badge variant="secondary" className="text-xs">Your Vote</Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">{option.votes}</span>
          <span className="text-gray-500">({option.percentage}%)</span>
          {option.recentVotes > 0 && (
            <Badge variant="outline" className="text-xs">
              +{option.recentVotes}
            </Badge>
          )}
        </div>
      </div>
      
      <Progress 
        value={option.percentage} 
        className={cn(
          "h-2 transition-all duration-500",
          isAnimating && "animate-pulse"
        )}
      />
      
      {/* Animation overlay */}
      {isAnimating && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-50 animate-pulse rounded-lg" />
      )}
    </div>
  )
})

const ConnectionIndicator = memo(({ status, onReconnect }: ConnectionIndicatorProps) => {
  if (!status) {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <WifiOff className="h-4 w-4" />
        <span>Connecting...</span>
      </div>
    )
  }

  if (!status.isConnected) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-red-500 text-sm">
          <WifiOff className="h-4 w-4" />
          <span>Disconnected</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onReconnect}
          className="text-xs"
        >
          Reconnect
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-green-500 text-sm">
      <Wifi className="h-4 w-4" />
      <span>Connected</span>
    </div>
  )
})

// Component display names
LivePollResults.displayName = 'LivePollResults'
LiveOptionDisplay.displayName = 'LiveOptionDisplay'
ConnectionIndicator.displayName = 'ConnectionIndicator'