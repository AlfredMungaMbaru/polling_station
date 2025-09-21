import { memo } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const PollNavigation = memo(() => (
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
))

PollNavigation.displayName = 'PollNavigation'