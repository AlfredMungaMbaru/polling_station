import { useMemo } from 'react'
import { Poll } from '@/data/mockPolls'

// Custom hook for poll calculations with memoization
export const usePollCalculations = (poll: Poll) => {
  const calculations = useMemo(() => {
    const getPercentage = (votes: number): number => {
      if (poll.totalVotes === 0) return 0
      return Math.round((votes / poll.totalVotes) * 100)
    }

    const sortedOptions = [...poll.options].sort((a, b) => b.votes - a.votes)

    const formattedCreatedDate = new Date(poll.createdAt).toLocaleDateString()

    return {
      getPercentage,
      sortedOptions,
      formattedCreatedDate,
    }
  }, [poll])

  return calculations
}