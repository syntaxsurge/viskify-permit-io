'use client'

import * as React from 'react'
import Link from 'next/link'

import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

export type QuickAction = {
  /** Label shown on the button. */
  label: string
  /** Filled (default) or outline style. */
  variant?: 'default' | 'outline'
  /** Internal link to navigate. Mutually exclusive with `endpoint`. */
  href?: string
  /** API endpoint to fetch on click. Mutually exclusive with `href`. */
  endpoint?: string
}

/**
 * Generic grid of call-to-action buttons rendered in dashboards.
 * Supports either URL navigation via <Link> or background fetch to an API.
 */
export function QuickActions({ actions }: { actions: QuickAction[] }) {
  if (!actions.length) return null

  async function handleFetch(endpoint: string) {
    try {
      const res = await fetch(endpoint)
      if (res.status === 401) {
        toast.error('Permission required')
        return
      }
      if (!res.ok) {
        toast.error('Request failed')
        return
      }
      const data = await res.json()
      toast.success('Admin stats loaded', {
        description: `Users: ${data.users} · Credentials: ${data.credentials}`,
      })
    } catch {
      toast.error('Network error')
    }
  }

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {actions.map((a) => {
        const variant = a.variant === 'outline' ? 'outline' : 'default'
        if (a.href) {
          return (
            <Link key={a.href} href={a.href}>
              <Button className='w-full' variant={variant}>
                {a.label}
              </Button>
            </Link>
          )
        }
        if (a.endpoint) {
          return (
            <Button
              key={a.endpoint}
              className='w-full'
              variant={variant}
              onClick={() => handleFetch(a.endpoint!)}
            >
              {a.label}
            </Button>
          )
        }
        return null
      })}
    </div>
  )
}