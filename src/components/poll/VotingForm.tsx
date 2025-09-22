import { memo } from 'react'
import { UseFormReturn } from 'react-hook-form'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Poll } from '@/data/mockPolls'
import { VoteFormData } from '@/types/voting'
import { User } from '@supabase/supabase-js'
import { Heading, AccessibleButton } from '@/lib/accessibility/components'

interface VotingFormProps {
  poll: Poll
  user: User | null
  form: UseFormReturn<VoteFormData>
  onSubmit: (data: VoteFormData) => Promise<void>
}

export const VotingForm = memo(({ poll, user, form, onSubmit }: VotingFormProps) => {
  return (
    <Card>
      <CardHeader>
        <Heading level={2} className="text-xl">Cast Your Vote</Heading>
        <CardDescription>
          {user ? 'Select your preferred option below.' : 'Please sign in to vote.'}
        </CardDescription>
      </CardHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} aria-labelledby="voting-form-title">
          <CardContent className="space-y-4">
            {!user && <AuthenticationPrompt />}
            
            <FormField
              control={form.control}
              name="optionId"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Select your preferred option:</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!user}
                      className="space-y-2"
                      aria-required="true"
                      aria-describedby={!user ? "auth-required" : undefined}
                    >
                      {poll.options.map((option) => (
                        <VotingOption 
                          key={option.id} 
                          option={option} 
                          disabled={!user} 
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          
          <CardFooter>
            <AccessibleButton 
              type="submit" 
              className="w-full" 
              disabled={!user}
              aria-describedby={!user ? "auth-required" : undefined}
            >
              Submit Vote
            </AccessibleButton>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
})

// Extracted sub-components for better readability
const AuthenticationPrompt = memo(() => (
  <div 
    id="auth-required"
    className="p-4 bg-blue-50 border border-blue-200 rounded-md" 
    role="alert"
    aria-live="polite"
  >
    <p className="text-sm text-blue-700">
      You need to be signed in to participate in this poll.{' '}
      <Link href="/auth/login" className="font-medium underline">
        Sign in here
      </Link>
    </p>
  </div>
))

const VotingOption = memo(({ option, disabled }: { 
  option: { id: string; label: string; votes: number }
  disabled: boolean 
}) => (
  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500">
    <RadioGroupItem 
      value={option.id} 
      id={option.id}
      disabled={disabled}
      aria-describedby={`option-${option.id}-desc`}
    />
    <Label htmlFor={option.id} className="flex-1 cursor-pointer">
      {option.label}
      <span id={`option-${option.id}-desc`} className="sr-only">
        Vote for {option.label}
      </span>
    </Label>
  </div>
))

VotingForm.displayName = 'VotingForm'
AuthenticationPrompt.displayName = 'AuthenticationPrompt'
VotingOption.displayName = 'VotingOption'