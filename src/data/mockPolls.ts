// Mock poll data - moved to separate data file for better organization
export const MOCK_POLLS = {
  '1': {
    id: '1',
    question: 'What is your favorite programming language?',
    description: 'Help us understand the community preferences for programming languages in 2025.',
    options: [
      { id: 'js', label: 'JavaScript', votes: 45 },
      { id: 'py', label: 'Python', votes: 38 },
      { id: 'ts', label: 'TypeScript', votes: 52 },
    ],
    totalVotes: 135 as number,
    createdAt: '2025-09-20T10:00:00Z',
    isActive: true,
  },
  '2': {
    id: '2',
    question: 'Which framework do you prefer for React development?',
    description: 'Compare the most popular React frameworks for modern web development.',
    options: [
      { id: 'next', label: 'Next.js', votes: 67 },
      { id: 'remix', label: 'Remix', votes: 23 },
      { id: 'vite', label: 'Vite + React', votes: 41 },
    ],
    totalVotes: 131 as number,
    createdAt: '2025-09-19T14:30:00Z',
    isActive: true,
  },
  '3': {
    id: '3',
    question: 'What is the best deployment platform for web apps?',
    description: 'Share your experience with different hosting and deployment solutions.',
    options: [
      { id: 'vercel', label: 'Vercel', votes: 89 },
      { id: 'netlify', label: 'Netlify', votes: 34 },
      { id: 'aws', label: 'AWS', votes: 28 },
      { id: 'railway', label: 'Railway', votes: 19 },
    ],
    totalVotes: 170 as number,
    createdAt: '2025-09-18T09:15:00Z',
    isActive: true,
  },
}

export type Poll = {
  id: string
  question: string
  description: string
  options: Array<{
    id: string
    label: string
    votes: number
  }>
  totalVotes: number
  createdAt: string
  isActive: boolean
}

export type PollOption = Poll['options'][0]