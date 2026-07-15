import { Close } from './Icons.jsx'

// Generic centred modal used across admin forms.
export default function Modal({ title, onClose, children, footer, wide = false }) {
  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`animate-scale-in flex max-h-[92vh] w-full ${
          wide ? 'max-w-2xl' : 'max-w-md'
        } flex-col overflow-hidden rounded-2xl bg-white shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-none items-center justify-between border-b border-black/5 px-5 py-4">
          <h3 className="font-display text-lg font-bold">{title}</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-charcoal/40 transition hover:bg-black/5 hover:text-charcoal"
            aria-label="Close"
          >
            <Close className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex-none border-t border-black/5 px-5 py-4">{footer}</div>}
      </div>
    </div>
  )
}
