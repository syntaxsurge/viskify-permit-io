'use client'

import Link from 'next/link'
import * as React from 'react'

import { clsx } from 'clsx'
import { BarChart4 } from 'lucide-react'
import { toast } from 'sonner'

/* -------------------------------------------------------------------------- */
/*                               PUBLIC TYPES                                 */
/* -------------------------------------------------------------------------- */

export type QuickAction = {
  label: string
  variant?: 'default' | 'outline'
  href?: string
  endpoint?: string
}

/* -------------------------------------------------------------------------- */
/*                              HELPER HOOKS                                  */
/* -------------------------------------------------------------------------- */

function useEndpointHandler() {
  return React.useCallback(async (endpoint: string) => {
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
        description: `Users: ${data.users} • Credentials: ${data.credentials}`,
      })
    } catch {
      toast.error('Network error')
    }
  }, [])
}

/* -------------------------------------------------------------------------- */
/*                                 VIEW                                       */
/* -------------------------------------------------------------------------- */

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  if (!actions.length) return null

  const handleFetch = useEndpointHandler()

  return (
    <div className='grid auto-rows-[1fr] gap-6 sm:grid-cols-2 lg:grid-cols-3'>
      {actions.map((action) => {
        const Wrapper = action.href ? Link : 'button'
        const wrapperProps = action.href
          ? { href: action.href }
          : {
              type: 'button',
              onClick: () => action.endpoint && handleFetch(action.endpoint),
            }

        return (
          <Wrapper
            key={action.href ?? action.endpoint ?? action.label}
            {...(wrapperProps as any)}
            className={clsx(
              'group relative flex w-full items-center justify-center overflow-hidden rounded-xl p-px transition-transform duration-200 hover:-translate-y-1',
              'from-primary/40 via-primary/20 to-primary/40 bg-gradient-to-br',
            )}
          >
            <span className='bg-card ring-border group-hover:bg-card/80 relative flex h-full w-full flex-col items-center justify-center gap-3 rounded-[11px] px-6 py-8 text-center shadow-md ring-1 transition-colors duration-200'>
              <span className='bg-[radial-gradient(circle_at_top_left,theme(colors.primary/20),transparent_60%)] pointer-events-none absolute inset-0 rounded-[11px] opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
              <BarChart4
                aria-hidden='true'
                className='text-primary relative z-10 h-8 w-8 flex-shrink-0 transition-transform duration-300 group-hover:scale-105'
              />
              <span className='relative z-10 text-lg font-semibold tracking-tight'>
                {action.label}
              </span>
            </span>
          </Wrapper>
        )
      })}
    </div>
  )
}
