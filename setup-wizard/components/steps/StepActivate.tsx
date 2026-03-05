'use client'

import { useState } from 'react'
import { StepProps } from '@/lib/types'
import { CodeBlock } from '@/components/CodeBlock'

export function StepActivate({ config, onNext, onBack }: StepProps) {
  const [confirmed, setConfirmed] = useState(false)

  const regenerateTokenCmd = `# Re-display your validator token (use the value you saved earlier, or run this again)
docker exec postfiatd validator-keys create_token --keyfile /root/.ripple/validator-keys.json`

  const checkConfigCmd = `# Check if the token is already configured
docker exec postfiatd grep -c "validator_token" /etc/postfiatd/postfiatd.cfg
# Returns 0 = not yet configured, 1 = already configured`

  const addTokenCmd = `# Open a shell inside the container
docker exec -it postfiatd bash

# Copy your token from step 1 — remove ALL line breaks so it is one continuous string.
# Replace TOKEN_VALUE below with that single-line string.
printf '\\n[validator_token]\\nTOKEN_VALUE\\n' >> /etc/postfiatd/postfiatd.cfg

# Verify it was written correctly
tail -3 /etc/postfiatd/postfiatd.cfg

# Exit the container shell
exit`

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
            <h3 className="text-sm font-semibold text-gray-200">Get your validator token value</h3>
          </div>
          <CodeBlock code={regenerateTokenCmd} label={`${config.sshUser}@${config.serverIp}`} multiline />
          <p className="text-xs text-gray-500 mt-2">
            The output is a long base64 string that may display with line breaks — that&apos;s just
            terminal wrapping. When you copy it for the next step, <strong className="text-gray-300">remove all line breaks</strong> so
            it is one continuous string.
          </p>
        </div>

        {/* Step 2: Check if already configured */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-semibold shrink-0">2</span>
            <h3 className="text-sm font-semibold text-gray-200">Check if the token is already in your config</h3>
          </div>
          <CodeBlock code={checkConfigCmd} label={`${config.sshUser}@${config.serverIp}`} multiline />
          <p className="text-xs text-gray-500 mt-2">
            If it returns <code className="font-mono text-xs bg-[#08090f] px-1 rounded border border-[#1e1f35]">1</code>, skip
            to step 4 — your token is already configured. If it returns
            <code className="font-mono text-xs bg-[#08090f] px-1 rounded border border-[#1e1f35] ml-1">0</code>, continue to step 3.
          </p>
        </div>

        {/* Step 3: Add token to config */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-semibold shrink-0">3</span>
            <h3 className="text-sm font-semibold text-gray-200">Add the token to your validator config</h3>
          </div>
          <CodeBlock code={addTokenCmd} label={`${config.sshUser}@${config.serverIp}`} multiline />
          <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="text-xs text-amber-300/80 leading-relaxed">
              <strong className="text-amber-300">Important:</strong> The token output from step 1 has line breaks — remove them all so it is one continuous string before pasting as <code className="font-mono bg-amber-500/10 px-1 rounded">TOKEN_VALUE</code>. Line breaks in the token will break the command.
            </p>
          </div>
        </div>

        {/* Step 4: Restart */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-semibold shrink-0">4</span>
            <h3 className="text-sm font-semibold text-gray-200">Restart your validator</h3>
          </div>
          <CodeBlock code={restartCmd} label={`${config.sshUser}@${config.serverIp}`} />
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
            The <code className="font-mono text-xs bg-[#08090f] px-1 rounded border border-[#1e1f35]">server_state</code> should
            reach <code className="font-mono text-xs text-green-400 bg-[#08090f] px-1 rounded border border-[#1e1f35] ml-1">proposing</code> or
            <code className="font-mono text-xs text-green-400 bg-[#08090f] px-1 rounded border border-[#1e1f35] ml-1">validating</code> once
            the token is active and the node has re-synced (usually within 1–2 minutes).
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
              My validator token is in the config, the node restarted, and I can see manifest/token lines in the logs
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
