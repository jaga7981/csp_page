import React, { useMemo, useState } from 'react'

type Agent = { key: string; name: string; icon: string }

const AGENTS: Agent[] = [
  { key: 'vendor', name: 'Vendor', icon: 'V' },
  { key: 'customs', name: 'Customs Broker', icon: 'C' },
  { key: 'warehouse', name: 'Warehouse Owners', icon: 'W' },
  { key: 'port', name: 'Port Owners', icon: 'P' },
  { key: 'account', name: 'Account Manager', icon: 'A' },
  { key: 'retail', name: 'Retail Bots', icon: 'R' },
  { key: 'influencer', name: 'Influencer', icon: 'I' },
]

export default function Sidebar({
  activeAgent,
  onSelect,
}: {
  activeAgent: string
  onSelect: (agent: string) => void
}) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return AGENTS
    return AGENTS.filter((a) => a.name.toLowerCase().includes(term) || a.key.toLowerCase().includes(term))
  }, [search])

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
              </div>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
