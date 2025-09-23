/**
 * QR Code Generator Component
 * 
 * A comprehensive React component for generating and customizing QR codes
 * with accessibility features, real-time preview, and download/copy functionality.
 */

'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useQRCode, QRCodeOptions, qrCodeUtils } from '@/lib/qrCodeService'
import { Download, Copy, Share2, Palette, Settings, Eye, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Simple toast notification hook (fallback)
 */
function useToast() {
  const toast = useCallback((options: { title: string; description?: string; variant?: 'default' | 'destructive' }) => {
    // Simple alert fallback - in production you'd use a proper toast library
    if (options.variant === 'destructive') {
      alert(`Error: ${options.title}${options.description ? '\n' + options.description : ''}`)
    } else {
      alert(`${options.title}${options.description ? '\n' + options.description : ''}`)
    }
  }, [])

  return { toast }
}

/**
 * Simple Select component replacement
 */
interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string
}

function SimpleSelect({ value, onValueChange, children, className }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState('')

  const handleOptionClick = (optionValue: string, label: string) => {
    onValueChange(optionValue)
    setSelectedLabel(label)
    setIsOpen(false)
  }

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
        type="button"
      >
        {selectedLabel || value}
        <ChevronDown className="h-4 w-4" />
      </Button>
      {isOpen && (
        <div 
          className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto" 
          aria-label="Select options"
        >
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              const childElement = child as React.ReactElement<SelectOptionProps>
              return React.cloneElement(childElement, {
                onClick: () => handleOptionClick(childElement.props.value, 
                  typeof childElement.props.children === 'string' 
                    ? childElement.props.children 
                    : childElement.props.value)
              })
            }
            return child
          })}
        </div>
      )}
    </div>
  )
}

interface SelectOptionProps {
  value: string
  children: React.ReactNode
  onClick?: () => void
}

function SelectOption({ value, children, onClick }: SelectOptionProps) {
  return (
    <div
      className="px-3 py-2 cursor-pointer hover:bg-gray-100"
      onClick={onClick}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      {children}
    </div>
  )
}

/**
 * Simple Slider component replacement
 */
interface SliderProps {
  value: number[]
  onValueChange: (value: number[]) => void
  min: number
  max: number
  step: number
  className?: string
}

function SimpleSlider({ value, onValueChange, min, max, step, className }: SliderProps) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value[0]}
      onChange={(e) => onValueChange([parseInt(e.target.value)])}
      className={cn('w-full', className)}
      aria-label={`Slider with value ${value[0]}`}
    />
  )
}

/**
 * Props for QR Code Generator component
 */
export interface QRCodeGeneratorProps {
  /** Initial text/URL to encode */
  initialText?: string
  /** Poll ID for generating poll-specific QR codes */
  pollId?: string
  /** Poll title for filename generation */
  pollTitle?: string
  /** Show advanced customization options */
  showAdvanced?: boolean
  /** Component size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Custom CSS class */
  className?: string
  /** Callback when QR code is generated */
  onGenerated?: (dataURL: string) => void
  /** Callback when QR code is downloaded */
  onDownload?: (filename: string) => void
  /** Callback when QR code is copied */
  onCopy?: () => void
}

/**
 * Color scheme options for QR codes
 */
const COLOR_SCHEMES = qrCodeUtils.getColorSchemes()

/**
 * Error correction level descriptions
 */
const ERROR_CORRECTION_LEVELS = {
  L: { label: 'Low (~7%)', description: 'Suitable for clean environments' },
  M: { label: 'Medium (~15%)', description: 'Balanced reliability and size' },
  Q: { label: 'Quartile (~25%)', description: 'Good for printed materials' },
  H: { label: 'High (~30%)', description: 'Maximum error recovery' }
} as const

/**
 * Size presets for different use cases
 */
