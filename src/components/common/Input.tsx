import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-text-sub mb-1.5">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-2.5 bg-bg-card border rounded-xl text-sm text-text-main placeholder-text-muted focus:outline-none transition-colors ${
          error
            ? 'border-error/50 focus:border-error'
            : 'border-border focus:border-primary/50'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </div>
  )
}
