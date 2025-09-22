/**
 * Accessibility Utilities and Hooks
 * 
 * Comprehensive utilities for implementing WCAG-compliant accessibility features.
 * Includes keyboard navigation, focus management, screen reader support, and ARIA helpers.
 */

import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * Hook for managing focus within a component or modal
 * Automatically traps focus and restores it when component unmounts
 */
export function useFocusTrap(isActive = true) {
  const containerRef = useRef<HTMLElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    // Store the currently focused element
    previousActiveElement.current = document.activeElement as HTMLElement

    // Get all focusable elements within the container
    const getFocusableElements = () => {
      if (!containerRef.current) return []
      
      const focusableSelectors = [
        'button:not([disabled])',
        'input:not([disabled])',
        'textarea:not([disabled])',
        'select:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]'
      ].join(', ')

      return Array.from(containerRef.current.querySelectorAll(focusableSelectors)) as HTMLElement[]
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      const focusableElements = getFocusableElements()
      if (focusableElements.length === 0) return

      const firstFocusable = focusableElements[0]
      const lastFocusable = focusableElements[focusableElements.length - 1]

      if (event.shiftKey) {
        // Shift + Tab: moving backwards
        if (document.activeElement === firstFocusable) {
          event.preventDefault()
          lastFocusable.focus()
        }
      } else {
        // Tab: moving forwards
        if (document.activeElement === lastFocusable) {
          event.preventDefault()
          firstFocusable.focus()
        }
      }
    }

    // Focus the first focusable element
    const focusableElements = getFocusableElements()
    if (focusableElements.length > 0) {
      focusableElements[0].focus()
    }

    // Add event listener
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      
      // Restore focus to the previously active element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus()
      }
    }
  }, [isActive])

  return containerRef
}

/**
 * Hook for managing live regions for screen reader announcements
 */
export function useLiveRegion() {
  const [announcement, setAnnouncement] = useState('')
  const [politeness, setPoliteness] = useState<'polite' | 'assertive'>('polite')

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setPoliteness(priority)
    setAnnouncement(message)
    
    // Clear the announcement after a short delay to allow for re-announcements
    setTimeout(() => setAnnouncement(''), 100)
  }, [])

  return {
    announcement,
    politeness,
    announce
  }
}

/**
 * Hook for keyboard navigation within lists or grids
 */
export function useKeyboardNavigation(
  itemCount: number,
  options: {
    orientation?: 'horizontal' | 'vertical' | 'grid'
    columnsCount?: number
    loop?: boolean
    initialIndex?: number
  } = {}
) {
  const {
    orientation = 'vertical',
    columnsCount = 1,
    loop = true,
    initialIndex = 0
  } = options

  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const containerRef = useRef<HTMLElement>(null)

  const getNextIndex = useCallback((currentIndex: number, direction: 'up' | 'down' | 'left' | 'right') => {
    if (orientation === 'horizontal') {
      if (direction === 'left') {
        return currentIndex > 0 ? currentIndex - 1 : loop ? itemCount - 1 : currentIndex
      }
      if (direction === 'right') {
        return currentIndex < itemCount - 1 ? currentIndex + 1 : loop ? 0 : currentIndex
      }
      return currentIndex
    }

    if (orientation === 'vertical') {
      if (direction === 'up') {
        return currentIndex > 0 ? currentIndex - 1 : loop ? itemCount - 1 : currentIndex
      }
      if (direction === 'down') {
        return currentIndex < itemCount - 1 ? currentIndex + 1 : loop ? 0 : currentIndex
      }
      return currentIndex
    }

    if (orientation === 'grid') {
      const row = Math.floor(currentIndex / columnsCount)
      const col = currentIndex % columnsCount
      const totalRows = Math.ceil(itemCount / columnsCount)

      switch (direction) {
        case 'up': {
          const newRow = row > 0 ? row - 1 : loop ? totalRows - 1 : row
          const newIndex = newRow * columnsCount + col
          return newIndex < itemCount ? newIndex : itemCount - 1
        }
        case 'down': {
          const newRow = row < totalRows - 1 ? row + 1 : loop ? 0 : row
          const newIndex = newRow * columnsCount + col
          return newIndex < itemCount ? newIndex : currentIndex
        }
        case 'left': {
          return col > 0 ? currentIndex - 1 : loop ? currentIndex + (columnsCount - 1) : currentIndex
        }
        case 'right': {
          return col < columnsCount - 1 && currentIndex < itemCount - 1 
            ? currentIndex + 1 
            : loop ? currentIndex - col : currentIndex
        }
        default:
          return currentIndex
      }
    }

    return currentIndex
  }, [itemCount, orientation, columnsCount, loop])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    let direction: 'up' | 'down' | 'left' | 'right' | null = null

    switch (event.key) {
      case 'ArrowUp':
        direction = 'up'
        break
      case 'ArrowDown':
        direction = 'down'
        break
      case 'ArrowLeft':
        direction = 'left'
        break
      case 'ArrowRight':
        direction = 'right'
        break
      case 'Home':
        event.preventDefault()
        setActiveIndex(0)
        return
      case 'End':
        event.preventDefault()
        setActiveIndex(itemCount - 1)
        return
      default:
        return
    }

    if (direction) {
      event.preventDefault()
      const nextIndex = getNextIndex(activeIndex, direction)
      setActiveIndex(nextIndex)
    }
  }, [activeIndex, getNextIndex, itemCount])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return {
    activeIndex,
    setActiveIndex,
    containerRef,
    containerProps: {
      ref: containerRef,
      onKeyDown: handleKeyDown,
      role: orientation === 'grid' ? 'grid' : 'listbox',
      'aria-activedescendant': `item-${activeIndex}`,
      tabIndex: 0
    }
  }
}

