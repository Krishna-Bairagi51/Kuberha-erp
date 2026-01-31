import type { FormData, FormPanelProps } from '@/types';
import { Step1BusinessProfile } from './step1-business-profile';
import { Step2RegistrationsBank } from './step2-registrations-bank';
import { Step3BrandIP } from './step3-brand-ip';
import { Step4Declarations } from './step4-declarations';
import { Step5ReviewSubmit } from './step5-review-submit';

export function FormPanel({
    currentStep,
    formData,
    updateFormData,
    onNext,
    onBack,
    onSaveDraft,
    onSubmit,
    goToStep,
}: FormPanelProps) {
    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <Step1BusinessProfile
                        formData={formData}
                        updateFormData={updateFormData}
                        onNext={onNext}
                        onSaveDraft={onSaveDraft}
                    />
                );
            case 2:
                return (
                    <Step2RegistrationsBank
                        formData={formData}
                        updateFormData={updateFormData}
                        onNext={onNext}
                        onBack={onBack}
                        onSaveDraft={onSaveDraft}
                    />
                );
            case 3:
                return (
                    <Step3BrandIP
                        formData={formData}
                        updateFormData={updateFormData}
                        onNext={onNext}
                        onBack={onBack}
                        onSaveDraft={onSaveDraft}
                    />
                );
            case 4:
                return (
                    <Step4Declarations
                        formData={formData}
                        updateFormData={updateFormData}
                        onNext={onNext}
                        onBack={onBack}
                        onSaveDraft={onSaveDraft}
                    />
                );
            case 5:
                return (
                    <Step5ReviewSubmit
                        formData={formData}
                        onBack={onBack}
                        onEdit={goToStep}
                        onSubmit={onSubmit}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
            <div className="mt-6">{renderStep()}</div>
        </div>
    );
}
