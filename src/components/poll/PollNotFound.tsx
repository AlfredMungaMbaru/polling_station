import { memo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const PollNotFound = memo(() => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>Poll Not Found</CardTitle>
        <CardDescription>
          The poll you&apos;re looking for doesn&apos;t exist or has been removed.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Link href="/" className="w-full">
          <Button className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </CardFooter>
    </Card>
  </div>
))

PollNotFound.displayName = 'PollNotFound'