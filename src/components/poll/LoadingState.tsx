import { memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface LoadingStateProps {
  message: string
}

export const LoadingState = memo(({ message }: LoadingStateProps) => (
  <Card>
    <CardContent className="py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-lg font-medium">{message}</p>
      </div>
    </CardContent>
  </Card>
))

LoadingState.displayName = 'LoadingState'