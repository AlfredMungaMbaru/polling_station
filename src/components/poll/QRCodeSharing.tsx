/**
 * QR Code Sharing Component
 * 
 * A compact component for displaying QR codes for poll sharing.
 * Includes expandable QR code generator with customization options.
 */

'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { QRCodeGenerator } from '@/components/qr/QRCodeGenerator'
import { useQRCode, qrCodeUtils } from '@/lib/qrCodeService'
import { Poll } from '@/data/mockPolls'
import { 
  QrCode, 
  Share2, 
  Download, 
  Copy, 
  ExternalLink,
  Smartphone,
  X 
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Simple dropdown/popup replacement
 */
interface DropdownProps {
  trigger: React.ReactNode
  children: React.ReactNode
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

function SimpleDropdown({ trigger, children, isOpen, onOpenChange }: DropdownProps) {
  return (
    <div className="relative">
      <div onClick={() => onOpenChange(!isOpen)}>
        {trigger}
      </div>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Share Poll</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {children}
        </div>
      )}
    </div>
  )
}

/**
 * Props for QR Code Sharing component
 */
export interface QRCodeSharingProps {
  /** Poll data for generating QR codes */
  poll: Poll
  /** Component size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Show as inline or popup */
  variant?: 'inline' | 'popup' | 'compact'
  /** Custom CSS class */
  className?: string
  /** Show download/copy buttons */
  showActions?: boolean
  /** Custom base URL for QR code generation */
  baseUrl?: string
}

/**
 * Compact QR Code display with sharing options
 */
export function QRCodeSharing({
  poll,
  size = 'md',
  variant = 'popup',
  className,
  showActions = true,
  baseUrl
}: QRCodeSharingProps) {
  const { generatePollQRCode, copyToClipboard, downloadQRCode } = useQRCode()
  const [qrCodeDataURL, setQRCodeDataURL] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string>('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Generate QR code
  const handleGenerateQRCode = useCallback(async () => {
    if (qrCodeDataURL) return // Already generated

    setIsGenerating(true)
    setError('')

    try {
      const dataURL = await generatePollQRCode(poll.id, {
        width: 256,
        errorCorrectionLevel: 'H', // High error correction for better scanning
        baseUrl
      })
      setQRCodeDataURL(dataURL)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate QR code')
    } finally {
      setIsGenerating(false)
    }
  }, [poll.id, generatePollQRCode, qrCodeDataURL, baseUrl])

  // Handle copy to clipboard
  const handleCopy = useCallback(async () => {
    if (!qrCodeDataURL) return

    try {
      await copyToClipboard(qrCodeDataURL)
      // Simple notification - in production, use toast
      alert('QR code copied to clipboard!')
    } catch (err) {
      alert('Failed to copy QR code')
    }
  }, [qrCodeDataURL, copyToClipboard])

  // Handle download
  const handleDownload = useCallback(() => {
    if (!qrCodeDataURL) return

    const filename = qrCodeUtils.createFilename(poll.id, poll.question)
    downloadQRCode(qrCodeDataURL, filename)
  }, [qrCodeDataURL, poll.id, poll.question, downloadQRCode])

  // Handle share URL copy
  const handleShareUrl = useCallback(async () => {
    const pollUrl = `${window.location.origin}/polls/${poll.id}`
    try {
      await navigator.clipboard.writeText(pollUrl)
      alert('Poll URL copied to clipboard!')
    } catch (err) {
      alert('Failed to copy URL')
    }
  }, [poll.id])

  // Size classes
  const sizeClasses = {
    sm: 'h-24 w-24',
    md: 'h-32 w-32',
    lg: 'h-40 w-40'
  }

  // Render compact variant (just a button)
  if (variant === 'compact') {
    return (
      <SimpleDropdown
        isOpen={isDropdownOpen}
        onOpenChange={setIsDropdownOpen}
        trigger={
          <Button
            variant="outline"
            size="sm"
            className={cn('flex items-center gap-2', className)}
            onClick={handleGenerateQRCode}
          >
            <QrCode className="h-4 w-4" />
            QR Code
          </Button>
        }
      >
        <QRCodeGeneratorPopup 
          poll={poll}
          qrCodeDataURL={qrCodeDataURL}
          isGenerating={isGenerating}
          error={error}
          onCopy={handleCopy}
          onDownload={handleDownload}
          onShareUrl={handleShareUrl}
          showActions={showActions}
        />
      </SimpleDropdown>
    )
  }

  // Render inline variant
  if (variant === 'inline') {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                <span className="font-medium">Share this poll</span>
              </div>
              {showActions && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShareUrl}
                    className="flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    URL
                  </Button>
                </div>
              )}
            </div>
            
            <QRCodeDisplay
              poll={poll}
              qrCodeDataURL={qrCodeDataURL}
              isGenerating={isGenerating}
              error={error}
              size={size}
              onGenerate={handleGenerateQRCode}
              onCopy={handleCopy}
              onDownload={handleDownload}
              showActions={showActions}
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render popup variant (default)
  return (
    <SimpleDropdown
      isOpen={isDropdownOpen}
      onOpenChange={setIsDropdownOpen}
      trigger={
        <Button
          variant="outline"
          className={cn('flex items-center gap-2', className)}
          onClick={handleGenerateQRCode}
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      }
    >
      <QRCodeGeneratorPopup 
        poll={poll}
        qrCodeDataURL={qrCodeDataURL}
        isGenerating={isGenerating}
        error={error}
        onCopy={handleCopy}
        onDownload={handleDownload}
        onShareUrl={handleShareUrl}
        showActions={showActions}
      />
    </SimpleDropdown>
  )
}

