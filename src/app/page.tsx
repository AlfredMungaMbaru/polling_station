'use client'

import { useAuth } from '@/components/AuthProvider'
import { Heading, SkipLink, AccessibleButton, LiveRegion } from '@/lib/accessibility/components'
import Link from 'next/link'

export default function Home() {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LiveRegion announcement="Loading application..." />
        <div className="text-lg" role="status" aria-live="polite">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <SkipLink href="#main-content">Skip to main content</SkipLink>
        <main id="main-content" className="text-center">
          <Heading level={1} className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Polling Station
          </Heading>
          <p className="text-lg text-gray-600 mb-8">
            Create and participate in polls with ease
          </p>
          <div className="space-y-4">
            <Link href="/auth/login" className="block">
              <AccessibleButton className="w-full">
                Sign In
              </AccessibleButton>
            </Link>
            <Link href="/auth/register" className="block">
              <AccessibleButton variant="secondary" className="w-full">
                Create Account
              </AccessibleButton>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      
      <nav className="bg-white shadow-sm border-b" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Heading level={1} className="text-xl font-bold text-gray-900">Polling Station</Heading>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.email}</span>
              <AccessibleButton variant="secondary" onClick={signOut}>
                Sign Out
              </AccessibleButton>
            </div>
          </div>
        </div>
      </nav>

      <main id="main-content" className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <Heading level={2} className="text-3xl font-bold text-gray-900 mb-4">
              Dashboard
            </Heading>
            <p className="text-gray-600 mb-8">
              Start creating polls or browse existing ones
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <div className="bg-white p-6 rounded-lg shadow">
                <Heading level={3} className="text-lg font-semibold mb-2">Create a Poll</Heading>
                <p className="text-gray-600 mb-4">Design and share your own poll</p>
                <AccessibleButton className="w-full" disabled>
                  Coming Soon
                </AccessibleButton>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <Heading level={3} className="text-lg font-semibold mb-2">Browse Polls</Heading>
                <p className="text-gray-600 mb-4">Participate in existing polls</p>
                <Link href="/polls/1">
                  <AccessibleButton variant="secondary" className="w-full">
                    View Sample Poll
                  </AccessibleButton>
                </Link>
              </div>
            </div>
            
            {/* Test Poll Links */}
            <section className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200" aria-labelledby="demo-polls-heading">
              <Heading level={4} id="demo-polls-heading" className="text-sm font-medium text-blue-900 mb-3">Test Polls (Demo Data)</Heading>
              <div className="flex flex-wrap gap-2">
                <Link href="/polls/1">
                  <AccessibleButton variant="secondary" size="sm">Programming Languages</AccessibleButton>
                </Link>
                <Link href="/polls/2">
                  <AccessibleButton variant="secondary" size="sm">React Frameworks</AccessibleButton>
                </Link>
                <Link href="/polls/3">
                  <AccessibleButton variant="secondary" size="sm">Deployment Platforms</AccessibleButton>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
