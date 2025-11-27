import React, { useRef } from 'react'
import { showToast } from '../utils/toast'

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

type ToolbarControl = {
  id: string
  label: string
  command: string
  title: string
  trackActive?: boolean
}

const replyToolbarControls: ToolbarControl[] = [
  { id: 'bold', label: 'B', command: 'bold', title: 'Bold', trackActive: true },
  { id: 'italic', label: 'I', command: 'italic', title: 'Italic', trackActive: true },
  { id: 'underline', label: 'U', command: 'underline', title: 'Underline', trackActive: true },
  { id: 'bullet', label: '•', command: 'insertUnorderedList', title: 'Bulleted list', trackActive: true },
  { id: 'number', label: '1.', command: 'insertOrderedList', title: 'Numbered list', trackActive: true },
]

export default function ThreadView({
  thread,
  threadId,
  onBack,
  onSendReply,
  onDownloadThread,
}: {
  thread?: Thread
  threadId?: string
  onBack: () => void
  onSendReply: (text: string) => void
  onDownloadThread: (id?: string) => void
}) {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const toolbarRef = useRef<HTMLDivElement | null>(null)

  if (!thread) {
    return null
  }

  function applyFormat(command: string) {
    const editor = editorRef.current
    if (!editor) return
    editor.focus()
    try {
      document.execCommand(command, false, undefined)
    } catch (e) {}
  }

  function updateToolbarState() {
    try {
      replyToolbarControls.forEach((control) => {
        if (!control.trackActive) return
        const button = toolbarRef.current?.querySelector<HTMLButtonElement>(`[data-command="${control.command}"]`)
        if (!button) return
        const isActive = document.queryCommandState(control.command)
        button.classList.toggle('active', !!isActive)
      })
    } catch (e) {}
  }

  React.useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    const handler = () => updateToolbarState()
    editor.addEventListener('keyup', handler)
    editor.addEventListener('mouseup', handler)
    editor.addEventListener('focus', handler)
    return () => {
      editor.removeEventListener('keyup', handler)
      editor.removeEventListener('mouseup', handler)
      editor.removeEventListener('focus', handler)
    }
  }, [threadId])

  return (
    <div className="thread-view mt-6" id="threadView">
      <div className="flex items-center justify-between mb-4">
        <button className="text-sm text-blue-600" id="backToInbox" onClick={onBack}>← Back to Inbox</button>
        <div>
          <button className="download-btn mr-2" onClick={() => onDownloadThread && onDownloadThread(threadId)}>📥 Download Thread</button>
        </div>
      </div>
      <div className="mb-4">
        <div className="text-lg font-semibold mb-2">{thread.subject}</div>
      </div>

      <div className="space-y-4">
        {thread.messages.map((email) => (
          <div key={email.id} className={`${email.isUser ? 'bg-amber-50 ml-auto' : 'bg-gray-50'} p-4 rounded-md`}> 
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold">{email.isUser ? 'You' : 'Agent'}</div>
                <div className="text-xs text-gray-500">to {email.to}</div>
              </div>
              <div className="text-xs text-gray-400">{new Date(email.date).toLocaleString()}</div>
            </div>
            <div className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">{email.body}</div>
          </div>
        ))}
      </div>

      <div className="reply-box mt-6">
        <div className="compose-toolbar mb-2" ref={toolbarRef}>
          {replyToolbarControls.map((control) => (
            <button
              key={control.id}
              type="button"
              className="toolbar-btn"
              data-command={control.command}
              title={control.title}
              onMouseDown={(e) => {
                e.preventDefault()
                applyFormat(control.command)
                updateToolbarState()
              }}
            >
              {control.label}
            </button>
          ))}
        </div>
        <div
          ref={editorRef}
          contentEditable
          className="compose-body-editor"
          style={{ minHeight: 100 }}
          aria-label="Reply editor"
          data-placeholder="Type your reply..."
          suppressContentEditableWarning
        />
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            className="send-btn"
            onClick={() => {
              const val = editorRef.current?.textContent?.trim() || ''
              if (!val) {
                showToast('Empty Reply', 'Please type a reply', 'error')
                return
              }
              onSendReply(val)
              if (editorRef.current) editorRef.current.innerHTML = ''
            }}
          >
            Send Reply
          </button>
        </div>
      </div>
    </div>
  )
}
