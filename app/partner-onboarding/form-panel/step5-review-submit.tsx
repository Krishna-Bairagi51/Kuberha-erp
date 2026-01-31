import { Step5Props } from '@/types';
import { ChevronDown, Edit2 } from 'lucide-react';
import { useState } from 'react';

export function Step5ReviewSubmit({ formData, onBack, onEdit, onSubmit }: Step5Props) {
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        business: true,
        registrations: true,
        brand: true,
        declarations: true,
    });

    const toggleSection = (section: string) => {
        setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    return (
        <div className="px-[16px]">
            {/* Navigation - Above Card */}
            <div className="flex items-center justify-between mb-[16px]">
                <button
                    onClick={onBack}
                    className="px-[16px] py-[8px] border border-[#e8e8e8] rounded-[8px] font-urbanist font-semibold text-[14px] text-[#606060] leading-[20px] hover:bg-white"
                >
                    Back: Declarations
                </button>
                <button
                    onClick={onSubmit}
                    className="bg-[#B04725] px-[24px] py-[10px] rounded-[8px] font-urbanist font-bold text-[16px] text-white leading-[22px] tracking-[-0.18px] hover:bg-[#8e3519]"
                >
                    Submit for Verification
                </button>
            </div>

            {/* Card Header */}
            <div className="bg-white rounded-tl-[8px] rounded-tr-[8px] border border-[#e6eaed] shadow-[0px_4px_24px_0px_rgba(236,236,236,0.25)] px-[8px] py-[16px]">
                <div>
                    <h2 className="font-urbanist font-semibold text-[16px] text-[#212b36] leading-[22px] tracking-[-0.18px]">
                        Review Your Details
                    </h2>
                    <p className="font-urbanist font-semibold text-[14px] text-[#a4a4a4] leading-[20px] mt-[4px]">
                        Please confirm your details before submitting for verification.
                    </p>
                </div>
            </div>

            {/* Card Content */}
            <div className="bg-white rounded-bl-[8px] rounded-br-[8px] border border-t-0 border-[#e6eaed] shadow-[0px_1px_1px_1px_rgba(198,198,198,0.2)] px-[8px] py-[20px]">
                <div className="space-y-[8px]">
                    {/* Business Profile Section */}
                    <div className="border border-[#e8e8e8] rounded-[5px] overflow-hidden">
                        <div
                            className="flex items-center justify-between p-[12px] bg-[#fcfcfc] cursor-pointer hover:bg-gray-100"
                            onClick={() => toggleSection('business')}
                        >
                            <h3 className="font-urbanist font-semibold text-[14px] text-[#212b36] leading-[20px]">
                                Business Profile
                            </h3>
                            <div className="flex items-center gap-[8px]">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(1);
                                    }}
                                    className="flex items-center gap-[4px] font-urbanist font-semibold text-[14px] text-[#007086] leading-[20px] hover:text-[#005d6e]"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Edit
                                </button>
                                <ChevronDown
                                    className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.business ? 'rotate-180' : ''
                                        }`}
                                />
                            </div>
                        </div>
                        {expandedSections.business && (
                            <div className="p-[12px] space-y-[12px] font-urbanist font-semibold text-[14px] leading-[20px]">
                                <div className="grid grid-cols-2 gap-[12px]">
                                    <div>
                                        <span className="text-[#8e8e8e]">Legal Entity Name:</span>
                                        <p className="mt-[4px] text-[#606060]">{formData.legalEntityName || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-[#8e8e8e]">Brand / Trading Name:</span>
                                        <p className="mt-[4px] text-[#606060]">{formData.brandName || '-'}</p>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[#8e8e8e]">Business Type:</span>
                                    <p className="mt-[4px] text-[#606060]">
                                        {formData.businessType === 'Other'
                                            ? formData.businessTypeOther
                                            : formData.businessType || '-'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[#8e8e8e]">Registered Office Address:</span>
                                    <p className="mt-[4px] text-[#606060]">
                                        {formData.regAddress.line1}, {formData.regAddress.line2 && `${formData.regAddress.line2}, `}
                                        {formData.regAddress.city}, {formData.regAddress.state}, {formData.regAddress.pinCode},{' '}
                                        {formData.regAddress.country}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-[12px]">
                                    <div>
                                        <span className="text-[#8e8e8e]">Contact Person:</span>
                                        <p className="mt-[4px] text-[#606060]">{formData.contactPersonName || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-[#8e8e8e]">Designation:</span>
                                        <p className="mt-[4px] text-[#606060]">{formData.designation || '-'}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-[12px]">
                                    <div>
                                        <span className="text-[#8e8e8e]">Mobile:</span>
                                        <p className="mt-[4px] text-[#606060]">+91 {formData.mobileNumber || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-[#8e8e8e]">Email:</span>
                                        <p className="mt-[4px] text-[#606060]">{formData.email || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Registrations & Bank Section */}
                    <div className="border border-[#e8e8e8] rounded-[5px] overflow-hidden">
                        <div
                            className="flex items-center justify-between p-[12px] bg-[#fcfcfc] cursor-pointer hover:bg-gray-100"
                            onClick={() => toggleSection('registrations')}
                        >
                            <h3 className="font-urbanist font-semibold text-[14px] text-[#212b36] leading-[20px]">
                                Registrations & Bank
                            </h3>
                            <div className="flex items-center gap-[8px]">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(2);
                                    }}
                                    className="flex items-center gap-[4px] font-urbanist font-semibold text-[14px] text-[#007086] leading-[20px] hover:text-[#005d6e]"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Edit
                                </button>
                                <ChevronDown
                                    className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.registrations ? 'rotate-180' : ''
                                        }`}
                                />
                            </div>
                        </div>
                        {expandedSections.registrations && (
                            <div className="p-[12px] space-y-[12px] font-urbanist font-semibold text-[14px] leading-[20px]">
                                <div className="grid grid-cols-2 gap-[12px]">
                                    <div>
                                        <span className="text-[#8e8e8e]">GSTIN:</span>
                                        <p className="mt-[4px] text-[#606060]">{formData.gstin || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-[#8e8e8e]">PAN:</span>
                                        <p className="mt-[4px] text-[#606060]">{formData.pan || '-'}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-[12px]">
                                    <div>
                                        <span className="text-[#8e8e8e]">CIN / Registration Number:</span>
                                        <p className="mt-[4px] text-[#606060]">{formData.cin || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-[#8e8e8e]">Shops & Establishments No.:</span>
                                        <p className="mt-[4px] text-[#606060]">{formData.shopsEstablishment || '-'}</p>
                                    </div>
                                </div>
                                <div className="pt-[12px] border-t border-[#e8e8e8]">
                                    <span className="text-[#8e8e8e]">Bank Account:</span>
                                    <p className="mt-[4px] text-[#606060]">****{formData.accountNumber.slice(-4) || '****'}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-[12px]">
                                    <div>
                                        <span className="text-[#8e8e8e]">IFSC Code:</span>
                                        <p className="mt-[4px] text-[#606060]">{formData.ifscCode || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-[#8e8e8e]">Account Type:</span>
                                        <p className="mt-[4px] text-[#606060]">{formData.accountType || '-'}</p>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[#8e8e8e]">Bank & Branch:</span>
                                    <p className="mt-[4px] text-[#606060]">
                                        {formData.bankName || '-'}, {formData.branchName || '-'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Brand & IP Section */}
                    <div className="border border-[#e8e8e8] rounded-[5px] overflow-hidden">
                        <div
                            className="flex items-center justify-between p-[12px] bg-[#fcfcfc] cursor-pointer hover:bg-gray-100"
                            onClick={() => toggleSection('brand')}
                        >
                            <h3 className="font-urbanist font-semibold text-[14px] text-[#212b36] leading-[20px]">
                                Brand & IP
                            </h3>
                            <div className="flex items-center gap-[8px]">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(3);
                                    }}
                                    className="flex items-center gap-[4px] font-urbanist font-semibold text-[14px] text-[#007086] leading-[20px] hover:text-[#005d6e]"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Edit
                                </button>
                                <ChevronDown
                                    className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.brand ? 'rotate-180' : ''
                                        }`}
                                />
                            </div>
                        </div>
                        {expandedSections.brand && (
                            <div className="p-[12px] space-y-[12px] font-urbanist font-semibold text-[14px] leading-[20px]">
                                <div>
                                    <span className="text-[#8e8e8e]">Registered Trademark:</span>
                                    <p className="mt-[4px] text-[#606060]">{formData.hasTrademark ? 'Yes' : 'No'}</p>
                                </div>
                                {formData.hasTrademark && (
                                    <>
                                        <div className="grid grid-cols-2 gap-[12px]">
                                            <div>
                                                <span className="text-[#8e8e8e]">Trademark Brand Name:</span>
                                                <p className="mt-[4px] text-[#606060]">{formData.trademarkBrandName || '-'}</p>
                                            </div>
                                            <div>
                                                <span className="text-[#8e8e8e]">Registration Number:</span>
                                                <p className="mt-[4px] text-[#606060]">{formData.trademarkNumber || '-'}</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                                <div className="pt-[12px] border-t border-[#e8e8e8]">
                                    <span className="text-[#8e8e8e]">Design Registration:</span>
                                    <p className="mt-[4px] text-[#606060]">{formData.hasDesignRegistration ? 'Yes' : 'No'}</p>
                                </div>
                                <div className="pt-[12px] border-t border-[#e8e8e8]">
                                    <span className="text-[#8e8e8e]">Third-party Content:</span>
                                    <p className="mt-[4px] text-[#606060]">{formData.hasThirdPartyContent ? 'Yes' : 'No'}</p>
                                </div>
                                <div>
                                    <span className="text-[#8e8e8e]">Brand/IP Confirmation:</span>
                                    <p className="mt-[4px] text-[#606060]">{formData.brandIPConfirmation ? 'Confirmed ✓' : 'Not confirmed'}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Declarations & Signatory Section */}
                    <div className="border border-[#e8e8e8] rounded-[5px] overflow-hidden">
                        <div
                            className="flex items-center justify-between p-[12px] bg-[#fcfcfc] cursor-pointer hover:bg-gray-100"
                            onClick={() => toggleSection('declarations')}
                        >
                            <h3 className="font-urbanist font-semibold text-[14px] text-[#212b36] leading-[20px]">
                                Declarations & Signatory
                            </h3>
                            <div className="flex items-center gap-[8px]">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(4);
                                    }}
                                    className="flex items-center gap-[4px] font-urbanist font-semibold text-[14px] text-[#007086] leading-[20px] hover:text-[#005d6e]"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Edit
                                </button>
                                <ChevronDown
                                    className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.declarations ? 'rotate-180' : ''
                                        }`}
                                />
                            </div>
                        </div>
                        {expandedSections.declarations && (
                            <div className="p-[12px] space-y-[12px] font-urbanist font-semibold text-[14px] leading-[20px]">
                                <div>
                                    <span className="text-[#8e8e8e]">Declarations Agreed:</span>
                                    <p className="mt-[4px] text-[#606060]">{formData.declarationAgreed ? 'Yes ✓' : 'Not agreed'}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-[12px] pt-[12px] border-t border-[#e8e8e8]">
                                    <div>
                                        <span className="text-[#8e8e8e]">Signatory Name:</span>
                                        <p className="mt-[4px] text-[#606060]">{formData.signatoryName || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-[#8e8e8e]">Designation:</span>
                                        <p className="mt-[4px] text-[#606060]">{formData.signatoryDesignation || '-'}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-[12px]">
                                    <div>
                                        <span className="text-[#8e8e8e]">Place:</span>
                                        <p className="mt-[4px] text-[#606060]">{formData.signatoryPlace || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-[#8e8e8e]">Date:</span>
                                        <p className="mt-[4px] text-[#606060]">{formData.signatoryDate || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="mt-[24px]">
                <p className="text-center font-urbanist font-semibold text-[12px] text-[#a4a4a4] leading-[16px]">
                    After submission, you'll receive an update once your account is verified.
                </p>
            </div>
        </div>
    );
}
