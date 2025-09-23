/**
 * QR Code Service
 * 
 * Handles QR code generation for poll sharing and access.
 * Provides functionality to generate QR codes with customizable options
 * and different output formats (data URL, canvas, SVG).
 */

import QRCode from 'qrcode'
import type { 
  QRCodeToDataURLOptions, 
  QRCodeRenderersOptions,
  QRCodeToStringOptions 
} from 'qrcode'

/**
 * QR Code generation options
 */
export interface QRCodeOptions {
  /** Size of the QR code in pixels */
  width?: number
  /** Error correction level */
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  /** Type of QR code */
  type?: 'image/png' | 'image/jpeg' | 'image/webp'
  /** Quality for JPEG (0-1) */
  quality?: number
  /** Margin around QR code */
  margin?: number
  /** Color options */
  color?: {
    /** Foreground color (dark modules) */
    dark?: string
    /** Background color (light modules) */
    light?: string
  }
  /** Scale factor for higher resolution */
  scale?: number
}

/**
 * Default QR code options
 */
const DEFAULT_OPTIONS: Required<QRCodeOptions> = {
  width: 256,
  errorCorrectionLevel: 'M',
  type: 'image/png',
  quality: 0.92,
  margin: 4,
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  },
  scale: 4
}

/**
 * QR Code generation and management service
 */
export class QRCodeService {
  /**
   * Generate a QR code data URL for a given text/URL
   */
  static async generateDataURL(
    text: string, 
    options: QRCodeOptions = {}
  ): Promise<string> {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options }
    
