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
  onOpenThread,
}: {
  agentKey: string
  conversations: Record<string, Record<string, Thread>>
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
  const sorted = threadKeys.sort((a, b) => {
    const la = agentThreads[a].messages[agentThreads[a].messages.length - 1]
    const lb = agentThreads[b].messages[agentThreads[b].messages.length - 1]
    return new Date(lb.date).getTime() - new Date(la.date).getTime()
  })

  return (
    <div className="inbox-view active" id="inboxView">
      <div className="space-y-3">
        {sorted.map((threadId) => {
          const thread = agentThreads[threadId]
          const firstMsg = thread.messages.find((m) => m.isUser) || thread.messages[0]
          const unreadBadge = thread.unread ? <span className="ml-2 text-xs text-white bg-amber-500 px-2 rounded">{thread.unread} new</span> : null
          return (
            <div key={threadId} className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100" onClick={() => onOpenThread(threadId)}>
              <div className="flex items-center justify-between">
                <div className="font-semibold text-gray-800">{thread.subject}</div>
                {unreadBadge}
              </div>
              <div className="text-sm text-gray-600 mt-2">{firstMsg.body.substring(0, 120)}{firstMsg.body.length > 120 ? '...' : ''}</div>
              <div className="text-xs text-gray-400 mt-2">{new Date(firstMsg.date).toLocaleString()}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
