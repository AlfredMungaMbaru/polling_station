import { memo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Calendar } from 'lucide-react'
import { Poll } from '@/data/mockPolls'
import { usePollCalculations } from '@/hooks/usePollCalculations'

interface PollHeaderProps {
  poll: Poll
}

export const PollHeader = memo(({ poll }: PollHeaderProps) => {
  const { formattedCreatedDate } = usePollCalculations(poll)

  return (
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
              {formattedCreatedDate}
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
})

PollHeader.displayName = 'PollHeader'