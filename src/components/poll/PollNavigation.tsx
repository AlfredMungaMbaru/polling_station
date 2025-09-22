import { memo } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SkipLink } from '@/lib/accessibility/components'

export const PollNavigation = memo(() => (
  <>
    <SkipLink href="#main-content">Skip to main content</SkipLink>
    <nav className="bg-white shadow-sm border-b" role="navigation" aria-label="Poll navigation">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          <Link 
            href="/" 
            className="flex items-center text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            aria-label="Go back to dashboard"
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </nav>
  </>
))

PollNavigation.displayName = 'PollNavigation'