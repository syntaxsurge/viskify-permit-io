'use client'

import * as React from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { clsx } from 'clsx'
import { BarChart4 } from 'lucide-react'

/* -------------------------------------------------------------------------- */
/*                               PUBLIC TYPES                                 */
/* -------------------------------------------------------------------------- */

/** Quick-action definition rendered in dashboards. */
export type QuickAction = {
  /** Label shown inside the card. */
  label: string
  /** Visual style – kept for backwards-compat (currently unused). */
  variant?: 'default' | 'outline'
  /** Internal navigation link. Mutually exclusive with `endpoint`. */
  href?: string
  /** API endpoint to fetch on click. Mutually exclusive with `href`. */
  endpoint?: string
}

/* -------------------------------------------------------------------------- */
/*                              HELPER HOOKS                                  */
/* -------------------------------------------------------------------------- */

/**
 * Generic handler for actions that trigger a background fetch.
 * Displays success / error toasts based on the response.
 */
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
    <div className="grid auto-rows-[1fr] gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {actions.map((action) => {
        const Wrapper = action.href ? Link : 'button'
        const wrapperProps = action.href
          ? { href: action.href }
          : {
              type: 'button',
              onClick: () => action.endpoint && handleFetch(action.endpoint),
            }

        return (
          // eslint-disable-next-line react/jsx-key
          <Wrapper
            {...(wrapperProps as any)}
            className={clsx(
              'group relative flex w-full items-center justify-center overflow-hidden rounded-xl p-px transition-transform duration-200 hover:-translate-y-1',
              // Fancy animated border
              'bg-gradient-to-br from-primary/40 via-primary/20 to-primary/40',
            )}
          >
            {/* Inner card */}
            <span className="relative flex h-full w-full flex-col items-center justify-center gap-3 rounded-[11px] bg-card px-6 py-8 text-center shadow-md ring-1 ring-border transition-colors duration-200 group-hover:bg-card/80">
              {/* Decorative background burst */}
              <span className="pointer-events-none absolute inset-0 rounded-[11px] bg-[radial-gradient(circle_at_top_left,theme(colors.primary/20),transparent_60%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              {/* Icon */}
              <BarChart4
                aria-hidden="true"
                className="relative z-10 h-8 w-8 flex-shrink-0 text-primary transition-transform duration-300 group-hover:scale-105"
              />
              {/* Label */}
              <span className="relative z-10 text-lg font-semibold tracking-tight">
                {action.label}
              </span>
            </span>
          </Wrapper>
        )
      })}
    </div>
  )
}