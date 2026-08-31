import { cn } from '@/lib/cn'

interface CardProps {
  children: React.ReactNode
  className?: string
  title?: string
  description?: string
}

export function Card({ children, className, title, description }: CardProps) {
  return (
    <section
      className={cn(
        'rounded-lg border border-border bg-surface p-6 shadow-sm',
        className,
      )}
    >
      {(title || description) && (
        <header className="mb-4">
          {title && <h2 className="text-lg font-semibold text-text">{title}</h2>}
          {description && <p className="mt-1 text-sm text-text-muted">{description}</p>}
        </header>
      )}
      {children}
    </section>
  )
}
