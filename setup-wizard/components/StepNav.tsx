'use client'

import { STEPS } from '@/lib/types'

interface StepNavProps {
  currentStep: number
  completedSteps: Set<number>
}

export function StepNav({ currentStep, completedSteps }: StepNavProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0">
        <div className="sticky top-8">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-4 px-3">
            Setup Steps
          </p>
          <nav className="flex flex-col gap-0.5">
            {STEPS.map((step, index) => {
              const isCompleted = completedSteps.has(index)
              const isCurrent = index === currentStep
              const isUpcoming = index > currentStep && !completedSteps.has(index)

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                    isCurrent
                      ? 'bg-accent-glow border border-accent/20 text-accent-bright'
                      : isCompleted
                      ? 'text-gray-400 hover:text-gray-300'
                      : 'text-gray-600'
                  }`}
                >
                  {/* Step indicator */}
                  <div
                    className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold transition-all ${
                      isCurrent
                        ? 'bg-accent text-white shadow-[0_0_8px_rgba(79,142,247,0.5)]'
                        : isCompleted
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-[#1a1b2e] text-gray-600 border border-[#1e1f35]'
                    }`}
                  >
                    {isCompleted ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>

                  {/* Step title */}
                  <span className={`text-sm font-medium ${isCurrent ? 'text-accent-bright' : ''}`}>
                    {step.shortTitle}
                    {step.optional && (
                      <span className="ml-1 text-[10px] text-gray-600 font-normal">(opt)</span>
                    )}
                  </span>
                </div>
              )
            })}
          </nav>

          {/* Progress bar */}
          <div className="mt-6 px-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1.5">
              <span>Progress</span>
              <span>{Math.round((completedSteps.size / STEPS.length) * 100)}%</span>
            </div>
            <div className="h-1 bg-[#1a1b2e] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${(completedSteps.size / STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile progress bar */}
      <div className="lg:hidden mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-300">
            Step {currentStep + 1} of {STEPS.length}
          </span>
          <span className="text-sm text-gray-500">{STEPS[currentStep]?.title}</span>
        </div>
        <div className="h-1.5 bg-[#1a1b2e] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-cyan-400 rounded-full transition-all duration-500"
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        {/* Mobile step dots */}
        <div className="flex gap-1.5 mt-3 justify-center">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === currentStep
                  ? 'w-6 bg-accent'
                  : completedSteps.has(i)
                  ? 'w-2 bg-green-500'
                  : 'w-2 bg-[#1e1f35]'
              }`}
            />
          ))}
        </div>
      </div>
    </>
  )
}
