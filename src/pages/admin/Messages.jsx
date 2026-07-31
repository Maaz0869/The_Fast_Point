import { useMemo, useState } from 'react'
import { useStore } from '../../context/StoreContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { formatDateTime } from '../../utils/format.js'
import { Trash } from '../../components/Icons.jsx'

// Inbox for the messages sent from the customer-facing Contact page.
export default function Messages() {
  const { messages, setMessageRead, deleteMessage } = useStore()
  const toast = useToast()
  const [filter, setFilter] = useState('all')

  const unread = useMemo(() => messages.filter((m) => !m.read).length, [messages])
  const shown = filter === 'unread' ? messages.filter((m) => !m.read) : messages

  const remove = (m) => {
    if (window.confirm(`Delete the message from ${m.name}?`)) {
      deleteMessage(m.id)
      toast.success('Message deleted')
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Messages</h1>
          <p className="text-sm text-charcoal/55">
            {messages.length} message{messages.length === 1 ? '' : 's'} from the contact form
            {unread > 0 && <span className="font-semibold text-brand-600"> · {unread} unread</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
            All
          </Chip>
          <Chip active={filter === 'unread'} onClick={() => setFilter('unread')}>
            Unread {unread > 0 && `(${unread})`}
          </Chip>
        </div>
      </div>

      <div className="space-y-3">
        {shown.map((m) => (
          <div
            key={m.id}
            className={`card p-5 ${m.read ? '' : 'ring-2 ring-brand-200'}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-display font-bold">
                  {m.name}
                  {!m.read && (
                    <span className="chip bg-brand-100 text-brand-700">New</span>
                  )}
                </p>
                <a
                  href={`mailto:${m.email}?subject=Re:%20your%20message`}
                  className="text-sm font-semibold text-brand-600 hover:underline"
                >
                  {m.email}
                </a>
              </div>
              <p className="text-xs text-charcoal/50">{formatDateTime(m.createdAt)}</p>
            </div>

            <p className="mt-3 whitespace-pre-wrap text-sm text-charcoal/75">{m.message}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={`mailto:${m.email}?subject=Re:%20your%20message`}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-brand-600 ring-1 ring-brand-200 hover:bg-brand-50"
              >
                ✉️ Reply by Email
              </a>
              <button
                onClick={() => setMessageRead(m.id, !m.read)}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-charcoal/70 ring-1 ring-black/10 hover:bg-gray-50"
              >
                {m.read ? 'Mark as unread' : 'Mark as read'}
              </button>
              <button
                onClick={() => remove(m)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 ring-1 ring-red-200 hover:bg-red-50"
                aria-label="Delete message"
              >
                <Trash className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {shown.length === 0 && (
        <p className="card p-10 text-center text-sm text-charcoal/50">
          {filter === 'unread' ? 'No unread messages. 🎉' : 'No messages yet.'}
        </p>
      )}
    </div>
  )
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition ${
        active ? 'bg-brand-500 text-white' : 'bg-white text-charcoal/60 ring-1 ring-black/5 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  )
}
