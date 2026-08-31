import { APP_NAME } from '@/lib/constants'
import { cn } from '@/lib/cn'

interface HeaderProps {
  className?: string
}

export function Header({ className }: HeaderProps) {
  return (
    <header
      className={cn(
        'flex h-16 items-center border-b border-border bg-surface px-6',
        className,
      )}
    >
      <h1 className="text-lg font-semibold text-text">{APP_NAME}</h1>
    </header>
  )
}
