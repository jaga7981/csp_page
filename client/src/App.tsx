import React, { useState } from 'react'
import Sidebar from './components/Sidebar'
import type { SidebarAgent } from './components/Sidebar'
import Header from './components/Header'
import InboxView from './components/InboxView'
import ThreadView from './components/ThreadView'
import ComposeView from './components/ComposeView'
import ToastContainer from './components/ToastContainer'
import { showToast } from './utils/toast'
import DownloadDialog from './components/DownloadDialog'
import { exportConversations, type ConversationExportFormat } from './utils/conversationExport'
import type { DownloadScope } from './types/download'

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

type AgentConfig = { name: string; email: string; icon: string; webhook?: string }

const AGENT_CONFIG: Record<string, AgentConfig> = {
  vendor: {
    name: 'Vendor',
    icon: 'V',
    email: 'vendor@merlion.com',
    webhook: 'https://n8n.jagadeesh.shop/webhook/agent-vendor',
  },
  customs: { name: 'Customs Broker', icon: 'C', email: 'customs@clearance.com', webhook: 'https://n8n.jagadeesh.shop/webhook/agent-customs' },
  warehouse: { name: 'Warehouse Owners', icon: 'W', email: 'warehouse@storage.com', webhook: 'https://n8n.jagadeesh.shop/webhook/agent-warehouse' },
  port: { name: 'Port Owners', icon: 'P', email: 'port@harbor.gov', webhook: 'https://n8n.jagadeesh.shop/webhook/agent-port' },
  account: { name: 'Account Manager', icon: 'A', email: 'manager@mokabura.com', webhook: 'https://n8n.jagadeesh.shop/webhook/agent-account' },
  retail: { name: 'Retail Bots', icon: 'R', email: 'retail@shop.com', webhook: 'https://n8n.jagadeesh.shop/webhook/agent-retail' },
  influencer: { name: 'Influencer', icon: 'I', email: 'influencer@social.com', webhook: 'https://n8n.jagadeesh.shop/webhook/agent-influencer' },
}

const DEFAULT_AGENT_ORDER = Object.keys(AGENT_CONFIG).sort((a, b) => AGENT_CONFIG[a].name.localeCompare(AGENT_CONFIG[b].name))

function isDuplicateAgentReply(thread: Thread | undefined, reply: Message) {
  if (!thread) return false
  const lastMessage = thread.messages[thread.messages.length - 1]
  return !!(lastMessage && !lastMessage.isUser && lastMessage.body === reply.body)
}

