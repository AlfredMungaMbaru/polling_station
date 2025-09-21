import { memo } from 'react'
import { AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ErrorMessageProps {
  title?: string
  message: string
  details?: string
  onRetry?: () => void
  onDismiss?: () => void
}

export const ErrorMessage = memo(({ 
  title = 'Error', 
  message, 
  details, 
  onRetry, 
  onDismiss 
}: ErrorMessageProps) => {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <CardTitle className="text-red-800">{title}</CardTitle>
        </div>
        <CardDescription className="text-red-700">
          {message}
        </CardDescription>
      </CardHeader>
      
      {details && (
        <CardContent>
          <div className="text-sm text-red-600 bg-red-100 p-3 rounded-md">
            <strong>Details:</strong> {details}
          </div>
        </CardContent>
      )}
      
      {(onRetry || onDismiss) && (
        <CardContent className="flex space-x-3">
          {onRetry && (
            <Button 
              variant="outline" 
              onClick={onRetry}
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Try Again
            </Button>
          )}
          {onDismiss && (
            <Button 
              variant="ghost" 
              onClick={onDismiss}
              className="text-red-600 hover:bg-red-100"
            >
              Dismiss
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  )
})

ErrorMessage.displayName = 'ErrorMessage'