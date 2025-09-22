import { memo } from 'react'
import { Card, CardDescription, CardHeader } from '@/components/ui/card'
import { Users, Calendar } from 'lucide-react'
import { Poll } from '@/data/mockPolls'
import { usePollCalculations } from '@/hooks/usePollCalculations'
import { Heading, VisuallyHidden } from '@/lib/accessibility/components'

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
            <Heading level={1} id="poll-question" className="text-2xl">{poll.question}</Heading>
            {poll.description && (
              <CardDescription className="text-base" aria-describedby="poll-question">
                {poll.description}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-500" aria-label="Poll statistics">
            <div className="flex items-center">
              <Users className="mr-1 h-4 w-4" aria-hidden="true" />
              <span>
                <VisuallyHidden>Total votes: </VisuallyHidden>
                {poll.totalVotes} votes
              </span>
            </div>
            <div className="flex items-center">
              <Calendar className="mr-1 h-4 w-4" aria-hidden="true" />
              <span>
                <VisuallyHidden>Created on: </VisuallyHidden>
                {formattedCreatedDate}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
})

PollHeader.displayName = 'PollHeader'