import Image from 'next/image'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

export default function Forbidden() {
  return (
    <main className='flex min-h-screen flex-col items-center justify-center p-6'>
      <div className='flex flex-col items-center gap-6 text-center'>
        <Image
          src='/images/viskify-logo.png'
          alt='Viskify logo'
          width={96}
          height={96}
          priority
          className='h-16 w-auto'
        />

        <h1 className='text-4xl font-extrabold tracking-tight'>403 — Access Denied</h1>

        <p className='text-muted-foreground max-w-md text-sm'>
          Sorry, you do not have permission to view this page.
        </p>

        <Link href='/' passHref>
          <Button size='sm'>Go Home</Button>
        </Link>
      </div>
    </main>
  )
}