import React, { useEffect, useRef, useState } from 'react'
import { showToast } from '../utils/toast'

type ToolbarControl = {
  id: string
  label?: string
  command?: string
  title?: string
  isDivider?: boolean
  trackActive?: boolean
  action?: 'undo' | 'redo'
}

const toolbarControls: ToolbarControl[] = [
  { id: 'undo', label: '↶', action: 'undo', title: 'Undo' },
  { id: 'redo', label: '↷', action: 'redo', title: 'Redo' },
  { id: 'divider-0', isDivider: true },
  { id: 'bold', label: 'B', command: 'bold', title: 'Bold', trackActive: true },
  { id: 'italic', label: 'I', command: 'italic', title: 'Italic', trackActive: true },
  { id: 'underline', label: 'U', command: 'underline', title: 'Underline', trackActive: true },
  { id: 'strike', label: 'S', command: 'strikeThrough', title: 'Strikethrough', trackActive: true },
  { id: 'divider-1', isDivider: true },
  { id: 'bullet', label: '•', command: 'insertUnorderedList', title: 'Bulleted list', trackActive: true },
  { id: 'number', label: '1.', command: 'insertOrderedList', title: 'Numbered list', trackActive: true },
]

type SavedDraft = {
  id: string
  agentKey?: string
  subject: string
  body: string
  updatedAt: string
}