/**
 * QR Code display component
 */
interface QRCodeDisplayProps {
  poll: Poll
  qrCodeDataURL: string
  isGenerating: boolean
  error: string
  size: 'sm' | 'md' | 'lg'
  onGenerate: () => void
  onCopy: () => void
  onDownload: () => void
  showActions: boolean
}

function QRCodeDisplay({
  poll,
  qrCodeDataURL,
  isGenerating,
  error,
  size,
  onGenerate,
  onCopy,
  onDownload,
  showActions
}: QRCodeDisplayProps) {
  const sizeClasses = {
    sm: 'h-24 w-24',
    md: 'h-32 w-32',
    lg: 'h-40 w-40'
  }

  return (
    <div className="space-y-3">
      {/* QR Code Image */}
      <div className="flex justify-center">
        <div className={cn(
          'border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center',
          sizeClasses[size]
        )}>
          {isGenerating ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          ) : error ? (
            <div className="text-center text-sm text-red-500 p-2">
              <QrCode className="h-6 w-6 mx-auto mb-1 opacity-50" />
              <p>Error generating QR code</p>
            </div>
          ) : qrCodeDataURL ? (
            <img
              src={qrCodeDataURL}
              alt={`QR code for poll: ${poll.question}`}
              className="rounded border"
              width={size === 'sm' ? 96 : size === 'md' ? 128 : 160}
              height={size === 'sm' ? 96 : size === 'md' ? 128 : 160}
            />
          ) : (
            <Button
              variant="ghost"
              onClick={onGenerate}
              className="h-full w-full flex-col gap-2"
            >
              <QrCode className="h-6 w-6" />
              <span className="text-xs">Generate</span>
            </Button>
          )}
        </div>
      </div>

      {/* Actions */}
      {showActions && qrCodeDataURL && (
        <div className="flex gap-2 justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onCopy}
            className="flex items-center gap-1"
          >
            <Copy className="h-3 w-3" />
            Copy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDownload}
            className="flex items-center gap-1"
          >
            <Download className="h-3 w-3" />
            Save
          </Button>
        </div>
      )}

      {/* Info */}
      <div className="text-center">
        <Badge variant="secondary" className="text-xs">
          <Smartphone className="h-3 w-3 mr-1" />
          Scan to view poll
        </Badge>
      </div>
    </div>
  )
}

/**
 * QR Code Generator Popup component
 */
interface QRCodeGeneratorPopupProps {
  poll: Poll
  qrCodeDataURL: string
  isGenerating: boolean
  error: string
  onCopy: () => void
  onDownload: () => void
  onShareUrl: () => void
  showActions: boolean
}

function QRCodeGeneratorPopup({
  poll,
  qrCodeDataURL,
  isGenerating,
  error,
  onCopy,
  onDownload,
  onShareUrl,
  showActions
}: QRCodeGeneratorPopupProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="font-medium">Share Poll</h3>
        <p className="text-sm text-muted-foreground">
          Generate a QR code or copy the link
        </p>
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <Button
          variant="outline"
          onClick={onShareUrl}
          className="w-full justify-start"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Copy poll URL
        </Button>
      </div>

      {/* QR Code Section */}
      {!showAdvanced ? (
        <div className="space-y-3">
          <QRCodeDisplay
            poll={poll}
            qrCodeDataURL={qrCodeDataURL}
            isGenerating={isGenerating}
            error={error}
            size="md"
            onGenerate={() => {}}
            onCopy={onCopy}
            onDownload={onDownload}
            showActions={showActions}
          />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(true)}
            className="w-full"
          >
            Customize QR Code
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <QRCodeGenerator
            pollId={poll.id}
            pollTitle={poll.question}
            size="sm"
            showAdvanced={false}
          />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(false)}
            className="w-full"
          >
            Back to simple view
          </Button>
        </div>
      )}
    </div>
  )
}

export default QRCodeSharing