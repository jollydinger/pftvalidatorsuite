import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#06070d] text-gray-100">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #f43f5e, transparent)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.02]"
          style={{ background: 'radial-gradient(circle, #fb7185, transparent)' }} />
      </div>

      {/* Nav */}
      <header className="border-b border-[#1e1f35]/50">
        <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shadow-[0_0_12px_rgba(244,63,94,0.4)]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-semibold text-gray-100">PFT Validator</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/postfiatorg/postfiatd"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              Docs
            </a>
            <a
              href="https://github.com/jollydinger/pftvalidatorsuite"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </a>
            <Link
              href="/setup"
              className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-bright text-white text-sm font-medium
                transition-all duration-150 active:scale-95"
            >
              Start Setup
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center relative">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent-bright text-xs font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-slow" />
          Post Fiat Network — Validator Onboarding
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-gray-100 mb-5 leading-tight tracking-tight">
          Set up your PFT Validator
          <br />
          <span className="gradient-text">in 15 minutes</span>
        </h1>

        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
          A guided, step-by-step wizard for institutional and retail participants.
          No DevOps expertise required — just follow along.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/setup"
            className="flex items-center gap-2 px-8 py-3.5 bg-accent hover:bg-accent-bright text-white
              font-semibold rounded-xl transition-all duration-150 active:scale-95 text-base
              shadow-[0_0_30px_rgba(244,63,94,0.25)]"
          >
            Start the wizard
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
          <a
            href="https://github.com/jollydinger/pftvalidatorsuite"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl border border-[#1e1f35] bg-[#0e0f1a]
              text-gray-300 hover:border-[#2a2c45] hover:text-white transition-all text-base font-medium"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            View source
          </a>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 mt-12 pt-12 border-t border-[#1e1f35]">
          {[
            { value: '~15 min', label: 'Setup time' },
            { value: '8 steps', label: 'Guided wizard' },
            { value: '0', label: 'Commands to memorize' },
            { value: '24/7', label: 'Health monitoring' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-2xl font-bold text-gray-100">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              ),
              title: 'Instant Setup',
              desc: 'From zero to a running, synced validator in under 15 minutes. The wizard handles everything — no prior blockchain or server experience needed.',
              color: 'text-yellow-400',
              bg: 'bg-yellow-400/5 border-yellow-400/15',
            },
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              ),
              title: 'Personalized Commands',
              desc: 'Enter your server details once. Every command throughout the guide is automatically filled with your actual IP, network, and config.',
              color: 'text-accent-bright',
              bg: 'bg-accent/5 border-accent/15',
            },
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              ),
              title: 'Built-in Monitoring',
              desc: 'The health-check sidecar monitors your node 24/7 — tracking sync state, ledger closes, peer count, and latency — with Discord & Slack alerts.',
              color: 'text-green-400',
              bg: 'bg-green-400/5 border-green-400/15',
            },
          ].map((feature, i) => (
            <div key={i} className={`rounded-xl border p-6 ${feature.bg}`}>
              <div className={`${feature.color} mb-4`}>{feature.icon}</div>
              <h3 className="text-base font-semibold text-gray-100 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Process overview */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-100 mb-3">What the wizard covers</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Every step is fully guided — just read, copy, and confirm before moving on.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { num: '01', title: 'Server Setup', desc: 'Choose a VPS, configure firewall, install Docker' },
            { num: '02', title: 'Validator Node', desc: 'Download official compose file, start postfiatd' },
            { num: '03', title: 'Keys & Identity', desc: 'Generate validator keys, optional domain link' },
            { num: '04', title: 'Monitoring', desc: 'Health sidecar + Discord/Slack alerts' },
          ].map((step, i) => (
            <div key={i} className="rounded-xl border border-[#1e1f35] bg-[#0e0f1a] p-5">
              <div className="text-3xl font-bold text-[#1e1f35] mb-3 font-mono">{step.num}</div>
              <h3 className="text-sm font-semibold text-gray-200 mb-1.5">{step.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/5 to-transparent p-10 text-center">
          <h2 className="text-3xl font-bold text-gray-100 mb-3">
            Ready to become a validator?
          </h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            Join the Post Fiat network. The wizard takes 15 minutes and guides you through every command.
          </p>
          <Link
            href="/setup"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent hover:bg-accent-bright text-white
              font-semibold rounded-xl transition-all duration-150 active:scale-95
              shadow-[0_0_30px_rgba(244,63,94,0.2)]"
          >
            Start the wizard
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1e1f35] mt-8">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded bg-accent/20 flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-sm text-gray-500">PFT Validator Suite</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <a href="https://github.com/jollydinger/pftvalidatorsuite" target="_blank" rel="noopener noreferrer"
              className="hover:text-gray-400 transition-colors">GitHub</a>
            <a href="https://github.com/postfiatorg/postfiatd" target="_blank" rel="noopener noreferrer"
              className="hover:text-gray-400 transition-colors">postfiatd</a>
            <a href="https://x.com/JollyDinger" target="_blank" rel="noopener noreferrer"
              className="hover:text-gray-400 transition-colors">@JollyDinger</a>
          </div>
          <p className="text-xs text-gray-700">Open source — MIT License</p>
        </div>
      </footer>
    </div>
  )
}
