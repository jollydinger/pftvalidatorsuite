'use client'

import { useState } from 'react'
import { StepProps } from '@/lib/types'
import { CodeBlock } from '@/components/CodeBlock'

export function StepKeys({ config, setConfig, onNext, onBack }: StepProps) {
  const [keyError, setKeyError] = useState('')
  const [backedUp, setBackedUp] = useState(false)
  const [tokenSaved, setTokenSaved] = useState(false)

  const generateKeyCmd = `# Check if keys already exist — if this prints JSON, you already have keys and should SKIP the next command
docker exec postfiatd cat /root/.ripple/validator-keys.json 2>/dev/null

# Create the config directory and generate your validator keys (only run if no keys exist!)
docker exec postfiatd mkdir -p /root/.ripple
docker exec postfiatd validator-keys create_keys --keyfile /root/.ripple/validator-keys.json`

  const viewKeyCmd = `# View your validator's key file
docker exec postfiatd cat /root/.ripple/validator-keys.json`

  const backupCmd = `# Copy the key file out of the Docker volume to your home directory
docker cp postfiatd:/root/.ripple/validator-keys.json ~/validator-keys-backup.json

# Print the full contents — copy this entire output and save it securely
cat ~/validator-keys-backup.json

# Delete the local copy once you have saved it elsewhere
rm ~/validator-keys-backup.json`

  const tokenCmd = `# Generate your validator token
docker exec postfiatd validator-keys create_token --keyfile /root/.ripple/validator-keys.json`

  const canAdvance = backedUp && tokenSaved && config.validatorPubKey.trim().length > 0

  const handleNext = () => {
    if (!config.validatorPubKey.trim()) {
      setKeyError('Please paste your validator public key to continue')
      return
    }
    if (!config.validatorPubKey.startsWith('n')) {
      setKeyError('Validator public keys typically start with "n" — double-check the value you copied')
      return
    }
    if (!backedUp || !tokenSaved) return
    setKeyError('')
    onNext()
  }

  return (
    <div className="step-enter">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-100 mb-2">Key Generation & Backup</h2>
        <p className="text-gray-400">
          Your validator key is your permanent identity on the Post Fiat network — treat it
          like a private key for a crypto wallet. We&apos;ll generate it now, then back it up
          before moving on.
        </p>
      </div>

      <div className="space-y-6">
        {/* Step 1: Generate keys */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-semibold shrink-0">1</span>
            <h3 className="text-sm font-semibold text-gray-200">Generate your validator keys</h3>
          </div>
          <CodeBlock code={generateKeyCmd} label={`${config.sshUser}@${config.serverIp}`} multiline />
          <div className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="text-xs text-amber-300/80 leading-relaxed">
              <strong className="text-amber-300">Warning:</strong> The first command checks for existing keys. If it prints JSON, you already have keys — <strong className="text-amber-300">skip the second command</strong>. Running <code className="font-mono bg-amber-500/10 px-1 rounded">create_keys</code> again will silently overwrite your existing keys and permanently destroy your validator identity.
            </p>
          </div>
        </div>

        {/* Step 2: View key file */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-semibold shrink-0">2</span>
            <h3 className="text-sm font-semibold text-gray-200">View your validator key file</h3>
          </div>
          <CodeBlock code={viewKeyCmd} label={`${config.sshUser}@${config.serverIp}`} multiline />

          <div className="mt-3 rounded-lg border border-[#1e1f35] bg-[#08090f] p-4">
            <p className="text-xs text-gray-500 mb-2 font-medium">The output contains two important fields:</p>
            <div className="space-y-2 mb-3">
              <div className="flex items-start gap-3">
                <code className="font-mono text-xs text-green-400 shrink-0 mt-0.5">public_key</code>
                <span className="text-xs text-gray-400">Your validator&apos;s public identity on the network. Safe to share.</span>
              </div>
              <div className="flex items-start gap-3">
                <code className="font-mono text-xs text-red-400 shrink-0 mt-0.5">secret_key</code>
                <span className="text-xs text-gray-400">
                  <strong className="text-red-300">Your private key.</strong> Anyone who has this can impersonate your validator and sign fraudulent validations.
                  Never share it or commit it to a repository.
                </span>
              </div>
            </div>
            <pre className="font-mono text-xs text-gray-500 leading-relaxed border-t border-[#1e1f35] pt-3">{`{
  "key_type": "ed25519",
  "public_key": "nHBM2nzq3pZUg8JsxvEt3G7gAAtc5Sukaef6YmVx64uAoRK4QWM",
  "secret_key": "pXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "revoked": false
}`}</pre>
          </div>
        </div>

        {/* Step 2: BACKUP — required gate */}
        <div className="rounded-xl border-2 border-amber-500/30 bg-amber-500/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400 shrink-0">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <h3 className="text-sm font-semibold text-amber-300">Back up your key file — required before continuing</h3>
          </div>

          <p className="text-xs text-amber-300/80 mb-4 leading-relaxed">
            If your server is lost, corrupted, or the Docker volume is deleted, <strong>you will permanently lose your validator identity</strong> unless
            you have a backup. Run the commands below, then save the full JSON output to at least one secure location.
          </p>

          <div className="mb-4">
            <CodeBlock code={backupCmd} label={`${config.sshUser}@${config.serverIp}`} multiline />
          </div>

          <div className="rounded-lg border border-amber-500/20 bg-[#08090f] p-3 mb-4">
            <p className="text-xs text-amber-300/60 mb-2 font-medium">Recommended places to store your backup:</p>
            <ul className="space-y-1">
              {[
                'Password manager (1Password, Bitwarden, etc.) — store the full JSON as a secure note',
                'Encrypted USB drive stored offline',
                'Encrypted cloud vault (not a plain Google Drive or Dropbox)',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-amber-300/60">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-amber-500 shrink-0 mt-0.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Backup confirmation checkbox */}
          <label className="flex items-start gap-3 cursor-pointer" onClick={() => setBackedUp(!backedUp)}>
            <div
              className={`w-5 h-5 rounded flex items-center justify-center border transition-all shrink-0 mt-0.5
                ${backedUp
                  ? 'bg-amber-500 border-amber-500'
                  : 'bg-[#13141f] border-amber-500/30 hover:border-amber-500/60'
                }`}
            >
              {backedUp && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <span className="text-sm text-amber-200/80">
              I have saved my complete <code className="font-mono text-xs bg-amber-500/10 px-1 rounded">validator-keys.json</code> to a secure location outside this server.
              I understand that losing this file means losing my validator identity permanently.
            </span>
          </label>
        </div>

        {/* Step 3: Generate validator token */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-semibold shrink-0">3</span>
            <h3 className="text-sm font-semibold text-gray-200">Generate your validator token</h3>
          </div>
          <CodeBlock code={tokenCmd} label={`${config.sshUser}@${config.serverIp}`} multiline />
          <p className="text-xs text-gray-500 mt-2">
            The token authorizes your node to vote in consensus. Copy the full output (the block starting with
            <code className="font-mono text-xs bg-[#08090f] px-1 rounded border border-[#1e1f35] mx-1">[validator_token]</code>)
            and save it alongside your key backup.
          </p>

          {/* Token save confirmation */}
          <div className="mt-3 rounded-lg border border-accent/40 bg-[#0e0f1a] p-4">
            <label className="flex items-start gap-3 cursor-pointer" onClick={() => setTokenSaved(!tokenSaved)}>
              <div
                className={`w-5 h-5 rounded flex items-center justify-center border transition-all shrink-0 mt-0.5
                  ${tokenSaved
                    ? 'bg-accent border-accent'
                    : 'bg-[#13141f] border-[#1e1f35] hover:border-[#2a2c45]'
                  }`}
              >
                {tokenSaved && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-gray-300">
                I have copied and saved my validator token output
              </span>
            </label>
          </div>
        </div>

        {/* Step 4: Enter public key */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-semibold shrink-0">4</span>
            <h3 className="text-sm font-semibold text-gray-200">Enter your validator public key</h3>
          </div>

          <div className="rounded-xl border border-[#1e1f35] bg-[#0e0f1a] p-5">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Validator Public Key <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={config.validatorPubKey}
              onChange={(e) => {
                setConfig({ validatorPubKey: e.target.value.trim() })
                setKeyError('')
              }}
              placeholder="nHBM2nzq3pZUg8JsxvEt3G7..."
              className={`w-full px-3 py-2.5 rounded-lg font-mono text-sm bg-[#13141f] border transition-colors
                text-gray-200 placeholder-gray-600
                ${keyError
                  ? 'border-red-500/50 focus:border-red-500'
                  : 'border-[#1e1f35] focus:border-accent/50'
                }`}
            />
            {keyError && <p className="text-xs text-red-400 mt-1.5">{keyError}</p>}
            <p className="text-xs text-gray-600 mt-2">
              Paste the <code className="font-mono text-xs bg-[#08090f] px-1 rounded border border-[#1e1f35]">public_key</code> value (starts with &quot;n&quot;, ~52 characters).
              This is used to personalize the remaining steps and check your agreement score.
            </p>
          </div>
        </div>

      </div>

      {/* Gate hint */}
      {!canAdvance && (
        <div className="mt-6 p-3 rounded-lg bg-[#0e0f1a] border border-[#1e1f35]">
          <p className="text-xs text-gray-500">
            To continue, please:
            {!backedUp && <span className="block mt-1 text-amber-400/70">• Confirm you have backed up your validator-keys.json</span>}
            {!tokenSaved && <span className="block mt-1 text-gray-400">• Confirm you have saved your validator token</span>}
            {!config.validatorPubKey && <span className="block mt-1 text-gray-400">• Enter your validator public key</span>}
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-400 border border-[#1e1f35]
            hover:border-[#2a2c45] hover:text-gray-300 transition-all duration-150 active:scale-95"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!canAdvance}
          className={`flex items-center gap-2 px-6 py-2.5 font-semibold rounded-lg transition-all duration-150 text-sm
            ${canAdvance
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
