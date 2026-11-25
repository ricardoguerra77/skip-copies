import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

interface AuthValue {
  user: RecordModel | null
  ready: boolean
  logout: () => void
}
const AuthContext = createContext<AuthValue>({ user: null, ready: false, logout: () => undefined })
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<RecordModel | null>(pb.authStore.record)
  useEffect(() => pb.authStore.onChange((_token, record) => setUser(record), true), [])
  const value = useMemo(() => ({ user, ready: true, logout: () => pb.authStore.clear() }), [user])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
export const useAuth = () => useContext(AuthContext)
