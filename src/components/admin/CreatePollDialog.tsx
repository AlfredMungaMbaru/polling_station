/**
 * Create Poll Dialog Component
 * 
 * Modal dialog for administrators to create new polls
 */

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, Plus, X } from 'lucide-react'

// Validation schema for poll creation
const createPollSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string()
    .min(1, 'Description is required')
    .max(1000, 'Description must be less than 1000 characters'),
  options: z.array(z.string())
    .min(2, 'At least 2 options are required')
    .max(10, 'Maximum 10 options allowed'),
  endDate: z.string().optional(),
  allowMultiple: z.boolean(),
  requireAuth: z.boolean(),
})

type CreatePollFormData = z.infer<typeof createPollSchema>

interface CreatePollDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const CreatePollDialog: React.FC<CreatePollDialogProps> = ({
  open,
  onOpenChange
}) => {
  const [options, setOptions] = useState<string[]>(['', ''])
  const [newOption, setNewOption] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CreatePollFormData>({
    resolver: zodResolver(createPollSchema),
    defaultValues: {
      title: '',
      description: '',
      options: ['', ''],
      endDate: '',
      allowMultiple: false,
      requireAuth: true,
    },
  })

  const addOption = () => {
    if (newOption.trim() && options.length < 10) {
      const updatedOptions = [...options, newOption.trim()]
      setOptions(updatedOptions)
      form.setValue('options', updatedOptions)
      setNewOption('')
    }
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const updatedOptions = options.filter((_, i) => i !== index)
      setOptions(updatedOptions)
      form.setValue('options', updatedOptions)
    }
  }

  const updateOption = (index: number, value: string) => {
    const updatedOptions = [...options]
    updatedOptions[index] = value
    setOptions(updatedOptions)
    form.setValue('options', updatedOptions)
  }

  const onSubmit = async (data: CreatePollFormData) => {
    setIsSubmitting(true)
    try {
      // Filter out empty options
      const validOptions = data.options.filter(option => option.trim() !== '')
      
      if (validOptions.length < 2) {
        form.setError('options', {
          type: 'manual',
          message: 'At least 2 options are required'
        })
        return
      }

      // In real app, this would call your API
      console.log('Creating poll:', { ...data, options: validOptions })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Reset form and close dialog
      form.reset()
      setOptions(['', ''])
      setNewOption('')
      onOpenChange(false)
      
      // Show success message (you might want to use a toast here)
      alert('Poll created successfully!')
      
    } catch (error) {
      console.error('Error creating poll:', error)
      // Handle error (show error message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset()
      setOptions(['', ''])
      setNewOption('')
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Poll</DialogTitle>
          <DialogDescription>
            Create a new poll for users to vote on. Fill in the details below.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Poll Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Poll Title *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter poll title..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A clear, descriptive title for your poll
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Poll Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe what this poll is about..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide context and details about the poll
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Poll Options */}
            <div className="space-y-4">
              <div>
                <FormLabel>Poll Options *</FormLabel>
                <FormDescription>
                  Add the options users can vote for (minimum 2, maximum 10)
                </FormDescription>
              </div>

              {/* Existing Options */}
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                    />
                    {options.length > 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeOption(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add New Option */}
              {options.length < 10 && (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Add new option..."
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addOption()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    disabled={!newOption.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {form.formState.errors.options && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.options.message}
                </p>
              )}
            </div>

            {/* End Date */}
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="datetime-local"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    When should this poll end? Leave empty for no end date
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Options Summary */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Poll Preview</h4>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Options ({options.filter(o => o.trim()).length}):</strong>
                </p>
                <div className="flex flex-wrap gap-1">
                  {options
                    .filter(option => option.trim())
                    .map((option, index) => (
                      <Badge key={index} variant="secondary">
                        {option}
                      </Badge>
                    ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Poll'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}