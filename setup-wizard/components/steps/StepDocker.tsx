'use client'

import { useState } from 'react'
import { StepProps } from '@/lib/types'
import { CodeBlock } from '@/components/CodeBlock'

export function StepDocker({ config, onNext, onBack }: StepProps) {
  const [confirmed, setConfirmed] = useState(false)

  const sshCmd = `ssh ${config.sshUser}@${config.serverIp}`

  const prepareCmd = `# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required utilities
sudo apt install -y curl ca-certificates ufw gnupg`

  const firewallCmd = `# Allow SSH (important — don't lock yourself out!)
sudo ufw allow ssh

# Allow PFT validator ports
sudo ufw allow 2559/tcp    # P2P peer connections
sudo ufw allow 6005/tcp    # Public JSON-RPC (optional, for external queries)

# Enable firewall
sudo ufw --force enable

# Verify rules
sudo ufw status`

  const dockerCmd = `# Install Docker using the official script
curl -fsSL https://get.docker.com | sudo sh

# Add your user to the docker group (skip if using root)
sudo usermod -aG docker $USER

# Apply group membership without logging out (if non-root)
newgrp docker`

  const verifyCmd = `# Verify Docker is installed correctly
docker --version
docker compose version`

  return (
    <div className="step-enter">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-100 mb-2">Prepare Your Server</h2>
        <p className="text-gray-400">
          Connect to your server, update packages, configure the firewall, and install Docker.
          Run each block in order.
        </p>
      </div>

      <div className="space-y-6">
        {/* Step 1: SSH */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-semibold shrink-0">1</span>
            <h3 className="text-sm font-semibold text-gray-200">Connect to your server</h3>
          </div>
          <div className="mb-3 rounded-lg border border-[#1e1f35] bg-[#08090f] p-3 space-y-1.5">
            <p className="text-xs text-gray-400 font-medium">Open a terminal on your local machine:</p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="text-gray-600">Mac / Linux</span>
              <span className="text-gray-700">—</span>
              <span>Open <strong className="text-gray-400">Terminal</strong></span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="text-gray-600">Windows</span>
              <span className="text-gray-700">—</span>
              <span>Open <strong className="text-gray-400">PowerShell</strong> or <strong className="text-gray-400">Windows Terminal</strong></span>
            </div>
          </div>
          <CodeBlock code={sshCmd} label="your local terminal" />
          <p className="text-xs text-gray-500 mt-2">
            Your VPS provider will have emailed you a root password or let you add an SSH key during setup — use that to authenticate.
            If prompted <code className="font-mono bg-[#08090f] px-1 rounded border border-[#1e1f35]">Are you sure you want to continue connecting?</code> type <code className="font-mono bg-[#08090f] px-1 rounded border border-[#1e1f35]">yes</code> and press Enter.
            When entering your password, nothing will appear as you type — no dots, no characters. This is normal SSH behaviour; just type your password and press Enter.
          </p>
        </div>

        {/* Step 2: Prepare */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-semibold shrink-0">2</span>
            <h3 className="text-sm font-semibold text-gray-200">Update packages</h3>
          </div>
          <CodeBlock code={prepareCmd} label="on your server" multiline />
        </div>

        {/* Step 3: Firewall */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-semibold shrink-0">3</span>
            <h3 className="text-sm font-semibold text-gray-200">Configure firewall</h3>
          </div>
          <CodeBlock code={firewallCmd} label="on your server" multiline />
          <div className="mt-2 flex gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/15">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400 shrink-0 mt-0.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <p className="text-xs text-amber-300/80">
              Always run <code className="font-mono bg-amber-500/10 px-1 rounded">ufw allow ssh</code> before enabling the firewall to avoid locking yourself out.
            </p>
          </div>
        </div>

        {/* Step 4: Docker */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-semibold shrink-0">4</span>
            <h3 className="text-sm font-semibold text-gray-200">Install Docker</h3>
          </div>
          <CodeBlock code={dockerCmd} label="on your server" multiline />
          <p className="text-xs text-gray-500 mt-2">
            The official Docker install script handles all dependencies automatically.
          </p>
        </div>

        {/* Step 5: Verify */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-semibold shrink-0">5</span>
            <h3 className="text-sm font-semibold text-gray-200">Verify installation</h3>
          </div>
          <CodeBlock code={verifyCmd} label="on your server" multiline />
          <p className="text-xs text-gray-500 mt-2">
            You should see version output for both Docker and Docker Compose. If you get &quot;command not found&quot;, re-run step 4.
          </p>
        </div>

        {/* Confirmation */}
        <div className="rounded-xl border border-accent/40 bg-[#0e0f1a] p-4">
          <label className="flex items-center gap-3 cursor-pointer" onClick={() => setConfirmed(!confirmed)}>
            <div
              className={`w-5 h-5 rounded flex items-center justify-center border transition-all shrink-0
                ${confirmed
                  ? 'bg-accent border-accent'
                  : 'bg-[#13141f] border-[#1e1f35] hover:border-[#2a2c45]'
                }`}
            >
              {confirmed && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <span className="text-sm text-gray-300">
              Docker is installed and <code className="font-mono text-xs bg-[#13141f] px-1 py-0.5 rounded border border-[#1e1f35]">docker compose version</code> shows a version number
            </span>
          </label>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3 mt-8">
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-400 border border-[#1e1f35]
            hover:border-[#2a2c45] hover:text-gray-300 transition-all duration-150 active:scale-95"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!confirmed}
          className={`flex items-center gap-2 px-6 py-2.5 font-semibold rounded-lg transition-all duration-150 text-sm
            ${confirmed
              ? 'bg-accent hover:bg-accent-bright text-white active:scale-95'
              : 'bg-[#1a1b2e] text-gray-600 cursor-not-allowed border border-[#1e1f35]'
            }`}
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
