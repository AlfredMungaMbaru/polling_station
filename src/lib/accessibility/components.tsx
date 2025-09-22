/**
 * Accessible React Components
 * 
 * Reusable components that implement accessibility best practices.
 */

import React from 'react'
import { 
  useKeyboardNavigation, 
  useFocusTrap, 
  useSkipLinks, 
  ariaHelpers 
} from './index'

/**
 * Live region component for screen reader announcements
 */
interface LiveRegionProps {
  announcement: string
  politeness?: 'polite' | 'assertive'
  className?: string
}

export function LiveRegion({ announcement, politeness = 'polite', className = 'sr-only' }: LiveRegionProps) {
  const ariaLiveProps = politeness === 'assertive' 
    ? { 'aria-live': 'assertive' as const } 
    : { 'aria-live': 'polite' as const }
    
  return (
    <div
      role="status"
      {...ariaLiveProps}
      aria-atomic="true"
      className={className}
      data-testid="live-region"
    >
      {announcement}
    </div>
  )
}

/**
 * Skip link component for keyboard navigation
 */
interface SkipLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

export function SkipLink({ href, children, className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded' }: SkipLinkProps) {
  const { skipToContent } = useSkipLinks()

  return (
    <a
      href={href}
      className={className}
      onClick={(e) => {
        e.preventDefault()
        skipToContent(href.replace('#', ''))
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          skipToContent(href.replace('#', ''))
        }
      }}
    >
      {children}
    </a>
  )
}

/**
 * Visually hidden component for screen reader only content
 */
interface VisuallyHiddenProps {
  children: React.ReactNode
}

export function VisuallyHidden({ children }: VisuallyHiddenProps) {
  return <span className="sr-only">{children}</span>
}

/**
 * Focus visible indicator component
 */
interface FocusRingProps {
  children: React.ReactNode
  within?: boolean
  className?: string
}

export function FocusRing({ children, within = true, className = '' }: FocusRingProps) {
  const focusClass = within ? 'focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2' : 'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
  
  return (
    <div className={`${focusClass} ${className}`.trim()}>
      {children}
    </div>
  )
}

/**
 * Accessible error message component
 */
interface ErrorMessageProps {
  id: string
  children: React.ReactNode
  visible?: boolean
  className?: string
}

export function ErrorMessage({ id, children, visible = true, className = 'text-red-600 text-sm mt-1' }: ErrorMessageProps) {
  if (!visible) return null

  const ariaLiveProps = { 'aria-live': 'assertive' as const }
  
  return (
    <div
      id={id}
      role="alert"
      {...ariaLiveProps}
      className={`flex items-center gap-1 ${className}`.trim()}
    >
      <span 
        className="flex-shrink-0 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold"
        aria-hidden="true"
      >
        !
      </span>
      {children}
    </div>
  )
}

/**
 * Accessible heading component with proper hierarchy
 */
interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6
  children: React.ReactNode
  className?: string
  id?: string
}

export function Heading({ level, children, id, className = 'font-semibold text-gray-900' }: HeadingProps) {
  const headingProps = { id, className }
  
  switch (level) {
    case 1:
      return <h1 {...headingProps}>{children}</h1>
    case 2:
      return <h2 {...headingProps}>{children}</h2>
    case 3:
      return <h3 {...headingProps}>{children}</h3>
    case 4:
      return <h4 {...headingProps}>{children}</h4>
    case 5:
      return <h5 {...headingProps}>{children}</h5>
    case 6:
      return <h6 {...headingProps}>{children}</h6>
    default:
      return <h1 {...headingProps}>{children}</h1>
  }
}

/**
 * Accessible button component with loading and disabled states
 */
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  loadingText?: string
  children: React.ReactNode
}

export function AccessibleButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText = 'Loading...',
  disabled,
  children,
  className = '',
  ...props
}: AccessibleButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }
  
  const isDisabled = disabled || loading
  
  return (
    <button
      {...props}
      disabled={isDisabled}
      {...(loading ? { 'aria-busy': 'true' } : {})}
                aria-describedby={loading ? `${props.id || 'button'}-loading` : props['aria-describedby']}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim()}
    >
      {loading && (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="sr-only">{loadingText}</span>
        </>
      )}
      {loading ? null : children}
    </button>
  )
}

/**
 * Accessible modal/dialog component
 */
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
}

let modalIdCounter = 0

export function Modal({ isOpen, onClose, title, children, className = '' }: ModalProps) {
  const titleId = React.useMemo(() => `modal-title-${++modalIdCounter}`, [])
  
  React.useEffect(() => {
    if (isOpen) {
      // Prevent background scrolling
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen])

  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className={`bg-white rounded-lg shadow-xl max-w-md w-full p-6 ${className}`}>
          <div className="flex items-center justify-between mb-4">
            <Heading level={2} id={titleId} className="text-lg font-semibold">
              {title}
            </Heading>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
              aria-label="Close modal"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div>{children}</div>
        </div>
      </div>
    </div>
  )
}

/**
 * Accessible form field component
 */
interface FormFieldProps {
  label: string
  id: string
  error?: string
  description?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export function FormField({
  label,
  id,
  error,
  description,
  required = false,
  children,
  className = ''
}: FormFieldProps) {
  const errorId = error ? `${id}-error` : undefined
  const descriptionId = description ? `${id}-description` : undefined
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ')

  return (
    <div className={`space-y-1 ${className}`}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      
      {description && (
        <p id={descriptionId} className="text-sm text-gray-600">
          {description}
        </p>
      )}
      
      {React.isValidElement(children) &&
        React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
          id,
          'aria-describedby': describedBy || undefined,
          'aria-invalid': error ? 'true' : 'false',
          'aria-required': required
        })
      }
      
      {error && (
        <ErrorMessage id={errorId!} visible>
          {error}
        </ErrorMessage>
      )}
    </div>
  )
}