import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../types'

interface UserCtx {
  user: User | null
  login: (u: User) => void
  logout: () => void
}

const Ctx = createContext<UserCtx>({ user: null, login: () => {}, logout: () => {} })

const KEY = 'morizo_user'

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(KEY)
      return raw ? (JSON.parse(raw) as User) : null
    } catch {
      return null
    }
  })

  const login = useCallback((u: User) => {
    localStorage.setItem(KEY, JSON.stringify(u))
    setUser(u)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(KEY)
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useUser = () => useContext(Ctx)
