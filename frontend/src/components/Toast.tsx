import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

interface ToastCtx {
  toast: (msg: string, kind?: 'ok' | 'err') => void
}

const Ctx = createContext<ToastCtx>({ toast: () => {} })

export function ToastProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ msg: string; kind: 'ok' | 'err' } | null>(null)

  const toast = useCallback((msg: string, kind: 'ok' | 'err' = 'ok') => {
    setState({ msg, kind })
    setTimeout(() => setState(null), 2600)
  }, [])

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      {state && (
        <div className={`toast ${state.kind}`}>
          {state.kind === 'ok' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {state.msg}
        </div>
      )}
    </Ctx.Provider>
  )
}

export const useToast = () => useContext(Ctx)
