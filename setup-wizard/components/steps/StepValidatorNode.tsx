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

  const promtailConfigCmd = `cat > promtail-config.yml << 'EOF'
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: postfiatd
    static_configs:
      - targets:
          - localhost
        labels:
          job: postfiatd
          __path__: /var/log/postfiatd/*.log
EOF`

  const startCmd = `# Start the validator node
docker compose -f docker-compose-validator.yml --env-file .env up -d`

  const logsCmd = `# Watch startup logs
docker logs -f postfiatd 2>&1`

  const checkCmd = `# Confirm the container is running
docker ps --filter name=postfiatd

# Quick health check via JSON-RPC (admin port 5005)
curl -s -X POST http://localhost:5005 \\
  -H 'Content-Type: application/json' \\
  -d '{"method":"server_info","params":[{}]}' | python3 -m json.tool`

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
            <h3 className="text-sm font-semibold text-gray-200">Create Promtail config</h3>
          </div>
          <CodeBlock code={promtailConfigCmd} label={`${config.sshUser}@${config.serverIp} ~/validator`} multiline />
          <p className="text-xs text-gray-500 mt-2">
            The compose file requires this config to exist before starting — without it, Docker creates a directory here and promtail fails to launch.
          </p>
        </div>

        {/* Step 6 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-semibold shrink-0">6</span>
            <h3 className="text-sm font-semibold text-gray-200">Start your node</h3>
          </div>
          <CodeBlock code={startCmd} label={`${config.sshUser}@${config.serverIp} ~/validator`} multiline />
        </div>

        {/* Step 7 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-semibold shrink-0">7</span>
            <h3 className="text-sm font-semibold text-gray-200">Watch startup logs</h3>
          </div>
          <CodeBlock code={logsCmd} label={`${config.sshUser}@${config.serverIp} ~/validator`} multiline />
          <p className="text-xs text-gray-500 mt-2">
            Wait until you see <code className="font-mono text-xs bg-[#08090f] px-1 rounded border border-[#1e1f35]">STATE-&gt;connected</code> or peer connection lines in the output — this takes 30–60 seconds. The node will continue syncing in the background after you press Ctrl+C. Reaching <code className="font-mono text-xs bg-[#08090f] px-1 rounded border border-[#1e1f35]">full</code> state on first boot typically takes 5–10 minutes.
          </p>
        </div>

        {/* Ctrl+C gate */}
        <div className="rounded-xl border-2 border-accent/30 bg-accent/5 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-bright">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                <line x1="12" y1="12" x2="12" y2="16" />
                <line x1="10" y1="14" x2="14" y2="14" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-accent-bright">Press Ctrl+C now to stop following logs</p>
              <p className="text-xs text-gray-400 mt-0.5">You must exit the log stream before running any further commands.</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-center gap-4 py-3 rounded-lg bg-[#08090f] border border-accent/20">
            <kbd className="px-3 py-1.5 rounded-md bg-[#1a1b2e] border border-[#2a2c45] text-sm font-mono font-semibold text-gray-200 shadow-sm">Ctrl</kbd>
            <span className="text-gray-500 font-medium">+</span>
            <kbd className="px-3 py-1.5 rounded-md bg-[#1a1b2e] border border-[#2a2c45] text-sm font-mono font-semibold text-gray-200 shadow-sm">C</kbd>
          </div>
        </div>

        {/* Step 8 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-semibold shrink-0">8</span>
            <h3 className="text-sm font-semibold text-gray-200">Verify it&apos;s running</h3>
          </div>
          <CodeBlock code={checkCmd} label={`${config.sshUser}@${config.serverIp} ~/validator`} multiline />
        </div>

        {/* What to expect */}
        <div className="rounded-xl border border-[#1e1f35] bg-[#0e0f1a] p-4 space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Step 1 — docker ps output</h4>
            <p className="text-xs text-gray-500 mb-2">
              If you see a row with <code className="font-mono bg-[#08090f] px-1 rounded border border-[#1e1f35] text-green-400">Up X minutes</code> and all ports listed, your node is running. That&apos;s all you need to confirm at this stage.
            </p>
            <pre className="font-mono text-xs text-gray-500 bg-[#08090f] rounded-lg p-3 overflow-x-auto leading-relaxed">{`CONTAINER ID   IMAGE                           STATUS         NAMES
6a321a1bb8f8   agtipft/postfiatd:testnet-...   Up 2 minutes   postfiatd`}</pre>
          </div>

          <div className="border-t border-[#1e1f35] pt-4">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Step 2 — JSON-RPC server_state</h4>
            <p className="text-xs text-gray-500 mb-3">
              The curl response will include a <code className="font-mono bg-[#08090f] px-1 rounded border border-[#1e1f35]">server_state</code> field. These are the expected values in order:
            </p>
            <div className="space-y-2">
              {[
                { state: 'connected', color: 'text-yellow-400', desc: 'Normal on startup — node is connecting to peers' },
                { state: 'syncing', color: 'text-yellow-400', desc: 'Downloading and verifying ledger history' },
                { state: 'tracking', color: 'text-blue-400', desc: 'Caught up with peers, not yet voting' },
                { state: 'full', color: 'text-green-400', desc: 'Fully synced and participating in consensus' },
                { state: 'proposing / validating', color: 'text-green-400', desc: 'Actively voting in UNL consensus rounds' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <code className={`font-mono text-xs ${item.color} shrink-0 mt-0.5`}>{item.state}</code>
                  <span className="text-xs text-gray-500">{item.desc}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-3">
              It may take several minutes to reach &quot;tracking&quot; on first boot. If the curl returns nothing, wait 30 seconds and try again — the RPC port may still be initializing.
            </p>
          </div>
        </div>

        {/* Confirmation */}
        <div className="rounded-xl border border-accent/40 bg-[#0e0f1a] p-4">
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
