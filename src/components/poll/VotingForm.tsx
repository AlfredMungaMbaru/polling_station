import { memo } from 'react'
import { UseFormReturn } from 'react-hook-form'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Poll } from '@/data/mockPolls'
import { VoteFormData } from '@/types/voting'
import { User } from '@supabase/supabase-js'

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
        <CardTitle>Cast Your Vote</CardTitle>
        <CardDescription>
          {user ? 'Select your preferred option below.' : 'Please sign in to vote.'}
        </CardDescription>
      </CardHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
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
            <Button 
              type="submit" 
              className="w-full" 
              disabled={!user}
            >
              Submit Vote
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
})

// Extracted sub-components for better readability
const AuthenticationPrompt = memo(() => (
  <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
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
  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
    <RadioGroupItem 
      value={option.id} 
      id={option.id}
      disabled={disabled}
    />
    <Label htmlFor={option.id} className="flex-1 cursor-pointer">
      {option.label}
    </Label>
  </div>
))

VotingForm.displayName = 'VotingForm'
AuthenticationPrompt.displayName = 'AuthenticationPrompt'
VotingOption.displayName = 'VotingOption'