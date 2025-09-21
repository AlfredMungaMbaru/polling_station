/**
 * Admin Statistics Component
 * 
 * Displays key metrics and statistics for the admin dashboard
 */

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Users, Vote, TrendingUp } from 'lucide-react'

interface AdminStatsProps {
  className?: string
}

interface StatCardProps {
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon, trend }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div className={`flex items-center text-xs mt-2 ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            <TrendingUp className={`h-3 w-3 mr-1 ${
              trend.isPositive ? '' : 'rotate-180'
            }`} />
            {trend.isPositive ? '+' : ''}{trend.value}% from last month
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export const AdminStats: React.FC<AdminStatsProps> = ({ className }) => {
  // Mock data - in real app, this would come from your backend/database
  const stats = {
    totalPolls: 24,
    totalUsers: 156,
    totalVotes: 1248,
    activePolls: 8
  }

  const trends = {
    polls: { value: 12, isPositive: true },
    users: { value: 8, isPositive: true },
    votes: { value: 23, isPositive: true },
    active: { value: 5, isPositive: false }
  }

  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
      <StatCard
        title="Total Polls"
        value={stats.totalPolls}
        description="All polls created"
        icon={<BarChart3 className="h-4 w-4" />}
        trend={trends.polls}
      />
      
      <StatCard
        title="Total Users"
        value={stats.totalUsers}
        description="Registered users"
        icon={<Users className="h-4 w-4" />}
        trend={trends.users}
      />
      
      <StatCard
        title="Total Votes"
        value={stats.totalVotes.toLocaleString()}
        description="Votes cast across all polls"
        icon={<Vote className="h-4 w-4" />}
        trend={trends.votes}
      />
      
      <StatCard
        title="Active Polls"
        value={stats.activePolls}
        description="Currently running polls"
        icon={<TrendingUp className="h-4 w-4" />}
        trend={trends.active}
      />
    </div>
  )
}