'use client'

import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Home() {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Polling Station
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Create and participate in polls with ease
          </p>
          <div className="space-y-4">
            <Link href="/auth/login" className="block">
              <Button className="w-full">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/register" className="block">
              <Button variant="outline" className="w-full">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Polling Station</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.email}</span>
              <Button variant="outline" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Dashboard
            </h2>
            <p className="text-gray-600 mb-8">
              Start creating polls or browse existing ones
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Create a Poll</h3>
                <p className="text-gray-600 mb-4">Design and share your own poll</p>
                <Button className="w-full">
                  Coming Soon
                </Button>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Browse Polls</h3>
                <p className="text-gray-600 mb-4">Participate in existing polls</p>
                <Button variant="outline" className="w-full">
                  Coming Soon
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
