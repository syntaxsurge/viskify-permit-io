'use client'

import { ArrowRight, Loader2 } from 'lucide-react'
import { useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'

export function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type='submit'
      disabled={pending}
      className='flex w-full items-center justify-center rounded-full'
    >
      {pending ? (
        <>
          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          Loading...
        </>
      ) : (
        <>
          Get Started
          <ArrowRight className='ml-2 h-4 w-4' />
        </>
      )}
    </Button>
  )
}
