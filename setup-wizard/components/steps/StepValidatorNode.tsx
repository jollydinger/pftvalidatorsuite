'use client'

import { useState } from 'react'
import { StepProps } from '@/lib/types'
import { CodeBlock } from '@/components/CodeBlock'

export function StepValidatorNode({ config, onNext, onBack }: StepProps) {
  const [confirmed, setConfirmed] = useState(false)

  const mkdirCmd = `mkdir -p ~/validator && cd ~/validator`

  const downloadCmd = `# Download the official PFT validator compose file
curl -fsSL \\
  https://raw.githubusercontent.com/postfiatorg/postfiatd/main/scripts/docker-compose-validator.yml \\
  -o docker-compose-validator.yml

# Confirm it downloaded
cat docker-compose-validator.yml | head -20`

  const envCmd = `# Create your environment config
cat > .env << 'EOF'
NETWORK=${config.network}
EOF

# Verify
cat .env`

  const pullCmd = `# Pull the validator Docker image (may take a few minutes)
docker compose -f docker-compose-validator.yml --env-file .env pull

# Confirm image is available
docker images | grep postfiatd`

  const startCmd = `# Start the validator node
docker compose -f docker-compose-validator.yml --env-file .env up -d

# Watch startup logs (Ctrl+C to stop watching)
docker logs -f postfiatd 2>&1`

  const checkCmd = `# Confirm the container is running
docker ps --filter name=postfiatd

# Quick health check via JSON-RPC
curl -s -X POST http://localhost:6005 \\
  -H 'Content-Type: application/json' \\
  -d '{"method":"server_info","params":[{}]}' | python3 -m json.tool 2>/dev/null || \\
curl -s -X POST http://localhost:6005 \\
  -H 'Content-Type: application/json' \\
  -d '{"method":"server_info","params":[]}'`

  return (
    <div className="step-enter">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-100 mb-2">Validator Node Setup</h2>
        <p className="text-gray-400">
          Download the official PFT compose file, configure your network environment, and
          start your node for the first time.
        </p>
      </div>

      {/* Network badge */}
      <div className="flex items-center gap-2 mb-6 p-3 rounded-lg bg-[#0e0f1a] border border-[#1e1f35]">
        <div className={`w-2 h-2 rounded-full animate-pulse-slow ${config.network === 'testnet' ? 'bg-green-400' : 'bg-yellow-400'}`} />
        <span className="text-sm text-gray-300">
          Configuring for <span className="font-semibold text-gray-100">{config.network === 'testnet' ? 'Testnet' : 'Devnet'}</span>
        </span>
      </div>

      <div className="space-y-6">
        {/* Step 1 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-semibold shrink-0">1</span>
            <h3 className="text-sm font-semibold text-gray-200">Create validator directory</h3>
          </div>
          <CodeBlock code={mkdirCmd} label={`${config.sshUser}@${config.serverIp}`} />
        </div>

        {/* Step 2 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-semibold shrink-0">2</span>
            <h3 className="text-sm font-semibold text-gray-200">Download the official compose file</h3>
          </div>
          <CodeBlock code={downloadCmd} label={`${config.sshUser}@${config.serverIp} ~/validator`} multiline />
          <p className="text-xs text-gray-500 mt-2">
            This is the official validator configuration from the Post Fiat GitHub repository.
          </p>
        </div>

        {/* Step 3 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-semibold shrink-0">3</span>
            <h3 className="text-sm font-semibold text-gray-200">Create environment file</h3>
          </div>
          <CodeBlock code={envCmd} label={`${config.sshUser}@${config.serverIp} ~/validator`} multiline />
        </div>

        {/* Step 4 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-semibold shrink-0">4</span>
            <h3 className="text-sm font-semibold text-gray-200">Pull the validator image</h3>
          </div>
          <CodeBlock code={pullCmd} label={`${config.sshUser}@${config.serverIp} ~/validator`} multiline />
          <p className="text-xs text-gray-500 mt-2">
            The image is ~500MB. This step requires a good internet connection and may take a few minutes.
          </p>
        </div>

        {/* Step 5 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-semibold shrink-0">5</span>
            <h3 className="text-sm font-semibold text-gray-200">Start your node</h3>
          </div>
          <CodeBlock code={startCmd} label={`${config.sshUser}@${config.serverIp} ~/validator`} multiline />
          <p className="text-xs text-gray-500 mt-2">
            The node will take 30–60 seconds to initialize and begin syncing. Press Ctrl+C to stop following logs.
          </p>
        </div>

        {/* Step 6 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-semibold shrink-0">6</span>
            <h3 className="text-sm font-semibold text-gray-200">Verify it&apos;s running</h3>
          </div>
          <CodeBlock code={checkCmd} label={`${config.sshUser}@${config.serverIp} ~/validator`} multiline />
        </div>

        {/* What to expect */}
        <div className="rounded-xl border border-[#1e1f35] bg-[#0e0f1a] p-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">What to expect from the RPC response</h4>
          <div className="space-y-2">
            {[
              { state: 'connected', color: 'text-yellow-400', desc: 'Normal on startup — node is connecting to peers' },
              { state: 'syncing', color: 'text-yellow-400', desc: 'Downloading and verifying ledger history' },
              { state: 'tracking', color: 'text-blue-400', desc: 'Caught up with peers, not yet voting' },
              { state: 'proposing / validating', color: 'text-green-400', desc: 'Fully operational — participating in consensus' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <code className={`font-mono text-xs ${item.color} shrink-0 mt-0.5`}>{item.state}</code>
                <span className="text-xs text-gray-500">{item.desc}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-3">
            It may take several minutes to reach &quot;tracking&quot; state on first boot. This is normal.
          </p>
        </div>

        {/* Confirmation */}
        <div className="rounded-xl border border-[#1e1f35] bg-[#0e0f1a] p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setConfirmed(!confirmed)}
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
              My validator container is running and I can see a response from the JSON-RPC endpoint
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
