/**
 * Poll Results Chart Component
 * 
 * Provides interactive chart visualizations for poll results using Recharts.
 * Supports multiple chart types (bar, pie, doughnut) with responsive design
 * and accessibility features.
 */

'use client'

import React, { useState, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  PieLabelRenderProps
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Zap } from 'lucide-react'
import { Poll, PollOption } from '@/data/mockPolls'

interface PollResultsChartProps {
  poll: Poll
  submittedVote?: string | null
  className?: string
}

interface ChartDataPoint {
  name: string
  votes: number
  percentage: number
  color: string
  isUserChoice: boolean
  [key: string]: any // Add index signature for Recharts compatibility
}

type ChartType = 'bar' | 'pie' | 'radial'

/**
 * Color palette for chart visualization
 * Ensures good contrast and accessibility
 */
const CHART_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#6366F1', // Indigo
]

/**
 * Custom tooltip component for charts
 */
interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    payload: ChartDataPoint
  }>
  label?: string
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900">{data.name}</p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">{data.votes}</span> votes ({data.percentage}%)
        </p>
        {data.isUserChoice && (
          <Badge variant="secondary" className="mt-1">
            Your choice
          </Badge>
        )}
      </div>
    )
  }
  return null
}

/**
 * Custom label function for pie charts
 */
const renderCustomLabel = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props
  
  if (!cx || !cy || typeof percent !== 'number' || percent < 0.05) {
    return null
  }
  
  const RADIAN = Math.PI / 180
  const radius = Number(innerRadius) + (Number(outerRadius) - Number(innerRadius)) * 0.5
  const x = Number(cx) + radius * Math.cos(-Number(midAngle) * RADIAN)
  const y = Number(cy) + radius * Math.sin(-Number(midAngle) * RADIAN)

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > Number(cx) ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize={12}
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export const PollResultsChart: React.FC<PollResultsChartProps> = ({
  poll,
  submittedVote,
  className
}) => {
  const [activeChart, setActiveChart] = useState<ChartType>('bar')

  /**
   * Prepare chart data with colors and user choice highlighting
   */
  const chartData = useMemo<ChartDataPoint[]>(() => {
    return poll.options.map((option: PollOption, index: number) => {
      const percentage = poll.totalVotes > 0 
        ? Math.round((option.votes / poll.totalVotes) * 100) 
        : 0
      
      return {
        name: option.label,
        votes: option.votes,
        percentage,
        color: CHART_COLORS[index % CHART_COLORS.length],
        isUserChoice: submittedVote === option.id
      }
    }).sort((a, b) => b.votes - a.votes) // Sort by votes descending
  }, [poll.options, poll.totalVotes, submittedVote])

  /**
   * Calculate chart statistics
   */
  const chartStats = useMemo(() => {
    const totalVotes = poll.totalVotes
    const leadingOption = chartData[0]
    const margin = chartData.length > 1 ? leadingOption.votes - chartData[1].votes : leadingOption.votes
    
    return {
      totalVotes,
      leadingOption: leadingOption?.name || 'N/A',
      margin,
      marginPercentage: totalVotes > 0 ? Math.round((margin / totalVotes) * 100) : 0
    }
  }, [chartData, poll.totalVotes])

  /**
   * Bar Chart Component
   */
  const BarChartView = () => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        accessibilityLayer
      >
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis 
          dataKey="name" 
          angle={-45}
          textAnchor="end"
          height={80}
          fontSize={12}
          interval={0}
        />
        <YAxis 
          label={{ value: 'Votes', angle: -90, position: 'insideLeft' }}
          fontSize={12}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar 
          dataKey="votes" 
          radius={[4, 4, 0, 0]}
        >
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.color}
              stroke={entry.isUserChoice ? '#1F2937' : 'none'}
              strokeWidth={entry.isUserChoice ? 2 : 0}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )

  /**
   * Pie Chart Component
   */
  const PieChartView = () => (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart accessibilityLayer>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomLabel}
          outerRadius={100}
          fill="#8884d8"
          dataKey="votes"
          stroke="#fff"
          strokeWidth={2}
        >
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.color}
              stroke={entry.isUserChoice ? '#1F2937' : '#fff'}
              strokeWidth={entry.isUserChoice ? 3 : 2}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  )

  /**
   * Radial Bar Chart Component
   */
  const RadialChartView = () => (
    <ResponsiveContainer width="100%" height={300}>
      <RadialBarChart 
        cx="50%" 
        cy="50%" 
        innerRadius="20%" 
        outerRadius="80%" 
        data={chartData}
        accessibilityLayer
      >
        <RadialBar 
          dataKey="percentage" 
          cornerRadius={4}
        >
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.color}
              stroke={entry.isUserChoice ? '#1F2937' : 'none'}
              strokeWidth={entry.isUserChoice ? 2 : 0}
            />
          ))}
        </RadialBar>
        <Tooltip content={<CustomTooltip />} />
      </RadialBarChart>
    </ResponsiveContainer>
  )

  if (poll.totalVotes === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Poll Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No votes yet. Be the first to vote!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Poll Results
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {chartStats.totalVotes} votes
            </Badge>
          </div>
        </div>

        {/* Chart Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Leading Option</p>
            <p className="font-medium text-gray-900 truncate" title={chartStats.leadingOption}>
              {chartStats.leadingOption}
            </p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Margin</p>
            <p className="font-medium text-gray-900">
              {chartStats.margin} votes ({chartStats.marginPercentage}%)
            </p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Participation</p>
            <p className="font-medium text-gray-900">
              {chartData.length} options
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeChart} onValueChange={(value) => setActiveChart(value as ChartType)}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="bar" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Bar Chart
            </TabsTrigger>
            <TabsTrigger value="pie" className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              Pie Chart
            </TabsTrigger>
            <TabsTrigger value="radial" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Radial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bar">
            <BarChartView />
          </TabsContent>

          <TabsContent value="pie">
            <PieChartView />
          </TabsContent>

          <TabsContent value="radial">
            <RadialChartView />
          </TabsContent>
        </Tabs>

        {/* Chart Legend */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {chartData.map((item, index) => (
            <div 
              key={index} 
              className={`flex items-center gap-2 p-2 rounded ${
                item.isUserChoice ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
              }`}
            >
              {/* eslint-disable-next-line react/forbid-dom-props, @next/next/no-inline-styles */}
              <div 
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
                aria-label={`Color indicator for ${item.name}`}
              />
              <span className="text-sm font-medium truncate" title={item.name}>
                {item.name}
              </span>
              <span className="text-sm text-gray-600 ml-auto">
                {item.votes}
              </span>
              {item.isUserChoice && (
                <Badge variant="secondary" className="text-xs ml-1">
                  Your vote
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}