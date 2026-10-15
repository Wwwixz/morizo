import type { ReactNode } from 'react'

export function Modal({
  title,
  onClose,
  children,
  className = '',
}: {
  title: string
  onClose: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${className}`}>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  )
}
