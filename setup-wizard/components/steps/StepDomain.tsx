'use client'

import { useState } from 'react'
import { StepProps } from '@/lib/types'
import { CodeBlock } from '@/components/CodeBlock'

export function StepDomain({ config, setConfig, onNext, onBack }: StepProps) {
  const [error, setError] = useState('')

  const attestationCmd = config.domain
    ? `# Generate your domain attestation
docker exec postfiatd /usr/local/bin/validator-keys \\
  set_domain ${config.domain} \\
  --keyfile /root/.ripple/validator-keys.json`
    : `# Generate your domain attestation
docker exec postfiatd /usr/local/bin/validator-keys \\
  set_domain your-domain.com \\
  --keyfile /root/.ripple/validator-keys.json`

  const tomlContent = `[[VALIDATORS]]
public_key = "${config.validatorPubKey || 'nYOUR_PUBLIC_KEY_HERE'}"
attestation = "PASTE_THE_ATTESTATION_STRING_HERE"`

  const nginxExample = `# If using nginx, add this to your server block:
location /.well-known/ {
    root /var/www/html;
    add_header Content-Type text/plain;
    add_header Access-Control-Allow-Origin *;
}`

  const handleNext = () => {
    if (config.hasDomain && !config.domain.trim()) {
      setError('Please enter your domain name')
      return
    }
    setError('')
    onNext()
  }

  return (
    <div className="step-enter">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-2xl font-bold text-gray-100">Domain Verification</h2>
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-700/50 text-gray-400 border border-gray-700">
            Optional
          </span>
        </div>
        <p className="text-gray-400">
          Linking a domain to your validator creates a verifiable identity on the network —
          building trust with other participants and required for some institutional configurations.
        </p>
      </div>

      {/* Toggle */}
      <div className="rounded-xl border border-[#1e1f35] bg-[#0e0f1a] p-5 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-200">I have a domain name to link</p>
            <p className="text-xs text-gray-500 mt-0.5">e.g. validator.mycompany.com or yourname.com</p>
          </div>
          <button
            onClick={() => setConfig({ hasDomain: !config.hasDomain })}
            className={`relative w-12 h-6 rounded-full transition-all duration-200 ${
              config.hasDomain ? 'bg-accent' : 'bg-[#1a1b2e] border border-[#2a2c45]'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${
                config.hasDomain ? 'left-6.5' : 'left-0.5'
              }`}
              style={{ left: config.hasDomain ? '26px' : '2px' }}
            />
          </button>
        </div>
      </div>

      {config.hasDomain ? (
        <div className="space-y-6">
          {/* Domain input */}
          <div className="rounded-xl border border-[#1e1f35] bg-[#0e0f1a] p-5">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Domain Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={config.domain}
              onChange={(e) => {
                setConfig({ domain: e.target.value.trim().toLowerCase() })
                setError('')
              }}
              placeholder="validator.yourcompany.com"
              className={`w-full px-3 py-2.5 rounded-lg font-mono text-sm bg-[#13141f] border transition-colors
                text-gray-200 placeholder-gray-600
                ${error
                  ? 'border-red-500/50 focus:border-red-500'
                  : 'border-[#1e1f35] focus:border-accent/50'
                }`}
            />
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
            <p className="text-xs text-gray-600 mt-2">
              You must control this domain and be able to add a file to it.
            </p>
          </div>

          {/* Step 1 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-semibold shrink-0">1</span>
              <h3 className="text-sm font-semibold text-gray-200">Generate domain attestation</h3>
            </div>
            <CodeBlock code={attestationCmd} label={`${config.sshUser}@${config.serverIp}`} multiline />
            <p className="text-xs text-gray-500 mt-2">
              The command outputs an attestation string that cryptographically links your domain to your validator key.
              Copy the full attestation value from the output. It also updates your validator keys file — restart postfiatd after running this so the node picks up the domain.
            </p>
            <CodeBlock code={`docker restart postfiatd`} label={`${config.sshUser}@${config.serverIp}`} />
          </div>

          {/* Step 2 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-semibold shrink-0">2</span>
              <h3 className="text-sm font-semibold text-gray-200">Create the verification file</h3>
            </div>
            <p className="text-sm text-gray-400 mb-3">
              On your web server, create a file at{' '}
              <code className="font-mono text-xs bg-[#08090f] px-1.5 py-0.5 rounded border border-[#1e1f35] text-accent-bright">
                {config.domain ? `https://${config.domain}/.well-known/pft-ledger.toml` : 'https://your-domain.com/.well-known/pft-ledger.toml'}
              </code>{' '}
              with this content:
            </p>
            <CodeBlock code={tomlContent} label="pft-ledger.toml" multiline />
            <p className="text-xs text-gray-500 mt-2">
              Replace <code className="font-mono text-xs bg-[#08090f] px-1 rounded border border-[#1e1f35]">PASTE_THE_ATTESTATION_STRING_HERE</code> with the full output from step 1.
            </p>
          </div>

          {/* CORS note */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-semibold shrink-0">3</span>
              <h3 className="text-sm font-semibold text-gray-200">Enable CORS headers (required)</h3>
            </div>
            <CodeBlock code={nginxExample} label="nginx config example" multiline />
            <p className="text-xs text-gray-500 mt-2">
              The verification file must be publicly accessible with CORS headers. Validators and explorers query this to confirm your identity.
            </p>
          </div>

          {/* Verify */}
          <div className="rounded-xl border border-[#1e1f35] bg-[#0e0f1a] p-4">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Test your verification</h4>
            <p className="text-xs text-gray-500 mb-3">Once published, check that the file is accessible:</p>
            <CodeBlock
              code={config.domain
                ? `curl -s https://${config.domain}/.well-known/pft-ledger.toml`
                : `curl -s https://your-domain.com/.well-known/pft-ledger.toml`}
              label="from your local machine"
            />
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-[#1e1f35] bg-[#0e0f1a] p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-[#13141f] flex items-center justify-center mx-auto mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-500">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
          <p className="text-sm text-gray-400 mb-1">Skipping domain verification</p>
          <p className="text-xs text-gray-600">
            You can always add domain verification later. Toggle the switch above if you want to set it up now.
          </p>
        </div>
      )}

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
          {config.hasDomain ? 'Continue' : 'Skip & Continue'}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  )
}
