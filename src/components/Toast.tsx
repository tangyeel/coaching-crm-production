'use client'

import { createContext, useContext, useCallback, useRef, useState } from 'react'
import '@/app/portal.css'

type ToastType = 'ok' | 'err' | 'inf'

interface ToastCtx { toast: (msg: string, type?: ToastType) => void }

const Ctx = createContext<ToastCtx | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState({ msg: '', type: 'ok' as ToastType, visible: false })
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const toast = useCallback((msg: string, type: ToastType = 'ok') => {
    if (timer.current) clearTimeout(timer.current)
    setState({ msg, type, visible: true })
    timer.current = setTimeout(() => setState(s => ({ ...s, visible: false })), 3000)
  }, [])

  const icon = state.type === 'ok' ? 'fa-circle-check' : state.type === 'err' ? 'fa-circle-xmark' : 'fa-circle-info'
  const color = state.type === 'ok' ? '#10B981' : state.type === 'err' ? '#EF4444' : '#06B6D4'

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className={'portal-toast' + (state.visible ? ' show' : '')}>
        <i className={'fa-solid ' + icon} style={{ color, fontSize: 16 }} />
        <span style={{ fontSize: 13 }}>{state.msg}</span>
      </div>
    </Ctx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