const SIZE_PRESETS = {
  small: { width: 128, label: 'Small (128px)', usage: 'Web thumbnails' },
  medium: { width: 256, label: 'Medium (256px)', usage: 'Standard web use' },
  large: { width: 512, label: 'Large (512px)', usage: 'Print materials' },
  xlarge: { width: 1024, label: 'Extra Large (1024px)', usage: 'High-res printing' }
} as const

/**
 * QR Code Generator Component
 */
export function QRCodeGenerator({
  initialText = '',
  pollId,
  pollTitle,
  showAdvanced = false,
  size = 'md',
  className,
  onGenerated,
  onDownload,
  onCopy
}: QRCodeGeneratorProps) {
  const { toast } = useToast()
  const { generateQRCode, generatePollQRCode, downloadQRCode, copyToClipboard, validateText } = useQRCode()
  
  // State for QR code configuration
  const [text, setText] = useState(initialText)
  const [qrCodeDataURL, setQRCodeDataURL] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string>('')
  
  // State for customization options
  const [options, setOptions] = useState<QRCodeOptions>({
    width: 256,
    errorCorrectionLevel: 'M',
    margin: 4,
    color: COLOR_SCHEMES.default,
    scale: 4
  })
  
  // State for UI
  const [selectedColorScheme, setSelectedColorScheme] = useState('default')
  const [selectedSizePreset, setSelectedSizePreset] = useState('medium')
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(showAdvanced)
  
  // Refs
  const qrImageRef = useRef<HTMLImageElement>(null)
  const generateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Generate QR code with current options
   */
  const generateQRCodeImage = useCallback(async () => {
    if (!text.trim()) {
      setQRCodeDataURL('')
      setError('')
      return
    }

    // Clear previous timeout
    if (generateTimeoutRef.current) {
      clearTimeout(generateTimeoutRef.current)
    }

    // Debounce generation
    generateTimeoutRef.current = setTimeout(async () => {
      setIsGenerating(true)
      setError('')

      try {
        // Validate text
        const validation = validateText(text)
        if (!validation.isValid) {
          setError(validation.error || 'Invalid text')
          setQRCodeDataURL('')
          return
        }

        // Generate QR code
        let dataURL: string
        if (pollId) {
          dataURL = await generatePollQRCode(pollId, { ...options, baseUrl: undefined })
        } else {
          dataURL = await generateQRCode(text, options)
        }

        setQRCodeDataURL(dataURL)
        onGenerated?.(dataURL)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate QR code'
        setError(errorMessage)
        setQRCodeDataURL('')
        
        toast({
          title: 'Generation Failed',
          description: errorMessage,
          variant: 'destructive'
        })
      } finally {
        setIsGenerating(false)
      }
    }, 300)
  }, [text, options, pollId, generateQRCode, generatePollQRCode, validateText, onGenerated, toast])

  /**
   * Handle download
   */
  const handleDownload = useCallback(() => {
    if (!qrCodeDataURL) return

    const filename = pollId && pollTitle 
      ? qrCodeUtils.createFilename(pollId, pollTitle)
      : qrCodeUtils.createFilename()

    try {
      downloadQRCode(qrCodeDataURL, filename)
      onDownload?.(filename)
      
      toast({
        title: 'Downloaded',
        description: `QR code saved as ${filename}`
      })
    } catch (err) {
      toast({
        title: 'Download Failed',
        description: err instanceof Error ? err.message : 'Failed to download QR code',
        variant: 'destructive'
      })
    }
  }, [qrCodeDataURL, pollId, pollTitle, downloadQRCode, onDownload, toast])

  /**
   * Handle copy to clipboard
   */
  const handleCopy = useCallback(async () => {
    if (!qrCodeDataURL) return

    try {
      await copyToClipboard(qrCodeDataURL)
      onCopy?.()
      
      toast({
        title: 'Copied',
        description: 'QR code copied to clipboard'
      })
    } catch (err) {
      toast({
        title: 'Copy Failed',
        description: err instanceof Error ? err.message : 'Failed to copy QR code',
        variant: 'destructive'
      })
    }
  }, [qrCodeDataURL, copyToClipboard, onCopy, toast])

  /**
   * Handle color scheme change
   */
  const handleColorSchemeChange = useCallback((scheme: string) => {
    setSelectedColorScheme(scheme)
    setOptions(prev => ({
      ...prev,
      color: COLOR_SCHEMES[scheme as keyof typeof COLOR_SCHEMES] || COLOR_SCHEMES.default
    }))
  }, [])

  /**
   * Handle size preset change
   */
  const handleSizePresetChange = useCallback((preset: string) => {
    setSelectedSizePreset(preset)
    const presetData = SIZE_PRESETS[preset as keyof typeof SIZE_PRESETS]
    if (presetData) {
      setOptions(prev => ({
        ...prev,
        width: presetData.width
      }))
    }
  }, [])

  /**
   * Handle custom color change
   */
  const handleCustomColorChange = useCallback((type: 'dark' | 'light', color: string) => {
    setSelectedColorScheme('custom')
    setOptions(prev => ({
      ...prev,
      color: {
        ...prev.color,
        [type]: color
      }
    }))
  }, [])

  // Generate QR code when dependencies change
  useEffect(() => {
    generateQRCodeImage()
  }, [generateQRCodeImage])

  // Set initial text for poll QR codes
  useEffect(() => {
    if (pollId && !text) {
      setText(`Poll: ${pollTitle || pollId}`)
    }
  }, [pollId, pollTitle, text])

  // Component size classes
  const sizeClasses = {
    sm: 'w-full max-w-md',
    md: 'w-full max-w-lg',
    lg: 'w-full max-w-2xl'
  }

  return (
    <Card className={cn(sizeClasses[size], className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          QR Code Generator
        </CardTitle>
        <CardDescription>
          Generate and customize QR codes for easy sharing
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Text Input */}
        <div className="space-y-2">
          <Label htmlFor="qr-text">Text or URL</Label>
          <Input
            id="qr-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text or URL to encode"
            disabled={!!pollId}
            aria-describedby={error ? 'qr-error' : undefined}
          />
          {error && (
            <p id="qr-error" className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>

        {/* QR Code Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Preview</Label>
            {qrCodeDataURL && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  disabled={!qrCodeDataURL}
                  aria-label="Copy QR code to clipboard"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={!qrCodeDataURL}
                  aria-label="Download QR code"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex justify-center p-4 bg-gray-50 rounded-lg border-2 border-dashed">
            {isGenerating ? (
              <div className="flex items-center justify-center w-64 h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : qrCodeDataURL ? (
              <img
                ref={qrImageRef}
                src={qrCodeDataURL}
                alt={`QR code for: ${text}`}
                className="max-w-full h-auto rounded border"
                width={options.width ? Math.min(options.width, 400) : 256}
                height="auto"
              />
            ) : (
              <div className="flex items-center justify-center w-64 h-64 text-gray-400">
                <div className="text-center">
                  <Eye className="h-8 w-8 mx-auto mb-2" />
                  <p>QR code preview</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Customization Options */}
        <Tabs 
          value={isAdvancedOpen ? 'advanced' : 'basic'} 
          onValueChange={(value) => setIsAdvancedOpen(value === 'advanced')}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="advanced">
              <Settings className="h-4 w-4 mr-1" />
              Advanced
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4">
            {/* Size Preset */}
            <div className="space-y-2">
              <Label>Size</Label>
              <SimpleSelect value={selectedSizePreset} onValueChange={handleSizePresetChange}>
                {Object.entries(SIZE_PRESETS).map(([key, preset]) => (
                  <SelectOption key={key} value={key}>
                    <div>
                      <div>{preset.label}</div>
                      <div className="text-xs text-muted-foreground">{preset.usage}</div>
                    </div>
                  </SelectOption>
                ))}
              </SimpleSelect>
            </div>

            {/* Color Scheme */}
            <div className="space-y-2">
              <Label>Color Scheme</Label>
              <SimpleSelect value={selectedColorScheme} onValueChange={handleColorSchemeChange}>
                {Object.entries(COLOR_SCHEMES).map(([key, colors]) => (
                  <SelectOption key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div 
                          className="w-3 h-3 rounded-full border bg-black"
                          data-color={colors.dark}
                        />
                        <div 
                          className="w-3 h-3 rounded-full border bg-white"
                          data-color={colors.light}
                        />
                      </div>
                      <span className="capitalize">{key}</span>
                    </div>
                  </SelectOption>
                ))}
              </SimpleSelect>
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-4">
            {/* Error Correction Level */}
            <div className="space-y-2">
              <Label>Error Correction</Label>
              <SimpleSelect 
                value={options.errorCorrectionLevel || 'M'} 
                onValueChange={(value: string) => 
                  setOptions(prev => ({ ...prev, errorCorrectionLevel: value as 'L' | 'M' | 'Q' | 'H' }))
                }
              >
                {Object.entries(ERROR_CORRECTION_LEVELS).map(([key, info]) => (
                  <SelectOption key={key} value={key}>
                    <div>
                      <div>{info.label}</div>
                      <div className="text-xs text-muted-foreground">{info.description}</div>
                    </div>
                  </SelectOption>
                ))}
              </SimpleSelect>
            </div>

            {/* Custom Width */}
            <div className="space-y-2">
              <Label>Width: {options.width}px</Label>
              <SimpleSlider
                value={[options.width || 256]}
                onValueChange={(values) => setOptions(prev => ({ ...prev, width: values[0] }))}
                min={128}
                max={1024}
                step={32}
                className="w-full"
              />
            </div>

            {/* Margin */}
            <div className="space-y-2">
              <Label>Margin: {options.margin}</Label>
              <SimpleSlider
                value={[options.margin || 4]}
                onValueChange={(values) => setOptions(prev => ({ ...prev, margin: values[0] }))}
                min={0}
                max={10}
                step={1}
                className="w-full"
              />
            </div>

            {/* Custom Colors */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Custom Colors
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="dark-color" className="text-xs">Foreground</Label>
                  <div className="flex gap-2">
                    <input
                      id="dark-color"
                      type="color"
                      value={options.color?.dark || '#000000'}
                      onChange={(e) => handleCustomColorChange('dark', e.target.value)}
                      className="w-8 h-8 rounded border cursor-pointer"
                      title="Select foreground color"
                      aria-label="Foreground color picker"
                    />
                    <Input
                      value={options.color?.dark || '#000000'}
                      onChange={(e) => handleCustomColorChange('dark', e.target.value)}
                      className="text-xs"
                      placeholder="#000000"
                      aria-label="Foreground color hex value"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="light-color" className="text-xs">Background</Label>
                  <div className="flex gap-2">
                    <input
                      id="light-color"
                      type="color"
                      value={options.color?.light || '#ffffff'}
                      onChange={(e) => handleCustomColorChange('light', e.target.value)}
                      className="w-8 h-8 rounded border cursor-pointer"
                      title="Select background color"
                      aria-label="Background color picker"
                    />
                    <Input
                      value={options.color?.light || '#ffffff'}
                      onChange={(e) => handleCustomColorChange('light', e.target.value)}
                      className="text-xs"
                      placeholder="#ffffff"
                      aria-label="Background color hex value"
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        {qrCodeDataURL && (
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <Button onClick={handleDownload} className="flex-1 min-w-[120px]">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" onClick={handleCopy} className="flex-1 min-w-[120px]">
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
        )}

        {/* Info Badge */}
        {text && (
          <Badge variant="secondary" className="text-xs">
            Characters: {text.length} / 2953
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}

export default QRCodeGenerator