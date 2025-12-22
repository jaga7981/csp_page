import React, { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'

export type SidebarAgent = {
  key: string
  name: string
  icon: string
  unreadCount?: number
}

export default function Sidebar({
  agents,
  activeAgent,
  onSelect,
  onLogout,
}: {
  agents: SidebarAgent[]
  activeAgent: string
  onSelect: (agent: string) => void
  onLogout?: () => void
}) {
  const { user } = useAuth()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return agents
    return agents.filter((a) => a.name.toLowerCase().includes(term) || a.key.toLowerCase().includes(term))
  }, [search, agents])

  return (
    <aside className="w-72 bg-white border-r border-gray-200 flex flex-col agents-sidebar">
      <div className="sidebar-header flex justify-between items-center px-4 py-4">
        <span>CSP Agents</span>
      </div>

      <div className="agent-search-container">
        <input
          type="text"
          id="agentSearch"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search agents..."
          className="agent-search-input"
        />
      </div>

      <div className="agents-list flex-1" id="agentsList">
        {filtered.map((a) => {
          const isActive = activeAgent === a.key
          const unreadCount = a.unreadCount ?? 0
          return (
            <button
              type="button"
              key={a.key}
              className={`agent-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelect(a.key)}
              data-agent={a.key}
            >
              <div className={`agent-icon ${isActive ? '' : ''}`}>{a.icon}</div>
              <div className="agent-info">
                <div className={`agent-name ${isActive ? '' : ''}`}>{a.name}</div>
                {unreadCount > 0 && <span className="agent-unread-badge">{unreadCount}</span>}
              </div>
            </button>
          )
        })}
      </div>

      {user && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            {user.picture ? (
              <img src={user.picture} alt={user.username} className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                {user.username[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.username}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <span>🚪 Logout</span>
          </button>
        </div>
      )}
    </aside>
  )
}
