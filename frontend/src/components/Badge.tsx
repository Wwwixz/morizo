import { Award } from 'lucide-react'

type Variant = 'yellow' | 'blue' | 'red' | 'green' | 'gray'

export function Badge({
  variant,
  children,
  icon = false,
}: {
  variant: Variant
  children: React.ReactNode
  icon?: boolean
}) {
  return (
    <span className={`badge badge-${variant}`}>
      {icon && <Award size={12} />}
      {children}
    </span>
  )
}
