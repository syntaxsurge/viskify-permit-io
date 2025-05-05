/**
 * app/403/page.tsx
 * Custom 403 - Forbidden page.
 */

import Link from 'next/link'

export const metadata = {
  title: '403 – Forbidden',
}

export default function ForbiddenPage() {
  return (
    <main className="flex h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-6xl font-bold tracking-tight">403</h1>
      <p className="max-w-md text-lg text-muted-foreground">
        Sorry, you don&apos;t have permission to access this page.
      </p>
      <Link
        href="/"
        className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Go home
      </Link>
    </main>
  )
}