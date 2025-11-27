import React from 'react'

type Message = {
  id: number
  from: string
  to: string
  body: string
  date: string
  isUser: boolean
}

type Thread = {
  subject: string
  messages: Message[]
  unread?: number
}

export default function InboxView({
  agentKey,
  conversations,
  filter,
  onFilterChange,
  onOpenThread,
}: {
  agentKey: string
  conversations: Record<string, Record<string, Thread>>
  filter: 'all' | 'unopened' | 'opened'
  onFilterChange: (value: 'all' | 'unopened' | 'opened') => void
  onOpenThread: (id: string) => void
}) {
  const agentThreads = conversations[agentKey] || {}
  const threadKeys = Object.keys(agentThreads)

  if (threadKeys.length === 0) {
    return (
      <div className="inbox-view active" id="inboxView">
        <div className="empty-state text-center py-12">
          <div className="text-4xl">📧</div>
          <h3 className="mt-4 text-lg font-semibold">No messages yet</h3>
          <p className="text-sm text-gray-600 mt-2">Click "Compose" to start a conversation</p>
        </div>
      </div>
    )
  }

  // sort threads by last message date desc
  const sorted = threadKeys
    .map((id) => ({ id, thread: agentThreads[id] }))
    .sort((a, b) => {
      const la = a.thread.messages[a.thread.messages.length - 1]
      const lb = b.thread.messages[b.thread.messages.length - 1]
      return new Date(lb?.date || 0).getTime() - new Date(la?.date || 0).getTime()
    })

  const unreadThreads = sorted.filter(({ thread }) => (thread.unread || 0) > 0)
  const readThreads = sorted.filter(({ thread }) => !thread.unread)

  let visibleThreads = [...unreadThreads, ...readThreads]
  if (filter === 'unopened') {
    visibleThreads = unreadThreads
  } else if (filter === 'opened') {
    visibleThreads = readThreads
  }

  const filterOptions: { label: string; value: 'all' | 'unopened' | 'opened' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Unopened', value: 'unopened' },
    { label: 'Opened', value: 'opened' },
  ]

  return (
    <div className="inbox-view active" id="inboxView">
      <div className="thread-filter-row">
        <span className="thread-filter-label">Show</span>
        <div className="thread-filter-group" role="group" aria-label="Thread filters">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`thread-filter-btn ${filter === opt.value ? 'active' : ''}`}
              onClick={() => onFilterChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {visibleThreads.length === 0 && (
          <div className="text-sm text-gray-500 text-center py-6">
            {filter === 'unopened' ? 'No unopened threads at the moment.' : 'No opened threads match this view yet.'}
          </div>
        )}
        {visibleThreads.map(({ id, thread }) => {
          const lastMsg = thread.messages[thread.messages.length - 1]
          const previewPrefix = lastMsg ? (lastMsg.isUser ? 'You: ' : 'Agent: ') : ''
          const previewText = lastMsg?.body ? `${previewPrefix}${lastMsg.body}` : thread.subject
          const unreadBadge = thread.unread ? <span className="ml-2 text-xs text-white bg-amber-500 px-2 rounded">{thread.unread}</span> : null
          return (
            <div key={id} className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100" onClick={() => onOpenThread(id)}>
              <div className="flex items-center justify-between">
                <div className="font-semibold text-gray-800">{thread.subject}</div>
                {unreadBadge}
              </div>
              <div className="text-sm text-gray-600 mt-2">
                {previewText?.substring(0, 120)}
                {previewText && previewText.length > 120 ? '...' : ''}
              </div>
              <div className="text-xs text-gray-400 mt-2">{lastMsg ? new Date(lastMsg.date).toLocaleString() : 'No messages yet'}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
