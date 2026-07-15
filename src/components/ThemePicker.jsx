import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../context/ThemeContext.jsx'
import { Palette, Check } from './Icons.jsx'

// Accent-colour picker — a palette button that opens a small popover of
// colour swatches. The chosen accent instantly recolours the whole site.
export default function ThemePicker() {
  const { accent, setAccent, accents } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-card ring-1 ring-black/5 transition hover:scale-105 hover:text-brand-500"
        aria-label="Change colour theme"
        aria-expanded={open}
        title="Colour theme"
      >
        <Palette className="h-5 w-5" />
      </button>

      {open && (
        <div className="animate-scale-in absolute right-0 top-12 z-50 w-44 origin-top-right rounded-2xl bg-white p-3 shadow-card ring-1 ring-black/5">
          <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-charcoal/50">
            Colour Theme
          </p>
          <div className="grid grid-cols-5 gap-2">
            {accents.map((a) => (
              <button
                key={a.key}
                onClick={() => {
                  setAccent(a.key)
                  setOpen(false)
                }}
                className="flex aspect-square items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-white transition hover:scale-110"
                style={{
                  backgroundColor: a.color,
                  '--tw-ring-color': accent === a.key ? a.color : 'transparent',
                }}
                aria-label={a.label}
                title={a.label}
              >
                {accent === a.key && <Check className="h-3.5 w-3.5 text-white" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
