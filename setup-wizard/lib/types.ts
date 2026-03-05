export interface WizardConfig {
  serverIp: string
  sshUser: string
  network: 'testnet' | 'devnet'
  validatorPubKey: string
  hasDomain: boolean
  domain: string
  hasWebhook: boolean
  webhookType: 'discord' | 'slack'
  webhookUrl: string
}

export const defaultConfig: WizardConfig = {
  serverIp: '',
  sshUser: 'root',
  network: 'testnet',
  validatorPubKey: '',
  hasDomain: false,
  domain: '',
  hasWebhook: false,
  webhookType: 'discord',
  webhookUrl: '',
}

export interface StepProps {
  config: WizardConfig
  setConfig: (updates: Partial<WizardConfig>) => void
  onNext: () => void
  onBack: () => void
  isFirst: boolean
  isLast: boolean
}

export interface Step {
  id: string
  title: string
  shortTitle: string
  optional?: boolean
}

export const STEPS: Step[] = [
  { id: 'welcome', title: 'Welcome', shortTitle: 'Welcome' },
  { id: 'server', title: 'Server Provisioning', shortTitle: 'Server' },
  { id: 'docker', title: 'Install Docker', shortTitle: 'Docker' },
  { id: 'node', title: 'Validator Node Setup', shortTitle: 'Node' },
  { id: 'keys', title: 'Key Generation', shortTitle: 'Keys' },
  { id: 'domain', title: 'Domain Verification', shortTitle: 'Domain', optional: true },
  { id: 'sidecar', title: 'Health Monitoring', shortTitle: 'Monitor' },
  { id: 'complete', title: "You're Live!", shortTitle: 'Done' },
]
