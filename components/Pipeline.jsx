'use client'
import StepBlock from './StepBlock'

export default function Pipeline({
  steps, onChange, onSaveVersion,
  chainActiveKey, chainCompletedSteps, chainErrorStep,
}) {
  return (
    <div className="space-y-6 pb-8">
      {steps.map((step, idx) => (
        <StepBlock
          key={step.id}
          step={step}
          stepIndex={idx}
          totalSteps={steps.length}
          onChange={onChange}
          onSaveVersion={onSaveVersion}
          isChainActive={chainActiveKey === step.id}
          isChainDone={chainCompletedSteps?.includes(step.id)}
          isChainError={chainErrorStep === step.id}
        />
      ))}
    </div>
  )
}
