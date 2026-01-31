import React from 'react';
import { ArrowLeft, LogOut, Check } from 'lucide-react';
import { TopPanelProps } from '@/types';

const INDIGO = '#5b47d8';
const LIGHT_GRAY = '#e8e8e8';
const TEXT_GRAY = '#a4a4a4';
const TEXT_DARK = '#212b36';

export function TopPanel({ steps, currentStep, onLogout }: TopPanelProps) {
  return (
    <header className="w-full bg-white border-b border-[#e8e8e8] sticky top-0 z-40 overflow-x-hidden">
      <div className="max-w-[1400px] mx-auto px-4 py-4 flex items-center justify-between">
        {/* Back button */}
        <div className="flex items-center flex-shrink-0">
          <button onClick={onLogout} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-md transition-colors text-[#606060]">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-urbanist font-semibold text-[14px] leading-[20px]">Back to Login Page</span>
          </button>
        </div>

        {/* Stepper center */}
        <nav className="flex-1 min-w-0">
          <div className="flex items-center justify-center">
            {steps.map((step, idx) => {
              const isCompleted = step.id < currentStep;
              const isCurrent = step.id === currentStep;

              return (
                <div key={step.id} className="flex items-center">
                  {/* single step: circle + label (inline) */}
                  <div className="flex items-center gap-3 min-w-0">
                    {/* circle */}
                    <div className="flex items-center">
                      {isCompleted ? (
                        <div
                          className="flex items-center justify-center rounded-full"
                          style={{ width: 32, height: 32, background: INDIGO }}
                          aria-hidden
                        >
                          <Check className="w-4 h-4 text-white" strokeWidth={3} />
                        </div>
                      ) : isCurrent ? (
                        <div style={{ width: 32, height: 32 }} className="relative" aria-hidden>
                          {/* dashed spinner-like ring */}
                          <svg className="w-[32px] h-[32px] -rotate-90" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" fill="none" stroke={LIGHT_GRAY} strokeWidth="1.6" />
                            <circle
                              cx="12"
                              cy="12"
                              r="10"
                              fill="none"
                              stroke={INDIGO}
                              strokeWidth="1.6"
                              strokeDasharray="62.83"
                              strokeDashoffset="24"
                              strokeLinecap="round"
                            />
                          </svg>
                          {/* hollow center */}
                          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] rounded-full bg-white" />
                        </div>
                      ) : (
                        <div
                          className="rounded-full"
                          style={{
                            width: 32,
                            height: 32,
                            border: `2px solid ${LIGHT_GRAY}`,
                            background: '#fff',
                          }}
                          aria-hidden
                        />
                      )}
                    </div>

                    {/* label (inline) */}
                    <div className="min-w-0">
                      <span
                        className="font-urbanist font-semibold text-[15px] leading-[20px] block truncate"
                        style={{ color: isCompleted || isCurrent ? TEXT_DARK : TEXT_GRAY, maxWidth: 160 }}
                      >
                        {step.label}
                      </span>
                    </div>
                  </div>

                  {/* connector between steps: chevron */}
                  {idx < steps.length - 1 && (
                    <div className="flex items-center px-4">
                      {/* chevron arrow */}
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden
                      >
                        <path
                          d="M8 5l7 7-7 7"
                          stroke={step.id < currentStep ? INDIGO : LIGHT_GRAY}
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* Logout */}
        <div className="flex items-center flex-shrink-0">
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-md transition-colors text-[#606060]"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-urbanist font-semibold text-[14px] leading-[20px]">Log Out</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
