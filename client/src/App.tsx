import React, { useState } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import InboxView from './components/InboxView'
import ThreadView from './components/ThreadView'
import ComposeView from './components/ComposeView'
import ToastContainer from './components/ToastContainer'
import { showToast } from './utils/toast'
import { downloadFile } from './utils/download'

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

export const App: React.FC = () => {
  const [activeAgent, setActiveAgent] = useState('vendor')
  const [view, setView] = useState<'inbox' | 'thread' | 'compose'>('inbox')
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)

  const AGENT_CONFIG: Record<string, { name: string; email: string; webhook?: string }> = {
    vendor: { name: 'Vendor', 
        email: 'vendor@merlion.com',
        webhook: 'https://n8n.jagadeesh.shop/webhook/agent-vendor' },
    customs: { name: 'Customs Broker', email: 'customs@clearance.com', webhook: 'https://n8n.jagadeesh.shop/webhook/agent-customs' },
    warehouse: { name: 'Warehouse Owners', email: 'warehouse@storage.com', webhook: 'https://n8n.jagadeesh.shop/webhook/agent-warehouse' },
    port: { name: 'Port Owners', email: 'port@harbor.gov', webhook: 'https://n8n.jagadeesh.shop/webhook/agent-port' },
    account: { name: 'Account Manager', email: 'manager@mokabura.com', webhook: 'https://n8n.jagadeesh.shop/webhook/agent-account' },
    retail: { name: 'Retail Bots', email: 'retail@shop.com', webhook: 'https://n8n.jagadeesh.shop/webhook/agent-retail' },
    influencer: { name: 'Influencer', email: 'influencer@social.com', webhook: 'https://n8n.jagadeesh.shop/webhook/agent-influencer' },
  }

  const [conversations, setConversations] = useState<Record<string, Record<string, Thread>>>(() => {
    const obj: Record<string, Record<string, Thread>> = {}
    Object.keys(AGENT_CONFIG).forEach((k) => (obj[k] = {}))
    return obj
  })

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
      copy[agent][threadId] = { ...copy[agent][threadId], messages: [...copy[agent][threadId].messages, agentReply], unread: (copy[agent][threadId].unread || 0) + 1 }
      return copy
    })
  }

  async function sendReply(threadId: string, replyText: string) {
    showToast('Sending Reply', 'Your reply is being sent...', 'info')
    if (!replyText) return
    const agent = activeAgent
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
      thread.messages = [...thread.messages, userReply]
      copy[agent] = { ...copy[agent], [threadId]: thread }
      return copy
    })

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
      thread.messages = [...thread.messages, agentReply]
      thread.unread = (thread.unread || 0) + 1
      copy[agent] = { ...copy[agent], [threadId]: thread }
      return copy
    })
  }

  function downloadThread(threadId: string) {
    const thread = conversations[activeAgent][threadId]
    if (!thread) return

    let content = `Conversation Thread: ${thread.subject}\n`
    content += `Agent: ${AGENT_CONFIG[activeAgent].name}\n`
    content += `Downloaded: ${new Date().toLocaleString()}\n\n`
    content += `${'='.repeat(60)}\n\n`

    thread.messages.forEach((msg, index) => {
      const sender = msg.isUser ? 'You' : AGENT_CONFIG[activeAgent].name
      content += `Message ${index + 1} - ${sender}\n`
      content += `Date: ${new Date(msg.date).toLocaleString()}\n`
      content += `To: ${msg.to}\n\n`
      content += `${msg.body}\n\n`
      content += `${'-'.repeat(60)}\n\n`
    })

    downloadFile(content, `conversation_${AGENT_CONFIG[activeAgent].name}_${threadId}_${Date.now()}.txt`)
    showToast('Downloaded', 'Conversation downloaded successfully', 'success')
  }

  function downloadAllConversations() {
    const agentThreads = conversations[activeAgent]
    const threadKeys = Object.keys(agentThreads)
    if (threadKeys.length === 0) {
      showToast('No Conversations', 'No conversations to download', 'error')
      return
    }

    let content = `All Conversations with ${AGENT_CONFIG[activeAgent].name}\n`
    content += `Downloaded: ${new Date().toLocaleString()}\n`
    content += `Total Threads: ${threadKeys.length}\n\n`
    content += `${'='.repeat(80)}\n\n`

    threadKeys.forEach((threadId, threadIndex) => {
      const thread = agentThreads[threadId]
      content += `\n${'#'.repeat(80)}\n`
      content += `THREAD ${threadIndex + 1}: ${thread.subject}\n`
      content += `${'#'.repeat(80)}\n\n`

      thread.messages.forEach((msg, msgIndex) => {
        const sender = msg.isUser ? 'You' : AGENT_CONFIG[activeAgent].name
        content += `Message ${msgIndex + 1} - ${sender}\n`
        content += `Date: ${new Date(msg.date).toLocaleString()}\n`
        content += `To: ${msg.to}\n\n`
        content += `${msg.body}\n\n`
        content += `${'-'.repeat(60)}\n\n`
      })
    })

    downloadFile(content, `all_conversations_${AGENT_CONFIG[activeAgent].name}_${Date.now()}.txt`)
    showToast('Downloaded', `All ${Object.keys(agentThreads).length} conversations downloaded`, 'success')
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <ToastContainer />
      <div className="flex h-screen">
        <Sidebar activeAgent={activeAgent} onSelect={(agent) => handleAgentSelect(agent)} />

        <main className="flex-1 flex flex-col bg-white">
          <Header title={title} onCompose={() => showCompose()} onDownloadAll={() => downloadAllConversations()} />

          <div className="flex-1 overflow-y-auto p-4">
            {view === 'inbox' && (
              <InboxView agentKey={activeAgent} conversations={conversations} onOpenThread={(id: string) => openThread(id)} />
            )}

            {view === 'thread' && (
              <ThreadView
                thread={selectedThreadId ? conversations[activeAgent][selectedThreadId] : undefined}
                threadId={selectedThreadId ?? undefined}
                onBack={() => showInbox()}
                onSendReply={(text: string) => selectedThreadId && sendReply(selectedThreadId, text)}
                onDownloadThread={(id?: string) => id && downloadThread(id)}
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
    </div>
  )
}

export default App
