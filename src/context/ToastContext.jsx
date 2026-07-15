import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const ToastContext = createContext(null)

export const useToast = () => useContext(ToastContext)

let idCounter = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const push = useCallback((message, type = 'success') => {
    const id = ++idCounter
    setToasts((t) => [...t, { id, message, type }])
    return id
  }, [])

  const toast = {
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error'),
    info: (m) => push(m, 'info'),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDone={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 3200)
    return () => clearTimeout(timer)
  }, [onDone])

  const styles = {
    success: { bar: 'bg-emerald-500', icon: '✓', ring: 'ring-emerald-500/20' },
    error: { bar: 'bg-red-500', icon: '✕', ring: 'ring-red-500/20' },
    info: { bar: 'bg-brand-500', icon: 'ℹ', ring: 'ring-brand-500/20' },
  }[toast.type]

  return (
    <div
      className={`pointer-events-auto flex w-full max-w-sm animate-toast-in items-center gap-3 overflow-hidden rounded-xl bg-white p-3 pr-4 shadow-xl ring-1 ${styles.ring}`}
    >
      <span
        className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg text-sm font-bold text-white ${styles.bar}`}
      >
        {styles.icon}
      </span>
      <p className="text-sm font-medium text-charcoal">{toast.message}</p>
      <button
        onClick={onDone}
        className="ml-auto flex-none text-charcoal/30 transition hover:text-charcoal"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}
