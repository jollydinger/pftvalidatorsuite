'use client'

import { useState } from 'react'

interface CodeBlockProps {
  code: string
  label?: string
  language?: string
  multiline?: boolean
}

export function CodeBlock({ code, label, multiline }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for environments without clipboard API
      const textarea = document.createElement('textarea')
      textarea.value = code
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const isMultiline = multiline || code.includes('\n')

  return (
    <div className="group relative rounded-lg overflow-hidden border border-[#1e1f35] bg-[#08090f]">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1e1f35] bg-[#0c0d18]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
          </div>
          {label && (
            <span className="text-xs text-gray-500 font-mono ml-2">{label}</span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md transition-all duration-150
            text-gray-400 hover:text-gray-200 hover:bg-white/5 active:scale-95"
        >
          {copied ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-400">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-green-400">Copied</span>
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <div className="relative overflow-x-auto">
        <pre className={`px-5 font-mono text-sm text-gray-300 leading-relaxed ${isMultiline ? 'py-4' : 'py-3'}`}>
          <code>{code}</code>
        </pre>
      </div>
    </div>
  )
}

// Inline code snippet (for single commands in prose)
export function InlineCode({ children }: { children: string }) {
  return (
    <code className="font-mono text-sm text-accent-bright bg-[#0c0d18] border border-[#1e1f35] px-1.5 py-0.5 rounded">
      {children}
    </code>
  )
}
