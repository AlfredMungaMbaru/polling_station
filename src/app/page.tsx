'use client'import Image from "next/image";



import { useAuth } from '@/components/AuthProvider'export default function Home() {

import { Button } from '@/components/ui/button'  return (

import Link from 'next/link'    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">

      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">

export default function Home() {        <Image

  const { user, loading, signOut } = useAuth()          className="dark:invert"

          src="/next.svg"

  if (loading) {          alt="Next.js logo"

    return (          width={180}

      <div className="min-h-screen flex items-center justify-center">          height={38}

        <div className="text-lg">Loading...</div>          priority

      </div>        />

    )        <ol className="font-mono list-inside list-decimal text-sm/6 text-center sm:text-left">

  }          <li className="mb-2 tracking-[-.01em]">

            Get started by editing{" "}

  if (!user) {            <code className="bg-black/[.05] dark:bg-white/[.06] font-mono font-semibold px-1 py-0.5 rounded">

    return (              src/app/page.tsx

      <div className="min-h-screen flex items-center justify-center bg-gray-50">            </code>

        <div className="max-w-md w-full space-y-8 text-center">            .

          <div>          </li>

            <h1 className="text-4xl font-bold text-gray-900 mb-4">          <li className="tracking-[-.01em]">

              Polling Station            Save and see your changes instantly.

            </h1>          </li>

            <p className="text-lg text-gray-600 mb-8">        </ol>

              Create and participate in polls with ease

            </p>        <div className="flex gap-4 items-center flex-col sm:flex-row">

          </div>          <a

          <div className="space-y-4">            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"

            <Link href="/auth/login" className="block">            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"

              <Button className="w-full" size="lg">            target="_blank"

                Sign In            rel="noopener noreferrer"

              </Button>          >

            </Link>            <Image

            <Link href="/auth/register" className="block">              className="dark:invert"

              <Button variant="outline" className="w-full" size="lg">              src="/vercel.svg"

                Create Account              alt="Vercel logomark"

              </Button>              width={20}

            </Link>              height={20}

          </div>            />

        </div>            Deploy now

      </div>          </a>

    )          <a

  }            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"

            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"

  return (            target="_blank"

    <div className="min-h-screen bg-gray-50">            rel="noopener noreferrer"

      <header className="bg-white shadow">          >

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">            Read our docs

          <div className="flex justify-between items-center py-6">          </a>

            <h1 className="text-3xl font-bold text-gray-900">        </div>

              Polling Station      </main>

            </h1>      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">

            <div className="flex items-center space-x-4">        <a

              <span className="text-gray-600">          className="flex items-center gap-2 hover:underline hover:underline-offset-4"

                Welcome, {user.email}!          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"

              </span>          target="_blank"

              <Button onClick={signOut} variant="outline">          rel="noopener noreferrer"

                Sign Out        >

              </Button>          <Image

            </div>            aria-hidden

          </div>            src="/file.svg"

        </div>            alt="File icon"

      </header>            width={16}

                  height={16}

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">          />

        <div className="px-4 py-6 sm:px-0">          Learn

          <div className="text-center">        </a>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">        <a

              Dashboard          className="flex items-center gap-2 hover:underline hover:underline-offset-4"

            </h2>          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"

            <p className="text-gray-600">          target="_blank"

              You're successfully authenticated! This is where your polling dashboard would go.          rel="noopener noreferrer"

            </p>        >

          </div>          <Image

        </div>            aria-hidden

      </main>            src="/window.svg"

    </div>            alt="Window icon"

  )            width={16}

}            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
