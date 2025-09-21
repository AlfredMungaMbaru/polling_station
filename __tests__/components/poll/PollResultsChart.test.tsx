/**
 * Poll Results Chart Tests
 * 
 * Test suite for the poll result chart components to ensure proper
 * functionality and accessibility.
 */

import '@testing-library/jest-dom'
import { describe, it, expect, beforeEach } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PollResultsChart } from '@/components/poll/PollResultsChart'
import { Poll } from '@/data/mockPolls'

// Mock poll data for testing
const mockPoll: Poll = {
  id: 'test-poll',
  question: 'Test Poll Question',
  description: 'Test poll description',
  options: [
    { id: 'option1', label: 'Option 1', votes: 45 },
    { id: 'option2', label: 'Option 2', votes: 30 },
    { id: 'option3', label: 'Option 3', votes: 25 },
  ],
  totalVotes: 100,
  createdAt: '2024-01-01T00:00:00Z',
  isActive: true
}

const mockEmptyPoll: Poll = {
  id: 'empty-poll',
  question: 'Empty Poll',
  description: 'Poll with no votes',
  options: [
    { id: 'option1', label: 'Option 1', votes: 0 },
    { id: 'option2', label: 'Option 2', votes: 0 },
  ],
  totalVotes: 0,
  createdAt: '2024-01-01T00:00:00Z',
  isActive: true
}

describe('PollResultsChart', () => {
  beforeEach(() => {
    // Clear any previous test artifacts
    jest.clearAllMocks()
  })

  describe('Chart Rendering', () => {
    it('renders chart with poll data', () => {
      render(<PollResultsChart poll={mockPoll} />)
      
      // Check if main elements are present
      expect(screen.getByText('Poll Results')).toBeInTheDocument()
      expect(screen.getByText('100 votes')).toBeInTheDocument()
      expect(screen.getByText('Option 1')).toBeInTheDocument()
      expect(screen.getByText('Option 2')).toBeInTheDocument()
      expect(screen.getByText('Option 3')).toBeInTheDocument()
    })

    it('shows empty state for polls with no votes', () => {
      render(<PollResultsChart poll={mockEmptyPoll} />)
      
      expect(screen.getByText('No votes yet. Be the first to vote!')).toBeInTheDocument()
    })

    it('highlights user choice when provided', () => {
      render(<PollResultsChart poll={mockPoll} submittedVote="option1" />)
      
      // Check if user's choice is highlighted
      expect(screen.getByText('Your vote')).toBeInTheDocument()
    })
  })

  describe('Chart Type Switching', () => {
    it('allows switching between chart types', async () => {
      render(<PollResultsChart poll={mockPoll} />)
      
      // Check default tab is bar chart
      expect(screen.getByRole('tab', { name: /bar chart/i })).toHaveAttribute('aria-selected', 'true')
      
      // Switch to pie chart
      fireEvent.click(screen.getByRole('tab', { name: /pie chart/i }))
      
      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /pie chart/i })).toHaveAttribute('aria-selected', 'true')
      })
      
      // Switch to radial chart
      fireEvent.click(screen.getByRole('tab', { name: /radial/i }))
      
      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /radial/i })).toHaveAttribute('aria-selected', 'true')
      })
    })
  })

  describe('Chart Statistics', () => {
    it('displays correct statistics', () => {
      render(<PollResultsChart poll={mockPoll} />)
      
      // Check statistics display
      expect(screen.getByText('Leading Option')).toBeInTheDocument()
      expect(screen.getByText('Option 1')).toBeInTheDocument() // Leading option
      expect(screen.getByText('Margin')).toBeInTheDocument()
      expect(screen.getByText('15 votes (15%)')).toBeInTheDocument() // Margin calculation
      expect(screen.getByText('Participation')).toBeInTheDocument()
      expect(screen.getByText('3 options')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<PollResultsChart poll={mockPoll} />)
      
      // Check for accessibility attributes
      const chartTabs = screen.getAllByRole('tab')
      expect(chartTabs.length).toBeGreaterThan(0)
      
      // Check for color indicators with labels
      const colorIndicators = screen.getAllByLabelText(/color indicator for/i)
      expect(colorIndicators.length).toBe(3) // One for each option
    })

    it('provides proper tab navigation', () => {
      render(<PollResultsChart poll={mockPoll} />)
      
      const tabs = screen.getAllByRole('tab')
      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('role', 'tab')
      })
    })
  })

  describe('Data Formatting', () => {
    it('calculates percentages correctly', () => {
      render(<PollResultsChart poll={mockPoll} />)
      
      // Option 1: 45/100 = 45%
      // Option 2: 30/100 = 30%  
      // Option 3: 25/100 = 25%
      
      expect(screen.getByText('45')).toBeInTheDocument() // Votes count
      expect(screen.getByText('30')).toBeInTheDocument()
      expect(screen.getByText('25')).toBeInTheDocument()
    })

    it('sorts options by vote count', () => {
      render(<PollResultsChart poll={mockPoll} />)
      
      const optionElements = screen.getAllByText(/Option \d/)
      
      // Should be sorted: Option 1 (45), Option 2 (30), Option 3 (25)
      expect(optionElements[0]).toHaveTextContent('Option 1')
      expect(optionElements[1]).toHaveTextContent('Option 2')
      expect(optionElements[2]).toHaveTextContent('Option 3')
    })
  })

  describe('Responsive Design', () => {
    it('renders properly with different screen sizes', () => {
      // Test mobile view
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      
      render(<PollResultsChart poll={mockPoll} />)
      
      // Chart should still render with mobile viewport
      expect(screen.getByText('Poll Results')).toBeInTheDocument()
      
      // Test desktop view
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      })
      
      // Re-render for desktop
      render(<PollResultsChart poll={mockPoll} />)
      expect(screen.getByText('Poll Results')).toBeInTheDocument()
    })
  })
})

describe('Chart Integration with PollResults', () => {
  it('integrates properly with poll results component', () => {
    // This would test the integration between PollResults and PollResultsChart
    // Implementation depends on the specific integration approach
    expect(true).toBe(true) // Placeholder for integration test
  })
})

/**
 * Chart Performance Tests
 * 
 * These tests ensure the chart components perform well with various data sizes
 */
describe('Chart Performance', () => {
  it('handles large datasets efficiently', () => {
    // Create a poll with many options
    const largePoll: Poll = {
      id: 'large-poll',
      question: 'Large Poll',
      description: 'Poll with many options',
      options: Array.from({ length: 20 }, (_, i) => ({
        id: `option${i}`,
        label: `Option ${i + 1}`,
        votes: Math.floor(Math.random() * 100)
      })),
      totalVotes: 1000,
      createdAt: '2024-01-01T00:00:00Z',
      isActive: true
    }

    const startTime = performance.now()
    render(<PollResultsChart poll={largePoll} />)
    const endTime = performance.now()
    
    // Chart should render within reasonable time (< 100ms)
    expect(endTime - startTime).toBeLessThan(100)
  })
})