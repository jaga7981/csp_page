import React, { useMemo, useState } from 'react'

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
}: {
  agents: SidebarAgent[]
  activeAgent: string
  onSelect: (agent: string) => void
}) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return agents
    return agents.filter((a) => a.name.toLowerCase().includes(term) || a.key.toLowerCase().includes(term))
  }, [search, agents])

  return (
    <aside className="w-72 bg-white border-r border-gray-200 flex flex-col agents-sidebar">
      <div className="sidebar-header">CSP Agents</div>

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

      <div className="agents-list" id="agentsList">
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
    </aside>
  )
}
