'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { ArrowLeft, Users, Calendar } from 'lucide-react'
import Link from 'next/link'

// Mock poll data - will be replaced with Supabase queries later
const MOCK_POLLS = {
  '1': {
    id: '1',
    question: 'What is your favorite programming language?',
    description: 'Help us understand the community preferences for programming languages in 2025.',
    options: [
      { id: 'js', label: 'JavaScript', votes: 45 },
      { id: 'py', label: 'Python', votes: 38 },
      { id: 'ts', label: 'TypeScript', votes: 52 },
    ],
    totalVotes: 135,
    createdAt: '2025-09-20T10:00:00Z',
    isActive: true,
  },
  '2': {
    id: '2',
    question: 'Which framework do you prefer for React development?',
    description: 'Compare the most popular React frameworks for modern web development.',
    options: [
      { id: 'next', label: 'Next.js', votes: 67 },
      { id: 'remix', label: 'Remix', votes: 23 },
      { id: 'vite', label: 'Vite + React', votes: 41 },
    ],
    totalVotes: 131,
    createdAt: '2025-09-19T14:30:00Z',
    isActive: true,
  },
  '3': {
    id: '3',
    question: 'What is the best deployment platform for web apps?',
    description: 'Share your experience with different hosting and deployment solutions.',
    options: [
      { id: 'vercel', label: 'Vercel', votes: 89 },
      { id: 'netlify', label: 'Netlify', votes: 34 },
      { id: 'aws', label: 'AWS', votes: 28 },
      { id: 'railway', label: 'Railway', votes: 19 },
    ],
    totalVotes: 170,
    createdAt: '2025-09-18T09:15:00Z',
    isActive: true,
  },
}

// Vote form validation schema
const voteSchema = z.object({
  optionId: z.string().min(1, 'Please select an option'),
})

type VoteFormData = z.infer<typeof voteSchema>

// Vote status enum
type VoteStatus = 'voting' | 'submitting' | 'voted' | 'results'

export default function PollDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading } = useAuth()
  const [voteStatus, setVoteStatus] = useState<VoteStatus>('voting')
  const [submittedVote, setSubmittedVote] = useState<string | null>(null)

  const pollId = params.id as string
  const poll = MOCK_POLLS[pollId as keyof typeof MOCK_POLLS]

  const form = useForm<VoteFormData>({
    resolver: zodResolver(voteSchema),
    defaultValues: {
      optionId: '',
    },
  })

  // Handle vote submission
  const onSubmit = async (data: VoteFormData) => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    setVoteStatus('submitting')

    try {
      // TODO: Replace with actual Supabase vote submission
      console.log('Submitting vote:', {
        pollId,
        optionId: data.optionId,
        userId: user.id,
        timestamp: new Date().toISOString(),
      })

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      setSubmittedVote(data.optionId)
      setVoteStatus('voted')

      // Reset the form after successful submission
      form.reset()

      // Auto-show results after thank you message
      setTimeout(() => {
        setVoteStatus('results')
      }, 3000) // Increased to 3 seconds to show the thank you message longer

    } catch (error) {
      console.error('Error submitting vote:', error)
      setVoteStatus('voting')
    }
  }

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  // Handle poll not found
  if (!poll) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Poll Not Found</CardTitle>
            <CardDescription>
              The poll you&apos;re looking for doesn&apos;t exist or has been removed.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/" className="w-full">
              <Button className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Calculate percentages for results view
  const getPercentage = (votes: number) => {
    if (poll.totalVotes === 0) return 0
    return Math.round((votes / poll.totalVotes) * 100)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Poll Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Poll Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-2xl">{poll.question}</CardTitle>
                  {poll.description && (
                    <CardDescription className="text-base">
                      {poll.description}
                    </CardDescription>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Users className="mr-1 h-4 w-4" />
                    {poll.totalVotes} votes
                  </div>
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4" />
                    {new Date(poll.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Voting Form or Results */}
          <Card>
            {voteStatus === 'voting' && (
              <>
                <CardHeader>
                  <CardTitle>Cast Your Vote</CardTitle>
                  <CardDescription>
                    {user ? 'Select your preferred option below.' : 'Please sign in to vote.'}
                  </CardDescription>
                </CardHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                      {!user && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                          <p className="text-sm text-blue-700">
                            You need to be signed in to participate in this poll.{' '}
                            <Link href="/auth/login" className="font-medium underline">
                              Sign in here
                            </Link>
                          </p>
                        </div>
                      )}
                      
                      <FormField
                        control={form.control}
                        name="optionId"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Select your preferred option:</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                disabled={!user}
                                className="space-y-2"
                              >
                                {poll.options.map((option) => (
                                  <div key={option.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                                    <RadioGroupItem 
                                      value={option.id} 
                                      id={option.id}
                                    />
                                    <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                                      {option.label}
                                    </Label>
                                  </div>
                                ))}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                    <CardFooter>
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={!user}
                      >
                        Submit Vote
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </>
            )}

            {voteStatus === 'submitting' && (
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-lg font-medium">Submitting your vote...</p>
                </div>
              </CardContent>
            )}

            {voteStatus === 'voted' && (
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-green-600 mb-2">Thanks for voting!</h3>
                    <p className="text-gray-600">
                      Your vote has been recorded successfully. Showing results shortly...
                    </p>
                  </div>
                </div>
              </CardContent>
            )}

            {voteStatus === 'results' && (
              <>
                <CardHeader>
                  <CardTitle>Poll Results</CardTitle>
                  <CardDescription>
                    Total votes: {poll.totalVotes}
                    {submittedVote && (
                      <span className="ml-4 text-green-600 font-medium">
                        ✓ You voted for: {poll.options.find(o => o.id === submittedVote)?.label}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {poll.options
                    .sort((a, b) => b.votes - a.votes)
                    .map((option) => {
                      const percentage = getPercentage(option.votes)
                      const isUserChoice = submittedVote === option.id
                      
                      return (
                        <div key={option.id} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className={`font-medium ${isUserChoice ? 'text-green-600' : 'text-gray-900'}`}>
                              {option.label} {isUserChoice && '✓'}
                            </span>
                            <span className="text-sm text-gray-500">
                              {option.votes} votes ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full transition-all duration-500 ${
                                isUserChoice ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${percentage}%` }} // Dynamic width needed for poll results
                            />
                          </div>
                        </div>
                      )
                    })}
                </CardContent>
                <CardFooter className="flex space-x-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setVoteStatus('voting')
                      form.reset()
                      setSubmittedVote(null)
                    }}
                    className="flex-1"
                  >
                    Vote Again
                  </Button>
                  <Link href="/" className="flex-1">
                    <Button className="w-full">
                      Back to Dashboard
                    </Button>
                  </Link>
                </CardFooter>
              </>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}