export default function ComposeView({
  toEmail,
  subject,
  agentKey,
  agentName,
  presetMessage,
  messageCount,
  limitReached,
  onBack,
  onSend,
}: {
  toEmail?: string
  subject?: string
  agentKey?: string
  agentName?: string
  presetMessage?: string
  messageCount?: number
  limitReached?: boolean
  onBack: () => void
  onSend: (subject: string, body: string) => void
}) {
  const [subj, setSubj] = useState(subject ?? '')
  const [ccValue, setCcValue] = useState('')
  const editorRef = useRef<HTMLDivElement | null>(null)
  const toolbarRef = useRef<HTMLDivElement | null>(null)
  const [draftExists, setDraftExists] = useState(false)
  const draftBootstrappedRef = useRef(false)
  const [savedDrafts, setSavedDrafts] = useState<SavedDraft[]>([])
  const [isDraftMenuOpen, setIsDraftMenuOpen] = useState(false)
  const draftMenuRef = useRef<HTMLDivElement | null>(null)
  const [layoutMode, setLayoutMode] = useState<'normal' | 'maximized'>('normal')
  const selectionRangeRef = useRef<Range | null>(null)
  const historyRef = useRef<string[]>([''])
  const historyIndexRef = useRef(0)

  useEffect(() => {
    if (subject) setSubj(subject)
  }, [subject])

  // Load draft for this agent (if any)
  useEffect(() => {
    if (!agentKey) return
    draftBootstrappedRef.current = false
    if (editorRef.current) editorRef.current.innerHTML = ''
    setCcValue('')
    setDraftExists(false)
    const defaultSubject = subject ?? ''
    setSubj(defaultSubject)
    try {
      const raw = localStorage.getItem(`draft_${agentKey}`)
      if (raw) {
        const d = JSON.parse(raw)
        if (typeof d.subject === 'string') setSubj(d.subject)
        if (d.body && editorRef.current) editorRef.current.innerHTML = d.body
        setDraftExists(!!(d.body || d.subject))
      }
    } catch (e) { }
    resetHistory(editorRef.current?.innerHTML || '')
    saveSelection()
    draftBootstrappedRef.current = true
  }, [agentKey, subject])

  // Load saved drafts list once
  useEffect(() => {
    try {
      const raw = localStorage.getItem('saved_drafts')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setSavedDrafts(parsed)
        }
      }
    } catch (e) { }
  }, [])

  // Close draft dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!isDraftMenuOpen) return
      if (draftMenuRef.current && !draftMenuRef.current.contains(event.target as Node)) {
        setIsDraftMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isDraftMenuOpen])

  function syncSavedDrafts(next: SavedDraft[]) {
    setSavedDrafts(next)
    try {
      localStorage.setItem('saved_drafts', JSON.stringify(next))
    } catch (e) { }
  }

  function filteredDrafts() {
    if (!agentKey) return savedDrafts
    return savedDrafts.filter((draft) => draft.agentKey === agentKey)
  }

  function applyFormat(command: string) {
    const editor = editorRef.current
    if (!editor) return
    restoreSelection()
    editor.focus()
    try {
      document.execCommand(command, false, undefined)
    } catch (e) { }
    saveSelection()
    recordHistory()
  }

  function persistDraft(customBody?: string) {
    if (!agentKey) return
    if (!draftBootstrappedRef.current) return
    const body = customBody ?? editorRef.current?.textContent ?? ''
    const data = { subject: subj, body }
    try {
      localStorage.setItem(`draft_${agentKey}`, JSON.stringify(data))
      setDraftExists(body.trim().length > 0 || subj.trim().length > 0)
    } catch (e) { }
  }

  function updateToolbarState() {
    try {
      toolbarControls.forEach((control) => {
        if (!control.trackActive || !control.command) return
        const button = toolbarRef.current?.querySelector<HTMLButtonElement>(`[data-command="${control.command}"]`)
        if (!button) return
        const isActive = document.queryCommandState(control.command)
        button.classList.toggle('active', !!isActive)
      })
    } catch (e) { }
    persistDraft()
  }

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    const handleSelectionChange = () => {
      saveSelection()
      updateToolbarState()
    }
    const handleInput = () => {
      saveSelection()
      recordHistory()
      updateToolbarState()
    }

    editor.addEventListener('keyup', handleSelectionChange)
    editor.addEventListener('mouseup', handleSelectionChange)
    editor.addEventListener('focus', handleSelectionChange)
    editor.addEventListener('input', handleInput)
    return () => {
      editor.removeEventListener('keyup', handleSelectionChange)
      editor.removeEventListener('mouseup', handleSelectionChange)
      editor.removeEventListener('focus', handleSelectionChange)
      editor.removeEventListener('input', handleInput)
    }
  }, [editorRef, subj, agentKey])

  useEffect(() => {
    persistDraft()
  }, [subj])

  function saveSelection() {
    const editor = editorRef.current
    if (!editor) return
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return
    const range = selection.getRangeAt(0)
    if (!editor.contains(range.startContainer)) return
    selectionRangeRef.current = range.cloneRange()
  }

  function restoreSelection() {
    const editor = editorRef.current
    if (!editor) return
    const selection = window.getSelection()
    const range = selectionRangeRef.current
    if (!selection || !range) return
    selection.removeAllRanges()
    selection.addRange(range)
  }

  function resetHistory(initialHtml: string) {
    historyRef.current = [initialHtml]
    historyIndexRef.current = 0
  }

  function recordHistory() {
    const editor = editorRef.current
    if (!editor) return
    const html = editor.innerHTML
    const history = historyRef.current
    const idx = historyIndexRef.current
    if (history[idx] === html) return
    const next = history.slice(0, idx + 1)
    next.push(html)
    if (next.length > 50) next.shift()
    historyRef.current = next
    historyIndexRef.current = next.length - 1
  }

  function applyHistoryState() {
    const editor = editorRef.current
    if (!editor) return
    const history = historyRef.current
    const idx = historyIndexRef.current
    editor.innerHTML = history[idx] || ''
    placeCaretAtEnd(editor)
    saveSelection()
    updateToolbarState()
  }

  function undoHistory() {
    if (historyIndexRef.current <= 0) return
    historyIndexRef.current -= 1
    applyHistoryState()
  }

  function redoHistory() {
    if (historyIndexRef.current >= historyRef.current.length - 1) return
    historyIndexRef.current += 1
    applyHistoryState()
  }

  function placeCaretAtEnd(element: HTMLElement) {
    const range = document.createRange()
    range.selectNodeContents(element)
    range.collapse(false)
    const selection = window.getSelection()
    if (!selection) return
    selection.removeAllRanges()
    selection.addRange(range)
    selectionRangeRef.current = range
  }

  function handleManualSave() {
    const bodyHtml = editorRef.current?.innerHTML || ''
    const bodyText = editorRef.current?.textContent?.trim() || ''
    const subjectText = subj.trim() || 'Untitled draft'

    if (!bodyText && !subjectText) {
      showToast('Empty Draft', 'Add a subject or message before saving.', 'error')
      return
    }

    const newDraft: SavedDraft = {
      id: `draft_${Date.now()}`,
      agentKey,
      subject: subjectText,
      body: bodyHtml || bodyText,
      updatedAt: new Date().toISOString(),
    }
    const next = [newDraft, ...savedDrafts].slice(0, 25)
    syncSavedDrafts(next)
    setIsDraftMenuOpen(false)
    showToast('Draft Saved', 'Draft added to your saved list.', { type: 'success', position: 'bottom-right', duration: 1600 })
  }

  function handleSelectDraft(draft: SavedDraft) {
    setSubj(draft.subject)
    if (editorRef.current) {
      editorRef.current.innerHTML = draft.body
    }
    setIsDraftMenuOpen(false)
    resetHistory(editorRef.current?.innerHTML || '')
    saveSelection()
    recordHistory()
    updateToolbarState()
    showToast('Draft Loaded', 'Draft content restored.', { type: 'info', position: 'bottom-right', duration: 1600 })
  }

  function toggleMaximize() {
    setLayoutMode((prev) => (prev === 'maximized' ? 'normal' : 'maximized'))
  }

  function minimizeComposer() {
    setLayoutMode('normal')
  }

  function handleSend() {
    const bodyText = editorRef.current?.textContent?.trim() ?? ''
    const subjectText = subj.trim()
    if (!subjectText || !bodyText) {
      showToast('Missing Information', 'Please fill in both subject and message', 'error')
      return
    }
    onSend(subjectText, bodyText)
    setSubj('')
    setCcValue('')
    if (editorRef.current) editorRef.current.innerHTML = ''
    resetHistory('')
    saveSelection()
    if (agentKey) {
      localStorage.removeItem(`draft_${agentKey}`)
      setDraftExists(false)
    }
  }

  function handleAutofill() {
    const editor = editorRef.current
    if (!editor) return
    const existing = editor.textContent?.trim()
    if (existing) {
      if (!confirm('This will replace your current message. Continue?')) return
    }
    editor.textContent = presetMessage || `Hello ${agentName || ''},\n\n`
    setSubj(`Inquiry: ${agentName || toEmail || ''} Services`)
    editor.focus()
    resetHistory(editor.innerHTML || '')
    saveSelection()
    recordHistory()
    updateToolbarState()
    showToast('Template Inserted', 'Autofill message added to the draft', { type: 'info', position: 'bottom-right', duration: 1600 })
  }

  const composeViewClasses = `compose-view ${layoutMode === 'maximized' ? 'compose-view--max' : ''}`
  const composeCardClasses = `compose-card ${layoutMode === 'maximized' ? 'compose-card--max' : ''}`

  return (
    <div className={composeViewClasses} id="composeView" style={{ marginTop: '-20px' }}>
      <div className={composeCardClasses}>
        <div className="compose-card-header">
          <span className="compose-card-title">New message</span>
          <div className="compose-window-controls flex items-center gap-2">
            {messageCount !== undefined && (
              <span className={`text-xs font-medium px-2 py-1 rounded ${(messageCount || 0) >= 16 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                }`}>
                {messageCount}/20
              </span>
            )}
            <button type="button" className="ghost-btn icon-btn" onClick={minimizeComposer} title="Minimize composer">
              ▭
            </button>
            <button type="button" className="ghost-btn icon-btn" onClick={toggleMaximize} title="Maximize composer">
              {layoutMode === 'maximized' ? '🗗' : '🗖'}
            </button>
            <button type="button" className="ghost-btn icon-btn" onClick={onBack} aria-label="Close composer">
              ✕
            </button>
          </div>
        </div>

        <div className="compose-fields">
          <div className="compose-field-row">
            <span className="compose-field-label">To</span>
            <input type="email" id="toEmail" readOnly value={toEmail ?? ''} className="compose-field-input" />
          </div>

          <div className="compose-field-row">
            <span className="compose-field-label">Cc</span>
            <input
              type="email"
              id="ccEmail"
              placeholder="Add Cc (optional)"
              className="compose-field-input"
              value={ccValue}
              onChange={(e) => setCcValue(e.target.value)}
            />
          </div>

          <div className="compose-field-row">
            <span className="compose-field-label">Subject</span>
            <input
              type="text"
              id="subjectInput"
              placeholder="Add a subject"
              value={subj}
              onChange={(e) => setSubj(e.target.value)}
              className="compose-field-input"
            />
          </div>
        </div>

        <div className="compose-toolbar" ref={toolbarRef}>
          {toolbarControls.map((control) =>
            control.isDivider ? (
              <span key={control.id} className="toolbar-divider" aria-hidden="true"></span>
            ) : (
              <button
                type="button"
                key={control.id}
                className="toolbar-btn"
                data-command={control.command}
                title={control.title}
                onMouseDown={(e) => {
                  e.preventDefault()
                  if (control.action === 'undo') {
                    undoHistory()
                    return
                  }
                  if (control.action === 'redo') {
                    redoHistory()
                    return
                  }
                  if (control.command) {
                    applyFormat(control.command)
                    updateToolbarState()
                  }
                }}
              >
                {control.label}
              </button>
            )
          )}

          <div className="draft-menu" ref={draftMenuRef}>
            <button
              type="button"
              className="ghost-btn"
              onClick={(e) => {
                e.preventDefault()
                setIsDraftMenuOpen((prev) => !prev)
              }}
            >
              Drafts ▾
            </button>
            {isDraftMenuOpen && (
              <div className="draft-menu-panel">
                {filteredDrafts().length === 0 && <div className="draft-menu-empty">No saved drafts</div>}
                {filteredDrafts().map((draft) => (
                  <button key={draft.id} type="button" className="draft-menu-item" onClick={() => handleSelectDraft(draft)}>
                    <div className="draft-menu-title">{draft.subject || 'Untitled draft'}</div>
                    <div className="draft-menu-meta">{new Date(draft.updatedAt).toLocaleString()}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="compose-body-wrapper">
          {limitReached ? (
            <div className="p-8 text-center text-gray-500 bg-gray-50 h-full flex flex-col items-center justify-center">
              <p className="text-lg font-medium text-red-600 mb-2">Session Limit Reached</p>
              <p>You have reached the maximum number of messages for this session.</p>
              <p className="text-sm mt-2">Please download your chat history to continue.</p>
            </div>
          ) : (
            <div
              id="messageBody"
              ref={editorRef}
              contentEditable={!limitReached}
              suppressContentEditableWarning
              data-placeholder="Type your message here..."
              className="compose-body-editor"
              aria-label="Message body"
            />
          )}
        </div>

        <div className="compose-footer">
          <div className="compose-actions">
            <button
              type="button"
              className={`send-btn ${limitReached ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleSend}
              disabled={limitReached}
            >
              Send
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={(e) => {
                e.preventDefault()
                handleManualSave()
              }}
            >
              Save Draft
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={(e) => {
                e.preventDefault()
                handleAutofill()
              }}
            >
              Autofill Message
            </button>
          </div>
          {draftExists && <div className="draft-indicator">Draft saved</div>}
        </div>
      </div>
    </div>
  )
}
