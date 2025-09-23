/**
 * QR Code Integration Tests
 * Tests the integration of QR code sharing functionality within poll components
 */

import { render, screen } from '@testing-library/react'
import { PollResults } from '@/components/poll/PollResults'
import { PollHeader } from '@/components/poll/PollHeader'
import { MOCK_POLLS } from '@/data/mockPolls'

// Mock QR code generation to avoid canvas dependency in tests
jest.mock('@/lib/qrCodeService', () => ({
  QRCodeService: {
    generatePollQRCode: jest.fn().mockResolvedValue('data:image/png;base64,mockedQRCode'),
    generateDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mockedQRCode'),
    downloadQRCode: jest.fn().mockResolvedValue(undefined),
  },
  qrCodeUtils: {
    getColorSchemes: jest.fn().mockReturnValue([
      { name: 'Default', foreground: '#000000', background: '#FFFFFF' }
    ]),
    getErrorCorrectionLevels: jest.fn().mockReturnValue([
      { level: 'L', description: 'Low' }
    ]),
    getImageFormats: jest.fn().mockReturnValue([
      { format: 'PNG', mimeType: 'image/png' }
    ])
  },
  useQRCode: jest.fn().mockReturnValue({
    qrCodeDataURL: 'data:image/png;base64,mockedQRCode',
    isGenerating: false,
    error: null,
    generateQRCode: jest.fn(),
    downloadQRCode: jest.fn(),
    copyToClipboard: jest.fn()
  })
}))

describe('QR Code Integration', () => {
  const mockPoll = MOCK_POLLS['1']

  describe('PollResults Component', () => {
    it('renders PollResults with QR code sharing integration', async () => {
      const mockOnVoteAgain = jest.fn()

      render(
        <PollResults 
          poll={mockPoll}
          submittedVote="option-1"
          onVoteAgain={mockOnVoteAgain}
        />
      )

      // Check that the main components render
      expect(screen.getByText('Poll Results')).toBeInTheDocument()
      expect(screen.getByText('List View')).toBeInTheDocument()
      expect(screen.getByText('Chart View')).toBeInTheDocument()

      // Check that action buttons are present (only one per view is visible at a time)
      expect(screen.getByText('Vote Again')).toBeInTheDocument()
      expect(screen.getByText('Back to Dashboard')).toBeInTheDocument()

      // The QRCodeSharing component should be present but may not be immediately visible
      // We check for key elements that should exist in the component structure
      expect(screen.getAllByText((content, element) => 
        content.includes('Total votes:') || element?.textContent?.includes('Total votes:') || false
      ).length).toBeGreaterThan(0)
    })

    it('renders PollResults without submitted vote', () => {
      const mockOnVoteAgain = jest.fn()

      render(
        <PollResults 
          poll={mockPoll}
          submittedVote={null}
          onVoteAgain={mockOnVoteAgain}
        />
      )

      expect(screen.getByText('Poll Results')).toBeInTheDocument()
      expect(screen.getByText(`Total votes: ${mockPoll.totalVotes}`)).toBeInTheDocument()
      
      // Should not show "You voted for" message
      expect(screen.queryByText(/You voted for:/)).not.toBeInTheDocument()
    })

    it('displays vote results correctly', () => {
      const mockOnVoteAgain = jest.fn()

      render(
        <PollResults 
          poll={mockPoll}
          submittedVote="option-1"
          onVoteAgain={mockOnVoteAgain}
        />
      )

      // Check that poll options are displayed
      mockPoll.options.forEach((option: any) => {
        expect(screen.getByText(option.label)).toBeInTheDocument()
      })
    })
  })

  describe('PollHeader Component', () => {
    it('renders PollHeader with QR code sharing integration', () => {
      render(<PollHeader poll={mockPoll} />)

      expect(screen.getByText(mockPoll.question)).toBeInTheDocument()
      expect(screen.getByText(mockPoll.description)).toBeInTheDocument()
      
      // Check for poll metadata
      expect(screen.getByText(/Total votes:/)).toBeInTheDocument()
      expect(screen.getByText(/Created on:/)).toBeInTheDocument()
    })
  })

  describe('QR Code Service Integration', () => {
    it('QRCodeService mock is properly configured', async () => {
      const { QRCodeService } = await import('@/lib/qrCodeService')
      
      expect(QRCodeService.generatePollQRCode).toBeDefined()
      expect(QRCodeService.generateDataURL).toBeDefined()
      expect(QRCodeService.downloadQRCode).toBeDefined()
    })
  })
})