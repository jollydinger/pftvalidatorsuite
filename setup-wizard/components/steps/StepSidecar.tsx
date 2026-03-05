'use client'

import { useState } from 'react'
import { StepProps } from '@/lib/types'
import { CodeBlock } from '@/components/CodeBlock'

function buildRunCommand(config: { serverIp: string; sshUser: string; webhookUrl: string; webhookType: string; hasWebhook: boolean }) {
  const envLines = [
    `  -e NODE_RPC_URL=http://127.0.0.1:5005 \\`,
    ...(config.hasWebhook && config.webhookUrl
      ? [
          `  -e WEBHOOK_URL="${config.webhookUrl}" \\`,
          `  -e WEBHOOK_TYPE="${config.webhookType}" \\`,
        ]
      : []),
    `  -v ~/validator/sidecar/logs/healthcheck:/var/log/healthcheck \\`,
  ]

  return `docker run -d \\
  --name pft-healthcheck \\
  --network container:postfiatd \\
${envLines.join('\n')}
  --restart unless-stopped \\
  pft-healthcheck`
}

export function StepSidecar({ config, setConfig, onNext, onBack }: StepProps) {
  const [webhookError, setWebhookError] = useState('')

  const cloneCmd = `# Navigate to your validator directory
cd ~/validator

# Clone the PFT Validator Suite (includes healthcheck sidecar)
git clone https://github.com/jollydinger/pftvalidatorsuite.git sidecar

# Build the health-check Docker image
docker build -t pft-healthcheck ./sidecar/healthcheck`

  const runCmd = buildRunCommand(config)

  const verifyCmd = `# Show last 5 lines then stream live (Ctrl+C to stop)
docker logs -f --tail 5 pft-healthcheck`

  const restartCmd = `# Restart after config changes
docker stop pft-healthcheck && docker rm pft-healthcheck
# Then re-run the docker run command above`

  const discordInstructions = [
    'Open your Discord server',
    'Go to Server Settings → Integrations → Webhooks',
    'Click "New Webhook" and choose a channel',
    'Click "Copy Webhook URL" and paste it below',
  ]

  const slackInstructions = [
    'Go to api.slack.com/apps',
    'Create New App → From scratch',
    'Enable "Incoming Webhooks" in Features',
    'Click "Add New Webhook to Workspace" and copy the URL',
  ]

  const handleNext = () => {
    if (config.hasWebhook && !config.webhookUrl.trim()) {
      setWebhookError('Please enter your webhook URL or disable webhook alerts')
      return
    }
    setWebhookError('')
    onNext()
  }

  return (
    <div className="step-enter">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-100 mb-2">Health Monitoring</h2>
        <p className="text-gray-400">
          The health-check sidecar runs alongside your validator 24/7, monitoring sync state,
          ledger close times, peer count, and latency. It fires alerts before your agreement
          scores start dropping.
        </p>
      </div>

      {/* What it monitors */}
      <div className="grid sm:grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Sync state', detail: 'Alerts if node disconnects from consensus', icon: '⚡' },
          { label: 'Ledger age', detail: 'Detects stalls before they hurt scores', icon: '⏱' },
          { label: 'Peer health', detail: 'Monitors peer count & latency', icon: '🔗' },
        ].map((item, i) => (
          <div key={i} className="p-4 rounded-lg border border-[#1e1f35] bg-[#0e0f1a]">
            <div className="text-xl mb-2">{item.icon}</div>
            <p className="text-sm font-medium text-gray-200">{item.label}</p>
            <p className="text-xs text-gray-500 mt-1">{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {/* Step 1: Clone & build */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-semibold shrink-0">1</span>
            <h3 className="text-sm font-semibold text-gray-200">Download and build the sidecar</h3>
          </div>
          <CodeBlock code={cloneCmd} label={`${config.sshUser}@${config.serverIp} ~/validator`} multiline />
          <p className="text-xs text-gray-500 mt-2">
            This clones the PFT Validator Suite and builds a lightweight Alpine-based Docker image.
          </p>
        </div>

        {/* Webhook config */}
        <div className="rounded-xl border border-[#1e1f35] bg-[#0e0f1a] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-200">Enable Discord / Slack Alerts</p>
              <p className="text-xs text-gray-500 mt-0.5">Get notified immediately when something goes wrong</p>
            </div>
            <button
              onClick={() => setConfig({ hasWebhook: !config.hasWebhook })}
              className={`relative w-12 h-6 rounded-full transition-all duration-200 ${
                config.hasWebhook ? 'bg-accent' : 'bg-[#1a1b2e] border border-[#2a2c45]'
              }`}
            >
              <span
                className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200"
                style={{ left: config.hasWebhook ? '26px' : '2px' }}
              />
            </button>
          </div>

          {config.hasWebhook && (
            <div className="space-y-4 pt-4 border-t border-[#1e1f35]">
              {/* Webhook type */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Alert Platform</label>
                <div className="flex gap-2">
                  {(['discord', 'slack'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setConfig({ webhookType: type })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-150 ${
                        config.webhookType === type
                          ? 'bg-accent/10 border-accent/30 text-accent-bright'
                          : 'bg-[#13141f] border-[#1e1f35] text-gray-400 hover:border-[#2a2c45]'
                      }`}
                    >
                      {type === 'discord' ? 'Discord' : 'Slack'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Instructions accordion */}
              <div className="rounded-lg border border-[#1e1f35] bg-[#08090f] p-3">
                <p className="text-xs text-gray-500 mb-2 font-medium">
                  How to get a {config.webhookType === 'discord' ? 'Discord' : 'Slack'} webhook URL:
                </p>
                <ol className="space-y-1">
                  {(config.webhookType === 'discord' ? discordInstructions : slackInstructions).map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                      <span className="text-gray-600 shrink-0">{i + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Webhook URL input */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Webhook URL <span className="text-red-400">*</span>
                </label>
                <input
                  type="url"
                  value={config.webhookUrl}
                  onChange={(e) => {
                    setConfig({ webhookUrl: e.target.value.trim() })
                    setWebhookError('')
                  }}
                  placeholder={
                    config.webhookType === 'discord'
                      ? 'https://discord.com/api/webhooks/...'
                      : 'https://hooks.slack.com/services/...'
                  }
                  className={`w-full px-3 py-2.5 rounded-lg font-mono text-sm bg-[#13141f] border transition-colors
                    text-gray-200 placeholder-gray-600
                    ${webhookError
                      ? 'border-red-500/50'
                      : 'border-[#1e1f35] focus:border-accent/50'
                    }`}
                />
                {webhookError && <p className="text-xs text-red-400 mt-1">{webhookError}</p>}
                <p className="text-xs text-gray-600 mt-1">
                  Alerts fire with a 5-minute cooldown to prevent spam.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Run */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-semibold shrink-0">2</span>
            <h3 className="text-sm font-semibold text-gray-200">Start the health monitor</h3>
          </div>
          <CodeBlock code={runCmd} label={`${config.sshUser}@${config.serverIp} ~/validator`} multiline />
          <p className="text-xs text-gray-500 mt-2">
            The sidecar uses <code className="font-mono text-xs bg-[#08090f] px-1 rounded border border-[#1e1f35]">--network container:postfiatd</code> to
            reach the admin RPC on <code className="font-mono text-xs bg-[#08090f] px-1 rounded border border-[#1e1f35]">127.0.0.1:5005</code> without exposing any ports.
          </p>
        </div>

        {/* Step 3: Verify */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-semibold shrink-0">3</span>
            <h3 className="text-sm font-semibold text-gray-200">Verify the monitor is working</h3>
          </div>
          <CodeBlock code={verifyCmd} label={`${config.sshUser}@${config.serverIp}`} multiline />

          {/* Sample output */}
          <div className="mt-3 rounded-lg border border-green-500/15 bg-green-500/5 p-4">
            <p className="text-xs text-green-400/70 mb-2 font-medium">Healthy output looks like:</p>
            <pre className="font-mono text-xs text-gray-400 leading-relaxed">{`{
  "timestamp": "2026-03-05T10:30:00.000+00:00",
  "level": "INFO",
  "event": "health_summary",
  "overall": "OK",
  "state": "proposing",
  "ledger_seq": 800000,
  "ledger_age_seconds": 2.0,
  "avg_ledger_interval_seconds": 3.4,
  "peer_count": 18,
  "avg_peer_latency_ms": 95.2,
  "load_factor": 1
}`}</pre>
          </div>
        </div>

        {/* Restart note */}
        <div className="rounded-lg border border-[#1e1f35] bg-[#0e0f1a] p-4">
          <h4 className="text-xs font-medium text-gray-400 mb-2">Useful commands</h4>
          <CodeBlock code={restartCmd} label="restart after config change" multiline />
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
          onClick={handleNext}
          className="flex items-center gap-2 px-6 py-2.5 bg-accent hover:bg-accent-bright text-white
            font-semibold rounded-lg transition-all duration-150 active:scale-95 text-sm"
        >
          Finish Setup
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  )
}
