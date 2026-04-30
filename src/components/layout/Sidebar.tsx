import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Home,
  Settings,
  FolderOpen,
  Cpu,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useAppStore } from '../../stores/useAppStore'

const navItems = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/editor', icon: FolderOpen, label: '编辑器' },
  { path: '/settings', icon: Settings, label: '设置' },
]

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar } = useAppStore()
  const location = useLocation()

  return (
    <aside
      className={`relative flex flex-col bg-bg-surface border-r border-border transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-56'
      }`}
    >
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20">
          <Cpu size={18} className="text-primary" />
        </div>
        {!sidebarCollapsed && (
          <span className="font-bold text-text-main tracking-tight">
            VNForge
          </span>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive =
            path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(path)
          return (
            <NavLink
              key={path}
              to={path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-text-sub hover:text-text-main hover:bg-white/5'
              }`}
            >
              <Icon size={20} className="flex-shrink-0" />
              {!sidebarCollapsed && (
                <span className="text-sm font-medium">{label}</span>
              )}
            </NavLink>
          )
        })}
      </nav>

      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-bg-card border border-border flex items-center justify-center text-text-sub hover:text-text-main hover:border-primary/30 transition-colors"
      >
        {sidebarCollapsed ? (
          <ChevronRight size={12} />
        ) : (
          <ChevronLeft size={12} />
        )}
      </button>
    </aside>
  )
}
