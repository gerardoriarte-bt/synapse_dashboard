import { cn } from '@/lib/cn'

interface MainLayoutProps {
  children: React.ReactNode
  className?: string
}

export function MainLayout({ children, className }: MainLayoutProps) {
  return (
    <div className={cn('flex min-h-screen flex-col', className)}>
      <main className="mx-auto w-full max-w-6xl flex-1 p-6">{children}</main>
    </div>
  )
}