export const App: React.FC = () => {
  const [activeAgent, setActiveAgent] = useState('vendor')
  const [view, setView] = useState<'inbox' | 'thread' | 'compose'>('inbox')
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)

  const [conversations, setConversations] = useState<Record<string, Record<string, Thread>>>(() => {
    const obj: Record<string, Record<string, Thread>> = {}
    Object.keys(AGENT_CONFIG).forEach((k) => (obj[k] = {}))
    return obj
  })
  const [agentOrder, setAgentOrder] = useState<string[]>(DEFAULT_AGENT_ORDER)
  const [threadFilter, setThreadFilter] = useState<'all' | 'unopened' | 'opened'>('all')
  const [isDownloadDialogOpen, setDownloadDialogOpen] = useState(false)
  const [downloadScope, setDownloadScope] = useState<DownloadScope>('single')
  const [downloadFormat, setDownloadFormat] = useState<ConversationExportFormat>('txt')
  const [downloadThreadChoice, setDownloadThreadChoice] = useState<string | null>(null)

  const PRESET_MESSAGES: Record<string, string> = {
    vendor:
      "Dear Vendor,\n\nI hope this message finds you well. I am writing to inquire about your product catalog and current pricing. Could you please share the latest information?\n\nBest regards,\nStudent",
    customs:
      "Hello Customs Broker,\n\nI need assistance with clearing an upcoming shipment. Could you please guide me through the required documentation?\n\nBest regards,\nStudent",
    warehouse:
      "Dear Warehouse Team,\n\nI would like to check the current storage capacity and rates for our upcoming inventory.\n\nBest regards,\nStudent",
    port: "Dear Port Authority,\n\nI need information about the upcoming vessel schedules and berth availability.\n\nBest regards,\nStudent",
    account:
      "Dear Account Manager,\n\nCould you please provide an update on our current account status and any pending matters?\n\nBest regards,\nStudent",
    retail:
      "Hello Retail Team,\n\nI would like to discuss our product placement strategy for the upcoming season.\n\nBest regards,\nStudent",
    influencer:
      "Hello,\n\nI would like to explore potential collaboration opportunities for our brand promotion.\n\nBest regards,\nStudent",
  }

  const agentUnreadCounts = React.useMemo(() => {
    const counts: Record<string, number> = {}
    Object.entries(conversations).forEach(([agentKey, threads]) => {
      counts[agentKey] = Object.values(threads || {}).reduce((sum, thread) => sum + (thread.unread || 0), 0)
    })
    return counts
  }, [conversations])

  const orderedAgents: SidebarAgent[] = React.useMemo(
    () =>
      agentOrder.map((key) => ({
        key,
        name: AGENT_CONFIG[key].name,
        icon: AGENT_CONFIG[key].icon,
        unreadCount: agentUnreadCounts[key] || 0,
      })),
    [agentOrder, agentUnreadCounts]
  )

  const activeAgentThreads = conversations[activeAgent] || {}
  const sortedThreadIds = React.useMemo(() => {
    return Object.entries(activeAgentThreads)
      .sort(([, aThread], [, bThread]) => {
        const aDate = aThread?.messages[aThread.messages.length - 1]?.date ?? '0'
        const bDate = bThread?.messages[bThread.messages.length - 1]?.date ?? '0'
        return new Date(bDate).getTime() - new Date(aDate).getTime()
      })
      .map(([id]) => id)
  }, [activeAgentThreads])

  const threadOptions = React.useMemo(
    () =>
      sortedThreadIds.map((id) => ({
        id,
        subject: activeAgentThreads[id]?.subject || 'Untitled conversation',
      })),
    [sortedThreadIds, activeAgentThreads]
  )

  React.useEffect(() => {
    setThreadFilter('all')
  }, [activeAgent])

  React.useEffect(() => {
    setAgentOrder((prev) => {
      const missing = DEFAULT_AGENT_ORDER.filter((key) => !prev.includes(key))
      return missing.length ? [...prev, ...missing] : prev
    })
  }, [])

  React.useEffect(() => {
    if (downloadScope === 'all') {
      setDownloadThreadChoice(null)
      return
    }
    const firstThreadId = threadOptions[0]?.id ?? null
    setDownloadThreadChoice((prev) => {
      if (prev && activeAgentThreads[prev]) {
        return prev
      }
      return firstThreadId
    })
  }, [downloadScope, activeAgentThreads, threadOptions])

  function bumpAgentToTop(agentKey: string) {
    setAgentOrder((prev) => {
      const without = prev.filter((key) => key !== agentKey)
      return [agentKey, ...without]
    })
  }

  // BASE session ID generated once per app load (used when calling webhooks)
  const BASE_SESSION_ID = React.useMemo(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, [])

  function getSessionId(agentKey: string) {
    return `${BASE_SESSION_ID}_${agentKey}`
  }

  const title = `${AGENT_CONFIG[activeAgent].name} - ${view === 'inbox' ? 'Inbox' : view === 'compose' ? 'Compose' : 'Thread'}`

  function showInbox() {
    setView('inbox')
    setSelectedThreadId(null)
  }

  function openThread(threadId: string) {
    setSelectedThreadId(threadId)
    setView('thread')
    // clear unread for that thread
    setConversations((prev) => {
      const copy = { ...prev }
      if (copy[activeAgent] && copy[activeAgent][threadId]) {
        copy[activeAgent] = { ...copy[activeAgent], [threadId]: { ...copy[activeAgent][threadId], unread: 0 } }
      }
      return copy
    })
  }

  function showCompose() {
    setView('compose')
  }

  function handleAgentSelect(agent: string) {
    setActiveAgent(agent)
    setSelectedThreadId(null)
    setView('inbox')
  }

  async function sendToAgent(agentKey: string, subject: string, body: string, threadId?: string) {
    const webhook = AGENT_CONFIG[agentKey].webhook
    showToast('Sending', 'Your message is being sent...', 'info')
    try {
      if (webhook) {
        const res = await fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'student@mokabura.com',
            to: AGENT_CONFIG[agentKey].email,
            subject,
            message: body,
            session_id: getSessionId(agentKey),
          }),
        })

        if (!res.ok) {
          const txt = await res.text().catch(() => '')
          throw new Error(`HTTP ${res.status} ${res.statusText} ${txt}`)
        }

        const data = await res.json().catch(() => ({}))
        showToast('Message Received', `${AGENT_CONFIG[agentKey].name} has replied`, 'success')
        return data.reply || 'No response'
      }
    } catch (e: any) {
      console.warn('Webhook error', e)
      showToast('Send Failed', `Failed to send message: ${e?.message || e}`, 'error')
    }
    return `Auto-reply from ${AGENT_CONFIG[agentKey].name}`
  }

  async function createThreadAndSend(subject: string, body: string) {
    const threadId = 'thread_' + Date.now().toString()
    const agent = activeAgent
    const isThreadActive = view === 'thread' && selectedThreadId === threadId
    const userMessage: Message = {
      id: Date.now(),
      from: 'student@mokabura.com',
      to: AGENT_CONFIG[agent].email,
      body,
      date: new Date().toISOString(),
      isUser: true,
    }

    setConversations((prev) => {
      const copy = { ...prev }
      copy[agent] = { ...copy[agent], [threadId]: { subject, messages: [userMessage], unread: 0 } }
      return copy
    })
    bumpAgentToTop(agent)

    showInbox()

    const reply = await sendToAgent(agent, subject, body, threadId)
    const agentReply: Message = {
      id: Date.now() + 1,
      from: AGENT_CONFIG[agent].email,
      to: 'student@mokabura.com',
      body: reply,
      date: new Date().toISOString(),
      isUser: false,
    }

    setConversations((prev) => {
      const copy = { ...prev }
      if (!copy[agent][threadId]) {
        copy[agent][threadId] = { subject, messages: [], unread: 0 }
      }
      const currentThread = copy[agent][threadId]
      const unreadCount = isThreadActive ? 0 : (currentThread.unread || 0) + 1
      if (isDuplicateAgentReply(currentThread, agentReply)) {
        return copy
      }
      copy[agent][threadId] = { ...currentThread, messages: [...currentThread.messages, agentReply], unread: unreadCount }
      return copy
    })
    bumpAgentToTop(agent)
  }

  async function sendReply(threadId: string, replyText: string) {
    showToast('Sending Reply', 'Your reply is being sent...', 'info')
    if (!replyText) return
    const agent = activeAgent
    const isThreadActive = view === 'thread' && selectedThreadId === threadId
    const userReply: Message = {
      id: Date.now(),
      from: 'student@mokabura.com',
      to: AGENT_CONFIG[agent].email,
      body: replyText,
      date: new Date().toISOString(),
      isUser: true,
    }

    setConversations((prev) => {
      const copy = { ...prev }
      const thread = copy[agent][threadId]
      const updatedThread = { ...thread, messages: [...thread.messages, userReply] }
      copy[agent] = { ...copy[agent], [threadId]: updatedThread }
      return copy
    })
    bumpAgentToTop(agent)

    const reply = await sendToAgent(agent, 'Re: ' + (conversations[agent][threadId]?.subject || ''), replyText, threadId)
    const agentReply: Message = {
      id: Date.now() + 1,
      from: AGENT_CONFIG[agent].email,
      to: 'student@mokabura.com',
      body: reply,
      date: new Date().toISOString(),
      isUser: false,
    }

    setConversations((prev) => {
      const copy = { ...prev }
      const thread = copy[agent][threadId]
      const unreadCount = isThreadActive ? 0 : (thread.unread || 0) + 1
      if (isDuplicateAgentReply(thread, agentReply)) {
        return copy
      }
      const updatedThread = { ...thread, messages: [...thread.messages, agentReply], unread: unreadCount }
      copy[agent] = { ...copy[agent], [threadId]: updatedThread }
      return copy
    })
    bumpAgentToTop(agent)
  }

  function buildExportThreads(agentKey: string, threadIds: string[]) {
    const threads = conversations[agentKey] || {}
    return threadIds
      .map((threadId, index) => {
        const thread = threads[threadId]
        if (!thread) return null
        return {
          id: threadId,
          label: `Thread ${index + 1}`,
          subject: thread.subject || `Thread ${index + 1}`,
          messages: thread.messages.map((msg, messageIndex) => ({
            order: messageIndex + 1,
            direction: msg.isUser ? 'sent' : 'received',
            author: msg.isUser ? 'You' : AGENT_CONFIG[agentKey].name,
            body: msg.body,
            date: msg.date,
          })),
        }
      })
      .filter(Boolean)
  }

  function showDownloadDialog(scope: DownloadScope, threadId?: string | null) {
    if (threadOptions.length === 0) {
      showToast('No Conversations', 'No conversations to download', { type: 'error', position: 'bottom-right', duration: 2200 })
      return
    }
    setDownloadScope(scope)
    if (scope === 'single') {
      const fallback = threadId ?? selectedThreadId ?? threadOptions[0]?.id ?? null
      setDownloadThreadChoice(fallback)
    } else {
      setDownloadThreadChoice(null)
    }
    setDownloadDialogOpen(true)
  }

  function handleDownloadConfirm() {
    const targetThreadIds =
      downloadScope === 'single'
        ? downloadThreadChoice
          ? [downloadThreadChoice]
          : []
        : sortedThreadIds

    if (targetThreadIds.length === 0) {
      showToast('Select Thread', 'Pick a thread to download', { type: 'error', position: 'bottom-right', duration: 2000 })
      return
    }

    const payloadThreads = buildExportThreads(activeAgent, targetThreadIds)
    if (!payloadThreads.length) {
      showToast('Unavailable', 'Unable to assemble the conversations', { type: 'error', position: 'bottom-right', duration: 2200 })
      return
    }

    const scopeLabel = downloadScope === 'single' ? 'Conversation of Selected Thread' : 'Conversations of All Threads'

    exportConversations(
      {
        agentName: AGENT_CONFIG[activeAgent].name,
        scopeLabel,
        threads: payloadThreads,
      },
      downloadFormat,
      downloadScope === 'single'
        ? `conversation_${AGENT_CONFIG[activeAgent].name}_${targetThreadIds[0]}`
        : `all_conversations_${AGENT_CONFIG[activeAgent].name}`
    )

    showToast('Downloaded', `Conversation saved as ${downloadFormat.toUpperCase()}`, {
      type: 'success',
      position: 'bottom-right',
      duration: 2500,
    })
    setDownloadDialogOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <ToastContainer />
      <div className="flex h-screen">
        <Sidebar agents={orderedAgents} activeAgent={activeAgent} onSelect={(agent) => handleAgentSelect(agent)} />

        <main className="flex-1 flex flex-col bg-white">
          <Header
            title={title}
            downloadLabel="📥 Download Conversation"
            onCompose={() => showCompose()}
            onDownload={() => showDownloadDialog('all')}
          />

          <div className="flex-1 overflow-y-auto p-4">
            {view === 'inbox' && (
              <InboxView
                agentKey={activeAgent}
                conversations={conversations}
                filter={threadFilter}
                onFilterChange={setThreadFilter}
                onOpenThread={(id: string) => openThread(id)}
              />
            )}

            {view === 'thread' && (
              <ThreadView
                thread={selectedThreadId ? conversations[activeAgent][selectedThreadId] : undefined}
                threadId={selectedThreadId ?? undefined}
                onBack={() => showInbox()}
                onSendReply={(text: string) => selectedThreadId && sendReply(selectedThreadId, text)}
              />
            )}

            {view === 'compose' && (
                <ComposeView
                  toEmail={AGENT_CONFIG[activeAgent].email}
                  agentKey={activeAgent}
                  agentName={AGENT_CONFIG[activeAgent].name}
                  presetMessage={PRESET_MESSAGES[activeAgent]}
                  onBack={() => showInbox()}
                  onSend={(subject: string, body: string) => createThreadAndSend(subject, body)}
                />
            )}
          </div>
        </main>
      </div>
      <DownloadDialog
        isOpen={isDownloadDialogOpen}
        scope={downloadScope}
        format={downloadFormat}
        threads={threadOptions}
        selectedThreadId={downloadThreadChoice}
        onScopeChange={setDownloadScope}
        onFormatChange={setDownloadFormat}
        onThreadChange={setDownloadThreadChoice}
        onClose={() => setDownloadDialogOpen(false)}
        onConfirm={handleDownloadConfirm}
      />
    </div>
  )
}

export default App
