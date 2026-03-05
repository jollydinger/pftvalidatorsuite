'use client'

import { WizardConfig } from '@/lib/types'
import { CodeBlock } from '@/components/CodeBlock'

interface StepCompleteProps {
  config: WizardConfig
}

export function StepComplete({ config }: StepCompleteProps) {
  const logsCmd = `# Live health stream
docker logs -f pft-healthcheck | python3 -m json.tool 2>/dev/null || docker logs -f pft-healthcheck

# Validator node logs
docker logs -f postfiatd 2>&1 | tail -50`

  const statusCmd = `# Quick status check — server state + peer count
docker logs pft-healthcheck 2>&1 | grep health_summary | tail -1`

  const restartCmd = `# Restart both services
docker compose -f ~/validator/docker-compose-validator.yml --env-file ~/validator/.env restart
docker restart pft-healthcheck`

  const scoreUrl = config.validatorPubKey
    ? `https://postfiat-onboarding-api.fly.dev/validators/${config.validatorPubKey}`
    : 'https://postfiat-onboarding-api.fly.dev/validators/<YOUR_PUBLIC_KEY>'

  const tweetText = encodeURIComponent(
    `Just set up my Post Fiat validator! Running on the PFT network with 24/7 health monitoring. #PostFiat #PFT #Validator`
  )

  return (
    <div className="step-enter">
      {/* Success header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-100 mb-2">Your Validator is Live!</h2>
        <p className="text-gray-400 max-w-lg mx-auto">
          You&apos;re now running a Post Fiat validator. Your node is syncing with the network and
          {config.hasWebhook ? ' will alert you on Discord/Slack if anything needs attention.' : ' the health monitor is watching it 24/7.'}
        </p>
      </div>

      {/* Summary card */}
      <div className="rounded-xl border border-[#1e1f35] bg-[#0e0f1a] p-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Setup Summary</h3>
        <div className="space-y-3">
          {[
            {
              label: 'Server',
              value: `${config.sshUser}@${config.serverIp}`,
              mono: true,
            },
            {
              label: 'Network',
              value: config.network === 'testnet' ? 'Testnet' : 'Devnet',
              badge: config.network === 'testnet' ? 'live' : 'test',
            },
            {
              label: 'Validator Key',
              value: config.validatorPubKey || '—',
              mono: true,
              truncate: true,
            },
            {
              label: 'Domain',
              value: config.hasDomain && config.domain ? config.domain : 'Not configured',
              muted: !config.hasDomain || !config.domain,
            },
            {
              label: 'Health Alerts',
              value: config.hasWebhook
                ? `${config.webhookType.charAt(0).toUpperCase() + config.webhookType.slice(1)} webhook`
                : 'Log monitoring only',
              muted: !config.hasWebhook,
            },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-[#1e1f35] last:border-0">
              <span className="text-xs text-gray-500">{item.label}</span>
              <div className="flex items-center gap-2">
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${
                    item.badge === 'live'
                      ? 'text-green-400 bg-green-400/10 border-green-400/20'
                      : 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
                  }`}>
                    {item.badge}
                  </span>
                )}
                <span className={`text-sm font-medium ${
                  item.muted ? 'text-gray-600' : item.mono ? 'font-mono text-xs text-gray-300' : 'text-gray-200'
                } ${item.truncate ? 'max-w-[200px] truncate' : ''}`}>
                  {item.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Agreement score */}
      {config.validatorPubKey && (
        <div className="rounded-xl border border-accent/15 bg-accent-glow p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            Track Your Agreement Score
          </h3>
          <p className="text-xs text-gray-400 mb-3">
            Once your node has been validating, check your 1h / 24h / 30d agreement scores:
          </p>
          <CodeBlock code={`curl -s ${scoreUrl} | python3 -m json.tool`} label="agreement score API" />
        </div>
      )}

      {/* Useful commands */}
      <div className="space-y-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-300">Useful Commands</h3>

        <div>
          <p className="text-xs text-gray-500 mb-2">View live health data</p>
          <CodeBlock code={logsCmd} multiline />
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-2">Quick status snapshot</p>
          <CodeBlock code={statusCmd} />
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-2">Restart services</p>
          <CodeBlock code={restartCmd} multiline />
        </div>
      </div>

      {/* Next steps */}
      <div className="rounded-xl border border-[#1e1f35] bg-[#0e0f1a] p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Next Steps</h3>
        <div className="space-y-3">
          {[
            {
              title: 'Monitor your first few hours',
              desc: 'Watch that the node reaches "proposing" or "validating" state and stays there.',
            },
            {
              title: 'Back up your validator keys',
              desc: 'Copy /root/.ripple/validator-keys.json from the Docker volume to a secure offline location.',
            },
            {
              title: 'Check your agreement score after 1 hour',
              desc: 'Your score appears once the network has enough data to calculate it.',
            },
            {
              title: 'Your node IP appears immediately — validator takes a few minutes',
              desc: 'Your server IP will show up in explorer right away, but it may take 2–5 minutes for your validator public key to populate in the validator list.',
            },
            ...(config.hasDomain && config.domain ? [] : [{
              title: 'Add domain verification later (optional)',
              desc: 'Coming back to add a domain? Run through this wizard again or check the README in the repo.',
            }]),
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </div>
              <div>
                <p className="text-sm text-gray-200 font-medium">{item.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Share / links */}
      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href={`https://twitter.com/intent/tweet?text=${tweetText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-[#1e1f35]
            bg-[#0e0f1a] text-gray-300 hover:border-[#2a2c45] hover:text-white transition-all text-sm font-medium"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Share on X
        </a>
        <a
          href="https://github.com/jollydinger/pftvalidatorsuite"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-[#1e1f35]
            bg-[#0e0f1a] text-gray-300 hover:border-[#2a2c45] hover:text-white transition-all text-sm font-medium"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          View on GitHub
        </a>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg
            bg-accent hover:bg-accent-bright text-white font-semibold transition-all text-sm"
        >
          Run Setup Again
        </button>
      </div>
    </div>
  )
}
