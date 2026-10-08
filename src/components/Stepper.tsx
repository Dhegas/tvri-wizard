import { Check } from 'lucide-react';

export interface StepItem {
  id: number;
  label: string;
  hasError?: boolean;
}

interface StepperProps {
  steps: StepItem[];
  currentStep: number;
  onStepClick: (stepId: number) => void;
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStep, onStepClick }) => {
  const currentStepObj = steps.find((s) => s.id === currentStep) || steps[0];
  const progressPercent = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="stepper-container">
      {/* Desktop Stepper */}
      <nav className="stepper-desktop" aria-label="Alur Pengisian">
        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isActive = step.id === currentStep;
          const isClickable = isCompleted;

          return (
            <div key={step.id} style={{ display: 'contents' }}>
              <button
                type="button"
                className={`step-item ${
                  isCompleted ? 'completed clickable' : isActive ? 'active' : 'upcoming'
                }`}
                onClick={() => {
                  if (isClickable) onStepClick(step.id);
                }}
                disabled={!isClickable && !isActive}
                aria-current={isActive ? 'step' : undefined}
                aria-label={`Langkah ${step.id}: ${step.label} (${
                  isCompleted ? 'Selesai' : isActive ? 'Sedang aktif' : 'Belum'
                })`}
              >
                <div className="step-circle-wrapper">
                  <div className="step-circle">
                    {isCompleted ? <Check size={16} strokeWidth={3} /> : step.id}
                  </div>
                  {step.hasError && <div className="step-error-dot" title="Terdapat kesalahan" />}
                </div>
                <span className="step-label">{step.label}</span>
              </button>

              {index < steps.length - 1 && (
                <div
                  className={`step-connector ${step.id < currentStep ? 'completed' : ''}`}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </nav>

      {/* Mobile Stepper */}
      <div className="stepper-mobile" aria-label="Alur Pengisian">
        <div className="stepper-mobile-text">
          <span className="stepper-mobile-label">
            Langkah {currentStep}: {currentStepObj.label}
          </span>
          <span className="stepper-mobile-progress tabular">
            {currentStep} dari {steps.length}
          </span>
        </div>
        <div className="progress-bar-bg" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={steps.length}>
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>
    </div>
  );
};
