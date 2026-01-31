import { useState } from 'react';
import { CheckCircle, Clock, Mail, Phone, XCircle, AlertTriangle, ArrowRight, AlertCircle } from 'lucide-react';
import { ApplicationStatus, PendingApprovalProps } from '@/types';
import Image from 'next/image';
import { toast } from 'sonner';

export function PendingApproval({ onLogout }: PendingApprovalProps) {
    // For demonstration purposes, we'll use local state to toggle views.
    // In a real app, this would come from props or a global store.
    const [status, setStatus] = useState<ApplicationStatus>('pending');
    const [reminderSent, setReminderSent] = useState(false);

    const rejectionReasons = [
        'Missing or wrong data provided in Step 1',
        'Bank proof document is unclear or invalid',
        'Other: Discrepancy in GSTIN and Trade Name',
    ];

    const suspensionReason = 'Violation of marketplace policies regarding product quality standards.';

    const handleSendReminder = () => {
        setReminderSent(true);
        setTimeout(() => setReminderSent(false), 30000); // Reset after 30s
        toast.success('Reminder sent to the admin team!');
    };

    const renderContent = () => {
        switch (status) {
            case 'approved':
                return (
                    <div className="bg-white rounded-[8px] border border-[#e6eaed] shadow-[0px_4px_24px_0px_rgba(236,236,236,0.25)] p-[40px]">
                        <div className="flex justify-center mb-[24px]">
                            <div className="w-[80px] h-[80px] bg-[#ecfdf3] rounded-full flex items-center justify-center">
                                <CheckCircle className="w-[40px] h-[40px] text-[#027a48]" />
                            </div>
                        </div>

                        <h2 className="font-urbanist font-bold text-[24px] text-[#212b36] leading-[32px] text-center mb-[12px]">
                            Application Approved!
                        </h2>

                        <p className="font-urbanist font-semibold text-[16px] text-[#606060] leading-[24px] text-center mb-[32px]">
                            Congratulations! Your partner account has been approved. You can now access your dashboard and start listing products.
                        </p>

                        <button className="w-full bg-[#B04725] h-[48px] rounded-lg font-urbanist font-bold text-[16px] text-white hover:bg-[#8e3519] transition-colors shadow-sm flex items-center justify-center gap-2">
                            Continue to Dashboard
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                );

            case 'rejected':
                return (
                    <div className="bg-white rounded-[8px] border border-[#e6eaed] shadow-[0px_4px_24px_0px_rgba(236,236,236,0.25)] p-[40px]">
                        <div className="flex justify-center mb-[24px]">
                            <div className="w-[80px] h-[80px] bg-[#fef3f2] rounded-full flex items-center justify-center">
                                <XCircle className="w-[40px] h-[40px] text-[#d92d20]" />
                            </div>
                        </div>

                        <h2 className="font-urbanist font-bold text-[24px] text-[#212b36] leading-[32px] text-center mb-[12px]">
                            Application Rejected
                        </h2>

                        <p className="font-urbanist font-semibold text-[16px] text-[#606060] leading-[24px] text-center mb-[24px]">
                            Unfortunately, we could not approve your application at this time.
                        </p>

                        <div className="bg-[#fef3f2] border border-[#fecdca] rounded-[8px] p-[24px] mb-[32px]">
                            <h3 className="font-urbanist font-bold text-[14px] text-[#b42318] mb-[12px]">
                                Reasons for rejection:
                            </h3>
                            <ul className="space-y-3">
                                {rejectionReasons.map((reason, index) => (
                                    <li key={index} className="flex items-start gap-2 text-[14px] text-[#b42318] font-urbanist font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#b42318] mt-2 shrink-0" />
                                        {reason}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <p className="text-center font-urbanist font-medium text-[14px] text-[#606060] mb-[24px]">
                            Please update your application with the correct details and submit again.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={onLogout}
                                className="flex-1 px-[24px] py-[12px] border border-[#e8e8e8] rounded-[8px] font-urbanist font-semibold text-[14px] text-[#606060] hover:bg-[#fafbfc] transition-colors"
                            >
                                Log Out
                            </button>
                            <button className="flex-1 bg-[#B04725] px-[24px] py-[12px] rounded-[8px] font-urbanist font-bold text-[14px] text-white hover:bg-[#8e3519] transition-colors shadow-sm">
                                Edit Application
                            </button>
                        </div>
                    </div>
                );

            case 'suspended':
                return (
                    <div className="bg-white rounded-[8px] border border-[#e6eaed] shadow-[0px_4px_24px_0px_rgba(236,236,236,0.25)] p-[40px]">
                        <div className="flex justify-center mb-[24px]">
                            <div className="w-[80px] h-[80px] bg-[#fff4ed] rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-[40px] h-[40px] text-[#B04725]" />
                            </div>
                        </div>

                        <h2 className="font-urbanist font-bold text-[24px] text-[#212b36] leading-[32px] text-center mb-[12px]">
                            Account Suspended
                        </h2>

                        <div className="bg-[#fff4ed] border border-[#ffe6d5] rounded-[8px] p-[24px] mb-[32px]">
                            <div className="flex gap-3">
                                <AlertCircle className="w-5 h-5 text-[#B04725] shrink-0" />
                                <div>
                                    <h3 className="font-urbanist font-bold text-[14px] text-[#943519] mb-[4px]">
                                        Suspension Reason
                                    </h3>
                                    <p className="font-urbanist font-medium text-[14px] text-[#943519]">
                                        {suspensionReason}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <p className="font-urbanist font-medium font-medium text-[14px] text-[#606060] text-center mb-[32px]">
                            Please contact our support team for further assistance regarding your account status.
                        </p>

                        <button
                            onClick={onLogout}
                            className="w-full px-[24px] py-[12px] border border-[#e8e8e8] rounded-[8px] font-urbanist font-semibold text-[14px] text-[#606060] hover:bg-[#fafbfc] transition-colors"
                        >
                            Log Out
                        </button>
                    </div>
                );

            case 'pending':
            default:
                return (
                    <div className="bg-white rounded-[8px] border border-[#e6eaed] shadow-[0px_4px_24px_0px_rgba(236,236,236,0.25)] p-[40px]">
                        {/* Icon */}
                        <div className="flex justify-center mb-[24px]">
                            <div className="relative">
                                <div className="w-[80px] h-[80px] bg-[#fef3f0] rounded-full flex items-center justify-center">
                                    <Clock className="w-[40px] h-[40px] text-[#B04725]" />
                                </div>
                                <div className="absolute -top-1 -right-1 w-[28px] h-[28px] bg-white rounded-full border-4 border-white flex items-center justify-center">
                                    <CheckCircle className="w-[20px] h-[20px] text-green-500" />
                                </div>
                            </div>
                        </div>

                        {/* Title */}
                        <h2 className="font-urbanist font-bold text-[24px] text-[#212b36] leading-[32px] tracking-[-0.26px] text-center mb-[12px]">
                            Application Under Review
                        </h2>

                        {/* Description */}
                        <p className="font-urbanist font-semibold text-[16px] text-[#606060] leading-[24px] text-center mb-[32px]">
                            Thank you for submitting your onboarding application. Our team is currently reviewing your details.
                        </p>

                        {/* Status Timeline */}
                        <div className="bg-[#fafbfc] rounded-[8px] border border-[#e8e8e8] p-[24px] mb-[32px]">
                            <div className="space-y-[16px]">
                                <div className="flex items-start gap-[12px]">
                                    <div className="w-[24px] h-[24px] bg-green-500 rounded-full flex items-center justify-center shrink-0 mt-[2px]">
                                        <CheckCircle className="w-[16px] h-[16px] text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-urbanist font-semibold text-[14px] text-[#212b36] leading-[20px]">
                                            Application Submitted
                                        </h3>
                                        <p className="font-urbanist font-semibold text-[12px] text-[#8e8e8e] leading-[16px] mt-[4px]">
                                            Your application was successfully received
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-[12px]">
                                    <div className="w-[24px] h-[24px] bg-[#B04725] rounded-full flex items-center justify-center shrink-0 mt-[2px] animate-pulse">
                                        <Clock className="w-[14px] h-[14px] text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-urbanist font-semibold text-[14px] text-[#212b36] leading-[20px]">
                                            Document Verification in Progress
                                        </h3>
                                        <p className="font-urbanist font-semibold text-[12px] text-[#8e8e8e] leading-[16px] mt-[4px]">
                                            Our team is verifying your documents
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-[12px]">
                                    <div className="w-[24px] h-[24px] bg-[#e8e8e8] rounded-full flex items-center justify-center shrink-0 mt-[2px]">
                                        <div className="w-[12px] h-[12px] border-2 border-[#a4a4a4] rounded-full" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-urbanist font-semibold text-[14px] text-[#8e8e8e] leading-[20px]">
                                            Account Activation
                                        </h3>
                                        <p className="font-urbanist font-semibold text-[12px] text-[#a4a4a4] leading-[16px] mt-[4px]">
                                            Your account will be activated after approval
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Expected Timeline */}
                        <div className="bg-[#fef3f0] border border-[#e8bfb3] rounded-[8px] p-[16px] mb-[24px]">
                            <p className="font-urbanist font-semibold text-[14px] text-[#8e2e17] leading-[20px] text-center">
                                <span className="font-urbanist font-bold">Expected Timeline:</span> We typically complete reviews within 2-3 business days
                            </p>
                        </div>

                        {/* Send Reminder Button */}
                        {/* <div className="mb-[32px]">
                            <button
                                onClick={handleSendReminder}
                                disabled={reminderSent}
                                className="w-full bg-white border border-[#B04725] text-[#B04725] h-[40px] rounded-lg font-urbanist font-bold text-[14px] hover:bg-[#fff4ed] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                            >
                                {reminderSent ? 'Reminder Sent' : 'Send a Reminder'}
                            </button>
                        </div> */}

                        {/* Contact Information */}
                        <div className="space-y-[16px] mb-[32px]">
                            <h3 className="font-urbanist font-semibold text-[16px] text-[#212b36] leading-[22px] text-center">
                                Need Help?
                            </h3>
                            <div className="flex justify-center gap-[32px]">
                                <div className="flex items-center gap-[8px]">
                                    <div className="w-[36px] h-[36px] bg-[#fafbfc] rounded-full flex items-center justify-center">
                                        <Mail className="w-[18px] h-[18px] text-[#B04725]" />
                                    </div>
                                    <div>
                                        <p className="font-urbanist font-semibold text-[12px] text-[#8e8e8e] leading-[16px]">
                                            Email
                                        </p>
                                        <p className="font-urbanist font-semibold text-[14px] text-[#606060] leading-[20px]">
                                            support@casacarigar.com
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-[8px]">
                                    <div className="w-[36px] h-[36px] bg-[#fafbfc] rounded-full flex items-center justify-center">
                                        <Phone className="w-[18px] h-[18px] text-[#B04725]" />
                                    </div>
                                    <div>
                                        <p className="font-urbanist font-semibold text-[12px] text-[#8e8e8e] leading-[16px]">
                                            Phone
                                        </p>
                                        <p className="font-urbanist font-semibold text-[14px] text-[#606060] leading-[20px]">
                                            +91 XXXXXXXXXX
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={onLogout}
                            className="w-full px-[24px] py-[12px] border border-[#e8e8e8] rounded-[8px] font-urbanist font-semibold text-[14px] text-[#606060] leading-[20px] hover:bg-[#fafbfc] transition-colors"
                        >
                            Log Out
                        </button>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center p-[16px]">
            <div className="w-full max-w-[640px]">
                {/* Logo/Header */}
                <div className="relative flex items-center justify-center gap-3 my-[52px] w-[500px] inline-flex justify-center">
                    <Image
                        src="/images/Logo_Casa Carigar_TERRACOTTA 1.png"
                        alt="Casa Carigar Logo"
                        width={320}
                        height={320}
                        className="object-contain absolute left-6"
                        priority
                    />
                    <h1 className="font-urbanist font-bold text-[28px] text-[#212b36] leading-[36px] tracking-[-0.32px] text-nowrap absolute right-0">
                        Partner Onboarding
                    </h1>
                </div>

                {renderContent()}

                {/* Footer Note */}
                {status === 'pending' && (
                    <p className="text-center font-urbanist font-semibold text-[12px] text-[#a4a4a4] leading-[16px] mt-[24px]">
                        You will receive an email and SMS notification once your account is approved
                    </p>
                )}

                {/* Demo Controls (Hidden in production) */}
                {/* <div className="fixed bottom-4 right-4 bg-white p-2 rounded shadow border border-gray-200 text-xs opacity-50 hover:opacity-100 transition-opacity">
                    <p className="mb-1 font-bold">Demo Controls:</p>
                    <div className="flex gap-2">
                        <button onClick={() => setStatus('pending')} className={`px-2 py-1 rounded ${status === 'pending' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}>Pending</button>
                        <button onClick={() => setStatus('approved')} className={`px-2 py-1 rounded ${status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>Approved</button>
                        <button onClick={() => setStatus('rejected')} className={`px-2 py-1 rounded ${status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100'}`}>Rejected</button>
                        <button onClick={() => setStatus('suspended')} className={`px-2 py-1 rounded ${status === 'suspended' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100'}`}>Suspended</button>
                    </div>
                </div> */}
            </div>
        </div>
    );
}
