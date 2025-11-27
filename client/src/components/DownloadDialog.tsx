import React from 'react'
import type { DownloadScope } from '../types/download'
import type { ConversationExportFormat } from '../utils/conversationExport'

type ThreadOption = { id: string; subject: string }

type DownloadDialogProps = {
  isOpen: boolean
  scope: DownloadScope
  format: ConversationExportFormat
  threads: ThreadOption[]
  selectedThreadId: string | null
  onScopeChange: (value: DownloadScope) => void
  onFormatChange: (value: ConversationExportFormat) => void
  onThreadChange: (threadId: string | null) => void
  onClose: () => void
  onConfirm: () => void
}

const formatOptions: { label: string; value: ConversationExportFormat; description: string }[] = [
  { label: 'PDF (.pdf)', value: 'pdf', description: 'Best for sharing and printing' },
  { label: 'Text (.txt)', value: 'txt', description: 'Lightweight text archive' },
  { label: 'Word (.doc)', value: 'doc', description: 'Editable Word-compatible document' },
]

export default function DownloadDialog({
  isOpen,
  scope,
  format,
  threads,
  selectedThreadId,
  onScopeChange,
  onFormatChange,
  onThreadChange,
  onClose,
  onConfirm,
}: DownloadDialogProps) {
  if (!isOpen) {
    return null
  }

  const isSingle = scope === 'single'
  const disableConfirm = isSingle && (!selectedThreadId || threads.length === 0)

  return (
    <div className="download-dialog-backdrop" role="dialog" aria-modal="true">
      <div className="download-dialog-card">
        <div className="download-dialog-header">
          <div>
            <h3 className="download-dialog-title">Download Conversation</h3>
            <p className="download-dialog-subtitle">Export threads with timestamps and message order.</p>
          </div>
          <button type="button" className="ghost-btn icon-btn" onClick={onClose} aria-label="Close download dialog">
            ✕
          </button>
        </div>

        <div className="download-dialog-body">
          <div>
            <span className="download-field-label">Scope</span>
            <div className="download-scope-pills">
              <button
                type="button"
                className={`download-scope-pill ${scope === 'single' ? 'active' : ''}`}
                onClick={() => onScopeChange('single')}
              >
                Single thread
              </button>
              <button
                type="button"
                className={`download-scope-pill ${scope === 'all' ? 'active' : ''}`}
                onClick={() => onScopeChange('all')}
              >
                All threads
              </button>
            </div>
          </div>

          {isSingle && (
            <label className="download-field-group">
              <span className="download-field-label">Select thread</span>
              <select
                className="download-select"
                value={selectedThreadId ?? ''}
                onChange={(event) => onThreadChange(event.target.value || null)}
              >
                <option value="" disabled>
                  Choose a thread
                </option>
                {threads.map((thread) => (
                  <option key={thread.id} value={thread.id}>
                    {thread.subject}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="download-field-group">
            <span className="download-field-label">Format</span>
            <select className="download-select" value={format} onChange={(event) => onFormatChange(event.target.value as ConversationExportFormat)}>
              {formatOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} — {opt.description}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="download-dialog-footer">
          <button type="button" className="ghost-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="send-btn" onClick={onConfirm} disabled={disableConfirm}>
            Download
          </button>
        </div>
      </div>
    </div>
  )
}


