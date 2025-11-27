import React from 'react'

export default function Header({
  title,
  downloadLabel,
  onCompose,
  onDownload,
}: {
  title: string
  downloadLabel: string
  onCompose: () => void
  onDownload: () => void
}) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-b from-gray-50 to-gray-100">
      <h2 id="headerTitle" className="text-lg font-bold text-gray-900">{title}</h2>
      <div className="flex items-center gap-3">
        <button
          className="px-3 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700"
          onClick={onDownload}
          title="Download conversations"
        >
          {downloadLabel}
        </button>
        <button
          className="px-5 py-2 rounded-full text-white font-bold bg-gradient-to-br from-amber-400 to-orange-500 shadow-md hover:opacity-95"
          onClick={onCompose}
        >
          + Compose
        </button>
      </div>
    </header>
  )
}
