'use client'

import { useState } from 'react'
import { StepProps } from '@/lib/types'

const VPS_PROVIDERS = [
  {
    name: 'Hetzner',
    desc: 'Best value — popular with validators',
    price: 'from ~$7/mo',
    url: 'https://www.hetzner.com/cloud',
    badge: 'Recommended',
    badgeColor: 'text-green-400 bg-green-400/10 border-green-400/20',
  },
  {
    name: 'DigitalOcean',
    desc: 'Developer-friendly, great docs',
    price: 'from ~$24/mo',
    url: 'https://www.digitalocean.com/products/droplets',
    badge: null,
    badgeColor: '',
  },
  {
    name: 'Vultr',
    desc: 'Global locations, competitive pricing',
    price: 'from ~$20/mo',
    url: 'https://www.vultr.com/products/cloud-compute/',
    badge: null,
    badgeColor: '',
  },
  {
    name: 'AWS / GCP / Azure',
    desc: 'Enterprise-grade infrastructure',
    price: 'varies',
    url: 'https://aws.amazon.com/ec2/',
    badge: 'Enterprise',
    badgeColor: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  },
]

function isValidIp(ip: string) {
  if (!ip) return false
  // Allow both IPv4 and hostnames
  return ip.length > 0
}

export function StepServer({ config, setConfig, onNext, onBack }: StepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!isValidIp(config.serverIp)) {
      newErrors.serverIp = 'Please enter your server IP address or hostname'
    }
    if (!config.sshUser.trim()) {
      newErrors.sshUser = 'SSH username is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validate()) onNext()
  }

  return (
    <div className="step-enter">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-100 mb-2">Server Provisioning</h2>
        <p className="text-gray-400">
          Choose and provision a VPS. Enter your server details below — these will be used to
          generate personalized commands throughout the setup.
        </p>
      </div>

      {/* VPS Providers */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Choose a VPS Provider</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {VPS_PROVIDERS.map((provider) => (
            <a
              key={provider.name}
              href={provider.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 p-4 rounded-lg border border-[#1e1f35] bg-[#0e0f1a]
                hover:border-[#2a2c45] hover:bg-[#13141f] transition-all duration-150 group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-200 text-sm">{provider.name}</span>
                  {provider.badge && (
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${provider.badgeColor}`}>
                      {provider.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{provider.desc}</p>
                <p className="text-xs text-gray-600 mt-1">{provider.price}</p>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className="text-gray-600 group-hover:text-gray-400 transition-colors shrink-0 mt-1">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Spin up an Ubuntu 22.04 instance with at least 4 vCPU / 8 GB RAM / 100 GB SSD. Then come back here.
        </p>
      </div>

      {/* Server details form */}
      <div className="rounded-xl border border-[#1e1f35] bg-[#0e0f1a] p-5 mb-8">
        <h3 className="text-sm font-semibold text-gray-300 mb-5">Your Server Details</h3>

        <div className="grid sm:grid-cols-2 gap-5">
          {/* IP Address */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Server IP Address <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={config.serverIp}
              onChange={(e) => {
                setConfig({ serverIp: e.target.value })
                if (errors.serverIp) setErrors((prev) => ({ ...prev, serverIp: '' }))
              }}
              placeholder="e.g. 192.168.1.100"
              className={`w-full px-3 py-2.5 rounded-lg font-mono text-sm bg-[#13141f] border transition-colors
                text-gray-200 placeholder-gray-600
                ${errors.serverIp
                  ? 'border-red-500/50 focus:border-red-500'
                  : 'border-[#1e1f35] focus:border-accent/50'
                }`}
            />
            {errors.serverIp && (
              <p className="text-xs text-red-400 mt-1">{errors.serverIp}</p>
            )}
          </div>

          {/* SSH Username */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              SSH Username <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={config.sshUser}
              onChange={(e) => {
                setConfig({ sshUser: e.target.value })
                if (errors.sshUser) setErrors((prev) => ({ ...prev, sshUser: '' }))
              }}
              placeholder="root"
              className={`w-full px-3 py-2.5 rounded-lg font-mono text-sm bg-[#13141f] border transition-colors
                text-gray-200 placeholder-gray-600
                ${errors.sshUser
                  ? 'border-red-500/50 focus:border-red-500'
                  : 'border-[#1e1f35] focus:border-accent/50'
                }`}
            />
            {errors.sshUser && (
              <p className="text-xs text-red-400 mt-1">{errors.sshUser}</p>
            )}
            <p className="text-xs text-gray-600 mt-1">Usually &apos;root&apos; for a fresh VPS</p>
          </div>
        </div>

        {/* Network selection */}
        <div className="mt-5">
          <label className="block text-xs font-medium text-gray-400 mb-2">Network</label>
          <div className="flex gap-3">
            {(['mainnet', 'devnet'] as const).map((net) => (
              <button
                key={net}
                onClick={() => setConfig({ network: net })}
                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-sm font-medium border transition-all duration-150 ${
                  config.network === net
                    ? 'bg-accent/10 border-accent/30 text-accent-bright'
                    : 'bg-[#13141f] border-[#1e1f35] text-gray-400 hover:border-[#2a2c45]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${net === 'mainnet' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                  {net === 'mainnet' ? 'Mainnet' : 'Devnet (testing)'}
                </div>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-2">
            {config.network === 'mainnet'
              ? 'Live network — your validator will participate in real consensus.'
              : 'Test network — safe for experimentation and learning.'}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-400 border border-[#1e1f35]
            hover:border-[#2a2c45] hover:text-gray-300 transition-all duration-150 active:scale-95"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="flex items-center gap-2 px-6 py-2.5 bg-accent hover:bg-accent-bright text-white
            font-semibold rounded-lg transition-all duration-150 active:scale-95 text-sm"
        >
          Continue
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  )
}
