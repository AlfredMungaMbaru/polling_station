/**
 * Poll Management Component
 * 
 * Interface for administrators to view, edit, and delete polls
 */

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2, Eye, Users, BarChart3, Calendar, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Poll {
  id: string
  title: string
  description: string
  status: 'draft' | 'active' | 'completed' | 'archived'
  voteCount: number
  createdAt: string
  endDate?: string
  author: {
    name: string
    email: string
  }
}

interface PollManagementProps {
  className?: string
}

interface PollCardProps {
  poll: Poll
  onEdit: (poll: Poll) => void
  onDelete: (poll: Poll) => void
  onView: (poll: Poll) => void
}

const PollCard: React.FC<PollCardProps> = ({ poll, onEdit, onDelete, onView }) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const getStatusColor = (status: Poll['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'archived': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg line-clamp-1">{poll.title}</CardTitle>
              <CardDescription className="mt-1 line-clamp-2">
                {poll.description}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Badge className={getStatusColor(poll.status)}>
                {poll.status.charAt(0).toUpperCase() + poll.status.slice(1)}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onView(poll)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Poll
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(poll)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Poll
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Poll
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{poll.voteCount} votes</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Created {formatDate(poll.createdAt)}</span>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              by {poll.author.name}
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onView(poll)}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onEdit(poll)}
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the poll
              &ldquo;{poll.title}&rdquo; and all associated votes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                onDelete(poll)
                setIsDeleteDialogOpen(false)
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Poll
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export const PollManagement: React.FC<PollManagementProps> = ({ className }) => {
  // Mock data - in real app, this would come from your backend/database
  const [polls] = useState<Poll[]>([
    {
      id: '1',
      title: 'Best Programming Language 2024',
      description: 'Vote for your favorite programming language this year',
      status: 'active',
      voteCount: 247,
      createdAt: '2024-01-15',
      author: { name: 'Admin User', email: 'admin@example.com' }
    },
    {
      id: '2',
      title: 'Favorite Coffee Type',
      description: 'Help us determine the most popular coffee preference',
      status: 'completed',
      voteCount: 147,
      createdAt: '2024-01-10',
      author: { name: 'Admin User', email: 'admin@example.com' }
    },
    {
      id: '3',
      title: 'Team Building Activity Ideas',
      description: 'What activity should we do for the next team building event?',
      status: 'draft',
      voteCount: 0,
      createdAt: '2024-01-20',
      author: { name: 'Admin User', email: 'admin@example.com' }
    }
  ])

  const handleEditPoll = (poll: Poll) => {
    // Navigate to edit page or open edit dialog
    console.log('Edit poll:', poll.id)
    // In real app: router.push(`/admin/polls/${poll.id}/edit`)
  }

  const handleDeletePoll = (poll: Poll) => {
    // Call API to delete poll
    console.log('Delete poll:', poll.id)
    // In real app: await deletePoll(poll.id)
  }

  const handleViewPoll = (poll: Poll) => {
    // Navigate to poll detail page
    console.log('View poll:', poll.id)
    // In real app: router.push(`/polls/${poll.id}`)
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Poll Management
          </CardTitle>
          <CardDescription>
            View, edit, and manage all polls in your system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {polls.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No polls found</p>
              <Button>Create Your First Poll</Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {polls.map((poll) => (
                <PollCard
                  key={poll.id}
                  poll={poll}
                  onEdit={handleEditPoll}
                  onDelete={handleDeletePoll}
                  onView={handleViewPoll}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}