/**
 * Hook for managing reduced motion preferences
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

/**
 * Hook for managing color scheme preferences and high contrast
 */
export function useColorSchemePreferences() {
  const [colorScheme, setColorScheme] = useState<'light' | 'dark' | 'auto'>('auto')
  const [highContrast, setHighContrast] = useState(false)

  useEffect(() => {
    // Check for high contrast preference
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)')
    setHighContrast(highContrastQuery.matches)

    const handleHighContrastChange = (event: MediaQueryListEvent) => {
      setHighContrast(event.matches)
    }

    highContrastQuery.addEventListener('change', handleHighContrastChange)

    // Check for dark mode preference
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleColorSchemeChange = () => {
      if (colorScheme === 'auto') {
        document.documentElement.classList.toggle('dark', darkModeQuery.matches)
      }
    }

    handleColorSchemeChange()
    darkModeQuery.addEventListener('change', handleColorSchemeChange)

    return () => {
      highContrastQuery.removeEventListener('change', handleHighContrastChange)
      darkModeQuery.removeEventListener('change', handleColorSchemeChange)
    }
  }, [colorScheme])

  const setColorSchemeManually = useCallback((scheme: 'light' | 'dark' | 'auto') => {
    setColorScheme(scheme)
    
    if (scheme === 'light') {
      document.documentElement.classList.remove('dark')
    } else if (scheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      // Auto mode - follow system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.classList.toggle('dark', prefersDark)
    }
  }, [])

  return {
    colorScheme,
    highContrast,
    setColorScheme: setColorSchemeManually
  }
}

/**
 * Hook for skip links functionality
 */
export function useSkipLinks() {
  const skipToContent = useCallback((targetId: string) => {
    const target = document.getElementById(targetId)
    if (target) {
      target.focus()
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  return { skipToContent }
}

/**
 * Utility functions for ARIA attributes and screen reader helpers
 */
export const ariaHelpers = {
  /**
   * Generate a unique ID for ARIA relationships
   */
  generateId: (prefix = 'aria') => `${prefix}-${Math.random().toString(36).substr(2, 9)}`,

  /**
   * Create ARIA description for form fields
   */
  describedBy: (description: string, errorMessage?: string) => {
    const parts = [description]
    if (errorMessage) parts.push(errorMessage)
    return parts.join('. ')
  },

  /**
   * Format numbers for screen readers
   */
  formatNumberForScreenReader: (num: number, context?: string) => {
    const formatted = num.toLocaleString()
    return context ? `${formatted} ${context}` : formatted
  },

  /**
   * Create accessible labels for interactive elements
   */
  createLabel: (action: string, target: string, state?: string) => {
    const parts = [action, target]
    if (state) parts.push(`(${state})`)
    return parts.join(' ')
  },

  /**
   * Format time for screen readers
   */
  formatTimeForScreenReader: (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

/**
 * Utility for managing focus restoration
 */
export class FocusManager {
  private static focusStack: HTMLElement[] = []

  static pushFocus(element: HTMLElement) {
    this.focusStack.push(element)
  }

  static popFocus() {
    const element = this.focusStack.pop()
    if (element && document.contains(element)) {
      element.focus()
    }
  }

  static clearFocusStack() {
    this.focusStack = []
  }
}

/**
 * Custom hook for accessible form validation
 */
export function useAccessibleForm() {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const addError = useCallback((fieldName: string, errorMessage: string) => {
    setErrors(prev => ({ ...prev, [fieldName]: errorMessage }))
  }, [])

  const removeError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[fieldName]
      return newErrors
    })
  }, [])

  const touchField = useCallback((fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }))
  }, [])

  const getFieldProps = useCallback((fieldName: string) => {
    const hasError = errors[fieldName] && touched[fieldName]
    const errorId = hasError ? `${fieldName}-error` : undefined
    const describedBy = hasError ? errorId : undefined

    return {
      'aria-invalid': hasError ? 'true' : 'false',
      'aria-describedby': describedBy,
      onBlur: () => touchField(fieldName)
    }
  }, [errors, touched, touchField])

  const getErrorProps = useCallback((fieldName: string) => {
    const hasError = errors[fieldName] && touched[fieldName]
    
    return {
      id: `${fieldName}-error`,
      role: 'alert',
      'aria-live': 'polite',
      className: hasError ? 'error-message' : 'error-message hidden'
    }
  }, [errors, touched])

  return {
    errors,
    touched,
    addError,
    removeError,
    touchField,
    getFieldProps,
    getErrorProps,
    hasErrors: Object.keys(errors).length > 0
  }
}

/**
 * Hook for accessible disclosure/collapsible content
 */
export function useDisclosure(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen)
  const triggerId = ariaHelpers.generateId('disclosure-trigger')
  const contentId = ariaHelpers.generateId('disclosure-content')

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  const open = useCallback(() => {
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  const triggerProps = {
    id: triggerId,
    'aria-expanded': isOpen,
    'aria-controls': contentId,
    onClick: toggle
  }

  const contentProps = {
    id: contentId,
    'aria-labelledby': triggerId,
    hidden: !isOpen
  }

  return {
    isOpen,
    toggle,
    open,
    close,
    triggerProps,
    contentProps
  }
}