'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { WizardConfig, defaultConfig, STEPS } from '@/lib/types'
import { StepNav } from '@/components/StepNav'
import { StepWelcome } from '@/components/steps/StepWelcome'
import { StepServer } from '@/components/steps/StepServer'
import { StepDocker } from '@/components/steps/StepDocker'
import { StepValidatorNode } from '@/components/steps/StepValidatorNode'
import { StepKeys } from '@/components/steps/StepKeys'
import { StepActivate } from '@/components/steps/StepActivate'
import { StepDomain } from '@/components/steps/StepDomain'
import { StepSidecar } from '@/components/steps/StepSidecar'
import { StepComplete } from '@/components/steps/StepComplete'

export default function SetupPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [config, setConfigState] = useState<WizardConfig>(defaultConfig)
  const [animKey, setAnimKey] = useState(0)

  const setConfig = useCallback((updates: Partial<WizardConfig>) => {
    setConfigState((prev) => ({ ...prev, ...updates }))
  }, [])

  const goNext = useCallback(() => {
    setCompletedSteps((prev) => new Set([...prev, currentStep]))
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1))
    setAnimKey((k) => k + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentStep])

  const goBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
    setAnimKey((k) => k + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const goToStep = useCallback((index: number) => {
    if (index < currentStep || completedSteps.has(index)) {
      setCurrentStep(index)
      setAnimKey((k) => k + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentStep, completedSteps])

  const stepProps = {
    config,
    setConfig,
    onNext: goNext,
    onBack: goBack,
    isFirst: currentStep === 0,
    isLast: currentStep === STEPS.length - 1,
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <StepWelcome {...stepProps} />
      case 1: return <StepServer {...stepProps} />
      case 2: return <StepDocker {...stepProps} />
      case 3: return <StepValidatorNode {...stepProps} />
      case 4: return <StepKeys {...stepProps} />
      case 5: return <StepActivate {...stepProps} />
      case 6: return <StepDomain {...stepProps} />
      case 7: return <StepSidecar {...stepProps} />
      case 8: return <StepComplete config={config} />
      default: return null
    }
  }

  const isComplete = currentStep === STEPS.length - 1

  return (
    <div className="min-h-screen bg-[#06070d]">
      {/* Top nav */}
      <header className="border-b border-[#1e1f35] bg-[#06070d]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-200">PFT Validator Setup</span>
          </Link>

          <div className="flex items-center gap-3">
            {/* Estimated time */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              ~15 min
            </div>
            <a
              href="https://github.com/jollydinger/pftvalidatorsuite"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-10">
          {/* Sidebar nav */}
          <StepNav currentStep={currentStep} completedSteps={completedSteps} onStepClick={goToStep} />

          {/* Step content */}
          <main className="flex-1 min-w-0">
            {/* Content card */}
            <div className={`rounded-xl border ${isComplete ? 'border-green-500/20' : 'border-[#1e1f35]'} bg-[#0e0f1a] p-6 sm:p-8`}>
              <div key={animKey}>
                {renderStep()}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
