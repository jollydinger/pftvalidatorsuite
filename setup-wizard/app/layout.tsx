import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PFT Validator Setup',
  description: 'Set up your Post Fiat validator in 15 minutes. Step-by-step guided setup for institutional and retail participants — no DevOps experience required.',
  keywords: ['PFT', 'Post Fiat', 'validator', 'setup', 'blockchain', 'XRP Ledger'],
  openGraph: {
    title: 'PFT Validator Setup',
    description: 'Set up your Post Fiat validator in 15 minutes.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  )
}
