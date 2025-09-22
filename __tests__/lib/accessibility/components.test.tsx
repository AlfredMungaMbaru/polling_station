/**
 * @fileoverview Tests for accessibility React components
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { axe, toHaveNoViolations } from 'jest-axe'
import {
  LiveRegion,
  SkipLink,
  VisuallyHidden,
  FocusRing,
  ErrorMessage,
  Heading,
  AccessibleButton,
  Modal,
  FormField
} from '@/lib/accessibility/components'

expect.extend(toHaveNoViolations)

// Mock for focus management
const mockFocus = jest.fn()
HTMLElement.prototype.focus = mockFocus

describe('Accessibility Components', () => {
  beforeEach(() => {
    mockFocus.mockClear()
  })

  describe('LiveRegion', () => {
    it('renders with polite announcement by default', () => {
      render(<LiveRegion announcement="Test announcement" />)
      
      const region = screen.getByRole('status')
      expect(region).toHaveAttribute('aria-live', 'polite')
      expect(region).toHaveAttribute('aria-atomic', 'true')
      expect(region).toHaveClass('sr-only')
      expect(region).toHaveTextContent('Test announcement')
    })

    it('renders with assertive politeness', () => {
      render(<LiveRegion announcement="Urgent message" politeness="assertive" />)
      
      const region = screen.getByRole('status')
      expect(region).toHaveAttribute('aria-live', 'assertive')
    })

    it('accepts custom className', () => {
      render(<LiveRegion announcement="Test" className="custom-class" />)
      
      expect(screen.getByRole('status')).toHaveClass('custom-class')
    })

    it('should have no accessibility violations', async () => {
      const { container } = render(<LiveRegion announcement="Test" />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('SkipLink', () => {
    it('renders with correct href and text', () => {
      render(<SkipLink href="#main">Skip to main content</SkipLink>)
      
      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '#main')
      expect(link).toHaveTextContent('Skip to main content')
      expect(link).toHaveClass('sr-only')
    })

    it('becomes visible on focus', () => {
      render(<SkipLink href="#main">Skip</SkipLink>)
      
      const link = screen.getByRole('link')
      fireEvent.focus(link)
      
      expect(link).toHaveClass('focus:not-sr-only')
    })

    it('should have no accessibility violations', async () => {
      const { container } = render(<SkipLink href="#main">Skip</SkipLink>)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('VisuallyHidden', () => {
    it('renders content with screen reader only class', () => {
      render(<VisuallyHidden>Hidden content</VisuallyHidden>)
      
      const element = screen.getByText('Hidden content')
      expect(element).toHaveClass('sr-only')
    })
  })

  describe('FocusRing', () => {
    it('renders children with focus ring styles', () => {
      render(
        <FocusRing>
          <button>Test button</button>
        </FocusRing>
      )
      
      const wrapper = screen.getByRole('button').parentElement
      expect(wrapper).toHaveClass('focus-within:ring-2')
    })

    it('accepts custom className', () => {
      render(
        <FocusRing className="custom">
          <button>Test</button>
        </FocusRing>
      )
      
      const wrapper = screen.getByRole('button').parentElement
      expect(wrapper).toHaveClass('custom')
    })
  })

  describe('ErrorMessage', () => {
    it('renders error message with proper ARIA attributes', () => {
      render(<ErrorMessage id="error-1">Field is required</ErrorMessage>)
      
      const error = screen.getByText('Field is required')
      expect(error).toHaveAttribute('id', 'error-1')
      expect(error).toHaveAttribute('role', 'alert')
      expect(error).toHaveAttribute('aria-live', 'assertive')
    })

    it('includes error icon', () => {
      render(<ErrorMessage id="error-1">Error occurred</ErrorMessage>)
      
      expect(screen.getByText('!')).toBeInTheDocument()
    })

    it('should have no accessibility violations', async () => {
      const { container } = render(<ErrorMessage id="error-1">Error</ErrorMessage>)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Heading', () => {
    it('renders correct heading level', () => {
      render(<Heading level={2}>Test Heading</Heading>)
      
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
    })

    it('accepts custom id and className', () => {
      render(
        <Heading level={1} id="main-title" className="custom-class">
          Main Title
        </Heading>
      )
      
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveAttribute('id', 'main-title')
      expect(heading).toHaveClass('custom-class')
    })

    it('applies default styles', () => {
      render(<Heading level={3}>Title</Heading>)
      
      expect(screen.getByRole('heading')).toHaveClass('font-semibold')
    })
  })

  describe('AccessibleButton', () => {
    it('renders with default variant and size', () => {
      render(<AccessibleButton>Click me</AccessibleButton>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-blue-600')
      expect(button).toHaveClass('px-4 py-2')
    })

    it('shows loading state', () => {
      render(
        <AccessibleButton loading loadingText="Processing...">
          Submit
        </AccessibleButton>
      )
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-busy', 'true')
      expect(button).toBeDisabled()
      // Check for loading text in screen reader only span
      expect(screen.getByText('Processing...', { selector: '.sr-only' })).toBeInTheDocument()
    })

    it('applies variant styles', () => {
      render(<AccessibleButton variant="danger">Delete</AccessibleButton>)
      
      expect(screen.getByRole('button')).toHaveClass('bg-red-600')
    })

    it('handles click events', () => {
      const handleClick = jest.fn()
      render(<AccessibleButton onClick={handleClick}>Click</AccessibleButton>)
      
      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should have no accessibility violations', async () => {
      const { container } = render(<AccessibleButton>Test</AccessibleButton>)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Modal', () => {
    const defaultProps = {
      isOpen: true,
      onClose: jest.fn(),
      title: 'Test Modal'
    }

    beforeEach(() => {
      // Mock body scroll lock
      document.body.style.overflow = ''
    })

    it('renders when open', () => {
      render(<Modal {...defaultProps}>Modal content</Modal>)
      
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Test Modal')).toBeInTheDocument()
      expect(screen.getByText('Modal content')).toBeInTheDocument()
    })

    it('does not render when closed', () => {
      render(<Modal {...defaultProps} isOpen={false}>Content</Modal>)
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('locks body scroll when open', () => {
      render(<Modal {...defaultProps}>Content</Modal>)
      
      expect(document.body.style.overflow).toBe('hidden')
    })

    it('calls onClose when backdrop is clicked', () => {
      const onClose = jest.fn()
      render(<Modal {...defaultProps} onClose={onClose}>Content</Modal>)
      
      // Click the backdrop (first div in the modal)
      const modal = screen.getByRole('dialog')
      const backdrop = modal.firstElementChild as HTMLElement
      fireEvent.click(backdrop)
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when close button is clicked', () => {
      const onClose = jest.fn()
      render(<Modal {...defaultProps} onClose={onClose}>Content</Modal>)
      
      // Find the close button by its role and aria-label
      const closeButton = screen.getByRole('button', { name: /close modal/i })
      fireEvent.click(closeButton)
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when Escape is pressed', () => {
      const onClose = jest.fn()
      render(<Modal {...defaultProps} onClose={onClose}>Content</Modal>)
      
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should have no accessibility violations', async () => {
      const { container } = render(<Modal {...defaultProps}>Content</Modal>)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('FormField', () => {
    it('renders label and input with proper association', () => {
      render(
        <FormField label="Email Address" id="email" required>
          <input type="email" aria-label="Email Address" />
        </FormField>
      )
      
      const label = screen.getByText('Email Address')
      const input = screen.getByRole('textbox')
      
      expect(label).toHaveAttribute('for', 'email')
      expect(input).toHaveAttribute('id', 'email')
      expect(input).toHaveAttribute('aria-required', 'true')
    })

    it('shows error message when provided', () => {
      render(
        <FormField label="Password" id="password" error="Password is required">
          <input type="password" aria-label="Password" />
        </FormField>
      )
      
      const input = screen.getByLabelText('Password')
      const errorMessage = screen.getByText('Password is required')
      
      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(input).toHaveAttribute('aria-describedby', 'password-error')
      expect(errorMessage).toHaveAttribute('id', 'password-error')
    })

    it('shows help text when provided', () => {
      render(
        <FormField 
          label="Username" 
          id="username" 
          description="Must be at least 3 characters"
        >
          <input type="text" aria-label="Username" />
        </FormField>
      )
      
      const input = screen.getByLabelText('Username')
      const helpText = screen.getByText('Must be at least 3 characters')
      
      expect(input).toHaveAttribute('aria-describedby', 'username-description')
      expect(helpText).toHaveAttribute('id', 'username-description')
    })

    it('combines help text and error message descriptors', () => {
      render(
        <FormField 
          label="Email" 
          id="email" 
          description="We'll never share your email"
          error="Invalid email format"
        >
          <input type="email" aria-label="Email" />
        </FormField>
      )
      
      const input = screen.getByLabelText('Email')
      expect(input).toHaveAttribute('aria-describedby', 'email-description email-error')
    })

    it('should have no accessibility violations', async () => {
      const { container } = render(
        <FormField label="Test" id="test">
          <input type="text" aria-label="Test" />
        </FormField>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})