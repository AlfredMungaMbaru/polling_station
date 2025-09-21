import { memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'

export const ThankYouMessage = memo(() => (
  <Card>
    <CardContent className="py-12">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg 
            className="w-8 h-8 text-green-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
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
  </Card>
))

ThankYouMessage.displayName = 'ThankYouMessage'