import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter, useParams } from 'next/navigation'
import PollDetailPage from '@/app/polls/[id]/page'
import { useAuth } from '@/components/AuthProvider'

// Mock the AuthProvider hook
jest.mock('@/components/AuthProvider', () => ({
  useAuth: jest.fn(),
}))

// Mock Next.js navigation hooks  
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseParams = useParams as jest.MockedFunction<typeof useParams>

describe('Poll Detail Page Integration Tests', () => {
  const mockPush = jest.fn()
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default mocks
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    })
    
    mockUseParams.mockReturnValue({ id: '1' })
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    })
  })

  describe('Complete Poll Voting Workflow', () => {
    it('should handle complete user voting journey from selection to results', async () => {
      const user = userEvent.setup()

      // Render the poll detail page
      render(<PollDetailPage />)

      // Verify poll question and options are displayed
      expect(screen.getByText('What is your favorite programming language?')).toBeInTheDocument()
      expect(screen.getByText('JavaScript')).toBeInTheDocument()
      expect(screen.getByText('Python')).toBeInTheDocument()
      expect(screen.getByText('TypeScript')).toBeInTheDocument()

      // Verify form validation - submit without selection should show error
      const submitButton = screen.getByRole('button', { name: /submit vote/i })
      await user.click(submitButton)
      
      // Wait for validation error to appear
      await waitFor(() => {
        expect(screen.getByText('Please select an option')).toBeInTheDocument()
      })

      // Select TypeScript option
      const typescriptOption = screen.getByLabelText('TypeScript')
      await user.click(typescriptOption)

      // Verify selection is made
      expect(typescriptOption).toBeChecked()

      // Submit the vote
      await user.click(submitButton)

      // Verify loading state appears
      expect(screen.getByText('Submitting...')).toBeInTheDocument()

      // Wait for thank you message to appear
      await waitFor(
        () => {
          expect(screen.getByText('Thanks for voting!')).toBeInTheDocument()
          expect(screen.getByText('Your vote has been recorded successfully. Showing results shortly...')).toBeInTheDocument()
        },
        { timeout: 2000 }
      )

      // Wait for automatic transition to results (after 3 seconds)
      await waitFor(
        () => {
          expect(screen.getByText('Poll Results')).toBeInTheDocument()
          expect(screen.getByText('Total votes: 135')).toBeInTheDocument()
        },
        { timeout: 4000 }
      )

      // Verify vote again functionality
      const voteAgainButton = screen.getByRole('button', { name: /vote again/i })
      expect(voteAgainButton).toBeInTheDocument()
      
      await user.click(voteAgainButton)

      // Verify form is reset and ready for new vote
      await waitFor(() => {
        expect(screen.getByText('Select your preferred option:')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /submit vote/i })).toBeInTheDocument()
      })

      // Verify no option is selected after reset
      const allOptions = screen.getAllByRole('radio')
      allOptions.forEach(option => {
        expect(option).not.toBeChecked()
      })
    })
  })

  describe('Authentication Integration', () => {
    it('should redirect unauthenticated users to login when attempting to vote', async () => {
      const user = userEvent.setup()

      // Mock unauthenticated state
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
      })

      render(<PollDetailPage />)

      // Select an option
      const jsOption = screen.getByLabelText('JavaScript')
      await user.click(jsOption)

      // Submit vote
      const submitButton = screen.getByRole('button', { name: /submit vote/i })
      await user.click(submitButton)

      // Verify redirect to login
      expect(mockPush).toHaveBeenCalledWith('/auth/login')
    })

    it('should show loading state while checking authentication', () => {
      // Mock loading state
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
      })

      render(<PollDetailPage />)

      // Verify loading message is shown
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  describe('Poll Not Found Handling', () => {
    it('should display appropriate error when poll does not exist', () => {
      // Mock non-existent poll ID
      mockUseParams.mockReturnValue({ id: '999' })

      render(<PollDetailPage />)

      // Verify error message and navigation option
      expect(screen.getByText('Poll Not Found')).toBeInTheDocument()
      expect(screen.getByText('The poll you\'re looking for doesn\'t exist or has been removed.')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /back to home/i })).toBeInTheDocument()
    })
  })

  describe('Poll Results Display Integration', () => {
    it('should correctly display poll results with vote counts and percentages', async () => {
      const user = userEvent.setup()

      render(<PollDetailPage />)

      // Submit a vote to get to results
      await user.click(screen.getByLabelText('TypeScript'))
      await user.click(screen.getByRole('button', { name: /submit vote/i }))

      // Wait for results to show
      await waitFor(
        () => {
          expect(screen.getByText('Poll Results')).toBeInTheDocument()
        },
        { timeout: 4000 }
      )

      // Verify all options are displayed with vote counts
      expect(screen.getByText('JavaScript: 45 votes')).toBeInTheDocument()
      expect(screen.getByText('Python: 38 votes')).toBeInTheDocument()
      expect(screen.getByText('TypeScript: 52 votes')).toBeInTheDocument()

      // Verify total vote count
      expect(screen.getByText('Total votes: 135')).toBeInTheDocument()

      // Verify progress bars are rendered (check for the progress bar container)
      const progressBars = screen.getAllByRole('progressbar')
      expect(progressBars).toHaveLength(3) // One for each option

      // Verify return to dashboard link
      expect(screen.getByRole('link', { name: /return to dashboard/i })).toBeInTheDocument()
    })
  })

  describe('Form Validation Integration', () => {
    it('should provide real-time feedback for form validation errors', async () => {
      const user = userEvent.setup()

      render(<PollDetailPage />)

      // Try to submit without selection
      const submitButton = screen.getByRole('button', { name: /submit vote/i })
      await user.click(submitButton)

      // Verify error message appears
      await waitFor(() => {
        const errorMessage = screen.getByText('Please select an option')
        expect(errorMessage).toBeInTheDocument()
        expect(errorMessage).toHaveClass('text-red-600') // Verify error styling
      })

      // Select an option and verify error disappears
      await user.click(screen.getByLabelText('JavaScript'))
      
      // Error should be cleared when valid selection is made
      await waitFor(() => {
        expect(screen.queryByText('Please select an option')).not.toBeInTheDocument()
      })
    })
  })

  describe('Multiple Poll Support', () => {
    it('should correctly load different polls based on URL parameter', () => {
      // Test poll 2
      mockUseParams.mockReturnValue({ id: '2' })

      const { rerender } = render(<PollDetailPage />)

      expect(screen.getByText('Which framework do you prefer for React development?')).toBeInTheDocument()
      expect(screen.getByText('Next.js')).toBeInTheDocument()
      expect(screen.getByText('Remix')).toBeInTheDocument()

      // Test poll 3
      mockUseParams.mockReturnValue({ id: '3' })
      rerender(<PollDetailPage />)

      expect(screen.getByText('What is the best deployment platform for web apps?')).toBeInTheDocument()
      expect(screen.getByText('Vercel')).toBeInTheDocument()
      expect(screen.getByText('Netlify')).toBeInTheDocument()
      expect(screen.getByText('AWS')).toBeInTheDocument()
      expect(screen.getByText('Railway')).toBeInTheDocument()
    })
  })
})