    try {
      // Build options object compatible with qrcode library
      const qrOptions: QRCodeToDataURLOptions = {
        width: mergedOptions.width,
        errorCorrectionLevel: mergedOptions.errorCorrectionLevel,
        margin: mergedOptions.margin,
        color: mergedOptions.color,
        scale: mergedOptions.scale,
        type: mergedOptions.type
      }

      // Add quality for JPEG/WebP formats
      if (mergedOptions.type === 'image/jpeg' || mergedOptions.type === 'image/webp') {
        (qrOptions as Record<string, unknown>).rendererOpts = {
          quality: mergedOptions.quality
        }
      }

      const dataURL = await QRCode.toDataURL(text, qrOptions)
      
      return dataURL
    } catch (error) {
      console.error('Failed to generate QR code:', error)
      throw new Error(`QR code generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate a QR code as Canvas element
   */
  static async generateCanvas(
    text: string,
    options: QRCodeOptions = {}
  ): Promise<HTMLCanvasElement> {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options }
    
    try {
      const qrOptions: QRCodeRenderersOptions = {
        width: mergedOptions.width,
        errorCorrectionLevel: mergedOptions.errorCorrectionLevel,
        margin: mergedOptions.margin,
        color: mergedOptions.color,
        scale: mergedOptions.scale
      }
      
      const canvas = await QRCode.toCanvas(text, qrOptions)
      
      return canvas
    } catch (error) {
      console.error('Failed to generate QR code canvas:', error)
      throw new Error(`QR code canvas generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate a QR code as SVG string
   */
  static async generateSVG(
    text: string,
    options: QRCodeOptions = {}
  ): Promise<string> {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options }
    
    try {
      const qrOptions: QRCodeToStringOptions = {
        type: 'svg',
        width: mergedOptions.width,
        errorCorrectionLevel: mergedOptions.errorCorrectionLevel,
        margin: mergedOptions.margin,
        color: mergedOptions.color
      }
      
      const svg = await QRCode.toString(text, qrOptions)
      
      return svg
    } catch (error) {
      console.error('Failed to generate QR code SVG:', error)
      throw new Error(`QR code SVG generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate poll URL for QR code
   */
  static generatePollURL(pollId: string, baseUrl?: string): string {
    const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://polling-station.app')
    return `${base}/polls/${pollId}`
  }

  /**
   * Generate poll QR code with poll-specific optimizations
   */
  static async generatePollQRCode(
    pollId: string,
    options: QRCodeOptions & { baseUrl?: string } = {}
  ): Promise<string> {
    const { baseUrl, ...qrOptions } = options
    const pollURL = this.generatePollURL(pollId, baseUrl)
    
    // Use higher error correction for poll QR codes
    const pollSpecificOptions: QRCodeOptions = {
      errorCorrectionLevel: 'H', // Higher error correction for better reliability
      ...qrOptions
    }
    
    return this.generateDataURL(pollURL, pollSpecificOptions)
  }

  /**
   * Download QR code as image file
   */
  static downloadQRCode(dataURL: string, filename: string = 'qr-code.png'): void {
    try {
      const link = document.createElement('a')
      link.download = filename
      link.href = dataURL
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Failed to download QR code:', error)
      throw new Error(`QR code download failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Copy QR code data URL to clipboard
   */
  static async copyQRCodeToClipboard(dataURL: string): Promise<void> {
    try {
      // Convert data URL to blob
      const response = await fetch(dataURL)
      const blob = await response.blob()
      
      // Create clipboard item
      const clipboardItem = new ClipboardItem({
        [blob.type]: blob
      })
      
      // Copy to clipboard
      await navigator.clipboard.write([clipboardItem])
    } catch (error) {
      console.error('Failed to copy QR code to clipboard:', error)
      
      // Fallback: copy the data URL as text
      try {
        await navigator.clipboard.writeText(dataURL)
      } catch (fallbackError) {
        console.error('Fallback clipboard copy also failed:', fallbackError)
        throw new Error('Failed to copy QR code to clipboard')
      }
    }
  }

  /**
   * Validate QR code text length and content
   */
  static validateQRText(text: string): { isValid: boolean; error?: string } {
    if (!text || text.trim().length === 0) {
      return { isValid: false, error: 'Text cannot be empty' }
    }

    if (text.length > 2953) { // Max capacity for alphanumeric with error correction L
      return { isValid: false, error: 'Text is too long for QR code generation' }
    }

    return { isValid: true }
  }

  /**
   * Get recommended QR code size based on content and usage
   */
  static getRecommendedSize(text: string, usage: 'web' | 'print' | 'mobile' = 'web'): number {
    const baseSize = text.length < 100 ? 128 : text.length < 500 ? 256 : 512
    
    switch (usage) {
      case 'print':
        return Math.max(baseSize * 2, 512) // Higher resolution for print
      case 'mobile':
        return Math.max(baseSize, 200) // Ensure it's large enough for mobile scanning
      case 'web':
      default:
        return baseSize
    }
  }

  /**
   * Generate QR code with automatic size optimization
   */
  static async generateOptimizedQRCode(
    text: string,
    usage: 'web' | 'print' | 'mobile' = 'web',
    customOptions: QRCodeOptions = {}
  ): Promise<string> {
    const validation = this.validateQRText(text)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    const recommendedSize = this.getRecommendedSize(text, usage)
    const options: QRCodeOptions = {
      width: recommendedSize,
      errorCorrectionLevel: usage === 'print' ? 'H' : 'M',
      ...customOptions
    }

    return this.generateDataURL(text, options)
  }
}

/**
 * Hook for QR code generation in React components
 */
export function useQRCode() {
  const generateQRCode = async (
    text: string, 
    options?: QRCodeOptions
  ): Promise<string> => {
    return QRCodeService.generateDataURL(text, options)
  }

  const generatePollQRCode = async (
    pollId: string,
    options?: QRCodeOptions & { baseUrl?: string }
  ): Promise<string> => {
    return QRCodeService.generatePollQRCode(pollId, options)
  }

  const downloadQRCode = (dataURL: string, filename?: string): void => {
    QRCodeService.downloadQRCode(dataURL, filename)
  }

  const copyToClipboard = async (dataURL: string): Promise<void> => {
    return QRCodeService.copyQRCodeToClipboard(dataURL)
  }

  return {
    generateQRCode,
    generatePollQRCode,
    downloadQRCode,
    copyToClipboard,
    validateText: QRCodeService.validateQRText,
    getRecommendedSize: QRCodeService.getRecommendedSize
  }
}

/**
 * Error types for QR code operations
 */
export class QRCodeError extends Error {
  constructor(
    message: string,
    public code: 'GENERATION_FAILED' | 'INVALID_TEXT' | 'DOWNLOAD_FAILED' | 'CLIPBOARD_FAILED',
    public originalError?: Error
  ) {
    super(message)
    this.name = 'QRCodeError'
  }
}

/**
 * QR code generation utilities
 */
export const qrCodeUtils = {
  /**
   * Create filename for QR code download
   */
  createFilename(pollId?: string, title?: string): string {
    const timestamp = new Date().toISOString().split('T')[0]
    if (pollId && title) {
      const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
      return `poll-${pollId}-${sanitizedTitle}-qr-${timestamp}.png`
    }
    return `qr-code-${timestamp}.png`
  },

  /**
   * Check if QR codes are supported in current environment
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'HTMLCanvasElement' in window
  },

  /**
   * Get QR code color schemes
   */
  getColorSchemes(): Record<string, { dark: string; light: string }> {
    return {
      default: { dark: '#000000', light: '#FFFFFF' },
      blue: { dark: '#1e40af', light: '#dbeafe' },
      green: { dark: '#166534', light: '#dcfce7' },
      purple: { dark: '#7c3aed', light: '#f3e8ff' },
      red: { dark: '#dc2626', light: '#fee2e2' },
      gradient: { dark: '#4338ca', light: '#e0e7ff' }
    }
  }
}

export default QRCodeService