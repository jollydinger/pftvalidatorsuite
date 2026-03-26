'use client'

import { useState } from 'react'
import { StepProps } from '@/lib/types'
import { CodeBlock } from '@/components/CodeBlock'

export function StepActivate({ config, setConfig, onNext, onBack }: StepProps) {
  const [confirmed, setConfirmed] = useState(false)

  const regenerateTokenCmd = `# Generate a fresh validator token
docker exec postfiatd validator-keys create_token --keyfile /root/.ripple/validator-keys.json`

  const token = config.validatorToken
  const tokenPlaceholder = 'YOUR_TOKEN_HERE'
  const tokenValue = token || tokenPlaceholder

  const addTokenCmd = `# Remove any existing [validator_token] section, then append the new one
docker exec postfiatd bash -c "sed -i '/^\\[validator_token\\]\$/,/^\$/d' /etc/postfiatd/postfiatd.cfg && printf '\\n[validator_token]\\n${tokenValue}\\n' >> /etc/postfiatd/postfiatd.cfg"

# Verify it was written correctly
docker exec postfiatd tail -3 /etc/postfiatd/postfiatd.cfg`

  const restartCmd = `# Restart the validator to apply the new config
docker restart postfiatd`

  const verifyCmd = `# Watch logs for manifest/token confirmation
docker logs postfiatd 2>&1 | grep -E "Manifest|token|validator" | head -20`

  const rpcVerifyCmd = `# Confirm the node is now in validating mode
curl -s -X POST http://localhost:5005 \\
  -H 'Content-Type: application/json' \\
  -d '{"method":"server_info","params":[{}]}' | python3 -m json.tool | grep server_state`

  return (
    <div className="step-enter">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-100 mb-2">Activate Your Validator</h2>
        <p className="text-gray-400">
          Your node is connected to the network, but it isn&apos;t signing validations yet.
          To participate in consensus, your validator token must be added to the node&apos;s
          config file and the node restarted.
        </p>
      </div>

      {/* Why this matters */}
      <div className="rounded-xl border border-accent/15 bg-accent/5 p-4 mb-6">
        <div className="flex items-start gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <p className="text-sm font-medium text-gray-200 mb-1">Why this step is required</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Without the token in the config, your node runs as a read-only observer — it syncs and
              follows consensus but doesn&apos;t cast votes. Adding the token tells the node to sign
              validation messages with your key, which is what makes you appear on the validator list.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Step 1: Get token value */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-semibold shrink-0">1</span>
            <h3 className="text-sm font-semibold text-gray-200">Generate a fresh validator token</h3>
          </div>
          <CodeBlock code={regenerateTokenCmd} label={`${config.sshUser}@${config.serverIp}`} multiline />
          <p className="text-xs text-gray-500 mt-2">
            Always generate a fresh token here — do not reuse the one from the Keys step.
            {config.hasDomain ? ' Since you set up domain verification, the token must be regenerated so your domain is included in the manifest.' : ''}
          </p>
        </div>

        {/* Step 2: Paste token */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-semibold shrink-0">2</span>
            <h3 className="text-sm font-semibold text-gray-200">Paste your token</h3>
          </div>
          <div className="rounded-xl border border-[#1e1f35] bg-[#0e0f1a] p-5">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Validator Token
            </label>
            <textarea
              value={config.validatorToken}
              onChange={(e) => {
                // Strip all line breaks and extra whitespace — terminal output wraps long tokens
                const cleaned = e.target.value.replace(/[\r\n]+/g, '').replace(/\s+/g, '')
                setConfig({ validatorToken: cleaned })
              }}
              placeholder="Paste the token output here — line breaks will be removed automatically"
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg font-mono text-sm bg-[#13141f] border border-[#1e1f35]
                focus:border-accent/50 transition-colors text-gray-200 placeholder-gray-600 resize-none"
            />
            <p className="text-xs text-gray-600 mt-2">
              Copy the token value from step 1 and paste it above. Line breaks are stripped automatically.
              The command below will update to include your token.
            </p>
            {token && (
              <div className="mt-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                <p className="text-xs text-green-400/80 font-medium">
                  Token received ({token.length} characters) — command below is ready to copy
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Add token to config */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-semibold shrink-0">3</span>
            <h3 className="text-sm font-semibold text-gray-200">Add the token to your validator config</h3>
          </div>
          {!token && (
            <div className="mb-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <p className="text-xs text-amber-300/80 leading-relaxed">
                <strong className="text-amber-300">Tip:</strong> Paste your token in step 2 above and this command will be pre-filled — just copy and run it.
                Or replace <code className="font-mono bg-amber-500/10 px-1 rounded">{tokenPlaceholder}</code> manually.
              </p>
            </div>
          )}
          <CodeBlock code={addTokenCmd} label={`${config.sshUser}@${config.serverIp}`} multiline />
          <p className="text-xs text-gray-500 mt-2">
            This runs entirely from the host — no need to enter the container. It removes any
            existing token section first, so it&apos;s safe to re-run if you need to replace your token later.
          </p>
        </div>

        {/* Step 4: Restart */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-semibold shrink-0">4</span>
            <h3 className="text-sm font-semibold text-gray-200">Restart your validator</h3>
          </div>
          <CodeBlock code={restartCmd} label={`${config.sshUser}@${config.serverIp}`} />
          <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="text-xs text-amber-300/80 leading-relaxed">
              <strong className="text-amber-300">Important:</strong> Any time you restart <code className="font-mono bg-amber-500/10 px-1 rounded">postfiatd</code>, you must also restart the health-check sidecar — it loses its network connection when the main container restarts. Run this after any future restart:
            </p>
            <div className="mt-2">
              <CodeBlock code={`docker stop pft-healthcheck && docker rm pft-healthcheck && \\
docker run -d --name pft-healthcheck \\
  --network container:postfiatd \\
  -e NODE_RPC_URL=http://127.0.0.1:5005 \\
  -v /opt/postfiatd/sidecar/logs/healthcheck:/var/log/healthcheck \\
  --restart unless-stopped \\
  pft-healthcheck`} label={`${config.sshUser}@${config.serverIp}`} multiline />
            </div>
          </div>
        </div>

        {/* Step 5: Verify */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-semibold shrink-0">5</span>
            <h3 className="text-sm font-semibold text-gray-200">Verify the token loaded</h3>
          </div>
          <CodeBlock code={verifyCmd} label={`${config.sshUser}@${config.serverIp}`} multiline />
          <p className="text-xs text-gray-500 mt-2">
            Look for lines containing <code className="font-mono text-xs bg-[#08090f] px-1 rounded border border-[#1e1f35]">Manifest</code> or
            <code className="font-mono text-xs bg-[#08090f] px-1 rounded border border-[#1e1f35] ml-1">token</code> — these confirm
            the validator identity loaded successfully. Press <kbd className="font-mono text-xs bg-[#1a1b2e] border border-[#2a2c45] px-1 rounded">Ctrl+C</kbd> when done.
          </p>
          <div className="mt-3">
            <CodeBlock code={rpcVerifyCmd} label="optional — check server state" multiline />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            All three of these states mean your validator is healthy and active:
          </p>
          <div className="mt-2 space-y-1.5">
            {[
              { state: 'full', desc: 'Synced and token loaded — actively participating' },
              { state: 'proposing', desc: 'Voting in consensus rounds' },
              { state: 'validating', desc: 'Signing and broadcasting validations' },
            ].map((item) => (
              <div key={item.state} className="flex items-center gap-3">
                <code className="font-mono text-xs text-green-400 bg-[#08090f] px-1.5 py-0.5 rounded border border-[#1e1f35] shrink-0">{item.state}</code>
                <span className="text-xs text-gray-500">{item.desc}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-2">
            It typically takes 1–2 minutes after restart to reach one of these states. If it still shows <code className="font-mono text-xs bg-[#08090f] px-1 rounded border border-[#1e1f35]">connected</code> or <code className="font-mono text-xs bg-[#08090f] px-1 rounded border border-[#1e1f35]">syncing</code>, wait another minute and run the curl again.
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
              My validator token is in the config, the node restarted, I can see manifest lines in the logs, and server_state shows <code className="font-mono text-xs bg-[#13141f] px-1 py-0.5 rounded border border-[#1e1f35]">full</code>, <code className="font-mono text-xs bg-[#13141f] px-1 py-0.5 rounded border border-[#1e1f35]">proposing</code>, or <code className="font-mono text-xs bg-[#13141f] px-1 py-0.5 rounded border border-[#1e1f35]">validating</code>
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
