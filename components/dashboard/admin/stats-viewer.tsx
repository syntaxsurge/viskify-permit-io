'use client'

import { useEffect, useState } from 'react'
import { Loader2, RefreshCcw } from 'lucide-react'

import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type StatsPayload = Record<string, unknown> | null

export default function AdminStatsViewer() {
  const [stats, setStats] = useState<StatsPayload>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchStats() {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/stats')
      if (!res.ok) {
        throw new Error('Request failed')
      }
      const data = await res.json()
      setStats(data)
      setError(null)
    } catch (e) {
      setError('Unable to load statistics.')
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  /* Initial fetch */
  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <Card className="overflow-hidden shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold tracking-tight">Platform Statistics (JSON)</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchStats}
          disabled={loading}
          aria-label="Refresh statistics"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all p-4 text-sm leading-snug">
          {loading && !stats && 'Loading…'}
          {error && error}
          {!loading && stats && JSON.stringify(stats, null, 2)}
        </pre>
      </CardContent>
    </Card>