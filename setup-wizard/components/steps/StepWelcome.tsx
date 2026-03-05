'use client'

import { StepProps } from '@/lib/types'

export function StepWelcome({ onNext }: StepProps) {
  const requirements = [
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>
      ),
      label: 'A VPS or dedicated server',
      detail: 'Ubuntu 22.04+ recommended',
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      label: '~15 minutes of your time',
      detail: 'No prior DevOps experience needed',
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
      label: '$20–50/month server budget',
      detail: 'Hetzner, DigitalOcean, or any VPS',
    },
  ]

  const optional = [
    { label: 'A domain name', detail: 'For validator identity verification' },
    { label: 'Discord or Slack workspace', detail: 'For real-time health alerts' },
  ]

  const included = [
    'Guided step-by-step commands',
    'Personalized to your server IP & config',
    'Automated health monitoring sidecar',
    'Discord & Slack alert integration',
    'Domain identity verification',
  ]

  return (
    <div className="step-enter">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent-bright text-xs font-medium mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-slow" />
          Post Fiat Network
        </div>
        <h1 className="text-3xl font-bold text-gray-100 mb-3">
          Let&apos;s set up your PFT Validator
        </h1>
        <p className="text-gray-400 text-lg leading-relaxed">
          This wizard walks you through everything — from provisioning a server to running a
          fully monitored, production-ready validator on the Post Fiat network.
          No DevOps experience required.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mb-8">
        {/* What you need */}
        <div className="rounded-xl border border-[#1e1f35] bg-[#0e0f1a] p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            What you&apos;ll need
          </h2>
          <div className="flex flex-col gap-3">
            {requirements.map((req, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="text-accent mt-0.5 shrink-0">{req.icon}</div>
                <div>
                  <p className="text-sm text-gray-200 font-medium">{req.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{req.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-[#1e1f35]">
            <p className="text-xs text-gray-500 mb-2.5 font-medium">Optional but recommended</p>
            <div className="flex flex-col gap-2">
              {optional.map((opt, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-gray-600 mt-1.5 shrink-0" />
                  <div>
                    <span className="text-sm text-gray-400">{opt.label}</span>
                    <span className="text-xs text-gray-600 ml-1.5">{opt.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* What's included */}
        <div className="rounded-xl border border-accent/20 bg-accent-glow p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            What&apos;s included
          </h2>
          <div className="flex flex-col gap-2.5">
            {included.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-400 shrink-0">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-sm text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Server specs */}
      <div className="rounded-xl border border-[#1e1f35] bg-[#0e0f1a] p-5 mb-8">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">Minimum server requirements</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'CPU', value: '4 vCPU', sub: 'x86_64' },
            { label: 'RAM', value: '8 GB', sub: 'minimum' },
            { label: 'Storage', value: '100 GB', sub: 'SSD recommended' },
            { label: 'OS', value: 'Ubuntu', sub: '22.04+ LTS' },
          ].map((spec, i) => (
            <div key={i} className="text-center p-3 rounded-lg bg-[#13141f]">
              <p className="text-xs text-gray-500 mb-1">{spec.label}</p>
              <p className="text-lg font-semibold text-gray-200">{spec.value}</p>
              <p className="text-xs text-gray-600 mt-0.5">{spec.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onNext}
        className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5
          bg-accent hover:bg-accent-bright text-white font-semibold rounded-lg
          transition-all duration-150 active:scale-95 shadow-[0_0_20px_rgba(79,142,247,0.3)]"
      >
        Start Setup
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </button>
    </div>
  )
}
