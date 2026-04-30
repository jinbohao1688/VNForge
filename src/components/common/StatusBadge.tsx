import React from 'react'
import type { ProjectStatus } from '../../types'

interface StatusBadgeProps {
  status: ProjectStatus
}

const statusConfig: Record<
  ProjectStatus,
  { label: string; className: string }
> = {
  planning: {
    label: '规划中',
    className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  writing: {
    label: '创作中',
    className: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
  developing: {
    label: '开发中',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  completed: {
    label: '已完成',
    className: 'bg-green-500/10 text-green-400 border-green-500/20',
  },
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status] ?? statusConfig.planning
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}
    >
      {config.label}
    </span>
  )
}
