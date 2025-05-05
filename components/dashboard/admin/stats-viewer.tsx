'use client'

import { useEffect, useState } from 'react'

import { Loader2, RefreshCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'

type StatsPayload = Record<string, unknown> | null

export default function AdminStatsViewer() {
  const [stats, setStats] = useState<StatsPayload>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchStats() {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/stats')
      if (!res.ok) throw new Error('Request failed')
      const data = await res.json()
      setStats(data)
      setError(null)
    } catch {
      setError('Unable to load statistics.')
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  /* Fetch on mount */
  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <Card className='overflow-hidden shadow-sm'>
      <CardHeader className='flex items-center justify-between gap-4 border-b p-4'>
        <h2 className='text-lg font-semibold tracking-tight'>Platform Statistics (JSON)</h2>
        <Button
          size='sm'
          variant='outline'
          onClick={fetchStats}
          disabled={loading}
          aria-label='Refresh statistics'
        >
          {loading ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <RefreshCcw className='h-4 w-4' />
          )}
        </Button>
      </CardHeader>

      <CardContent className='p-0'>
        <pre className='max-h-64 overflow-auto p-4 text-sm leading-snug break-words whitespace-pre-wrap'>
          {loading && !stats && 'Loading…'}
          {error && error}
          {!loading && stats && JSON.stringify(stats, null, 2)}
        </pre>
      </CardContent>
    </Card>
  )
}
