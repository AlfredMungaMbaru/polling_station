import { memo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Poll } from '@/data/mockPolls'
import { usePollCalculations } from '@/hooks/usePollCalculations'

interface PollResultsProps {
  poll: Poll
  submittedVote: string | null
  onVoteAgain: () => void
}

export const PollResults = memo(({ poll, submittedVote, onVoteAgain }: PollResultsProps) => {
  const { getPercentage, sortedOptions } = usePollCalculations(poll)

  const getUserVotedOption = () => {
    return poll.options.find(option => option.id === submittedVote)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Poll Results</CardTitle>
        <CardDescription>
          Total votes: {poll.totalVotes}
          {submittedVote && (
            <span className="ml-4 text-green-600 font-medium">
              ✓ You voted for: {getUserVotedOption()?.label}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {sortedOptions.map((option) => (
          <ResultBar
            key={option.id}
            option={option}
            percentage={getPercentage(option.votes)}
            isUserChoice={submittedVote === option.id}
          />
        ))}
      </CardContent>
      
      <CardFooter className="flex space-x-4">
        <Button 
          variant="outline" 
          onClick={onVoteAgain}
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
    </Card>
  )
})

// Extracted result bar component for better maintainability
const ResultBar = memo(({ option, percentage, isUserChoice }: {
  option: { id: string; label: string; votes: number }
  percentage: number
  isUserChoice: boolean
}) => (
  <div className="space-y-2">
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
        style={{ width: `${percentage}%` }}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${option.label}: ${percentage}% of votes`}
      />
    </div>
  </div>
))

PollResults.displayName = 'PollResults'
ResultBar.displayName = 'ResultBar'