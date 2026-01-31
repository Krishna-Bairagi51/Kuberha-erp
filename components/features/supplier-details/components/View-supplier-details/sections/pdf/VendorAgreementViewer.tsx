'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { VendorFormData } from './VendorAgreementForm';
import { Button } from '@/components/ui/button';
import { Printer, Download, FileCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface VendorAgreementViewerProps {
  formData: VendorFormData;
  onPrintOrDownload?: () => void;
  onPreviewReady?: () => void;
}

const VendorAgreementViewer: React.FC<VendorAgreementViewerProps> = ({ 
  formData, 
  onPrintOrDownload,
  onPreviewReady
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const previewReadyNotifiedRef = useRef(false);

  useEffect(() => {
    // Fetch the HTML template from public folder
    const templatePath = '/pdf/final_vendor_agreement (with blanks) (1).html';
    
    fetch(templatePath)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to load template: ${res.status} ${res.statusText}`);
        }
        return res.text();
      })
      .then(html => {
        // Replace blank fields with actual data
        let processedHtml = processHtmlTemplate(html, formData);
        setHtmlContent(processedHtml);
        // Reset the notification flag when new content is set
        previewReadyNotifiedRef.current = false;
      })
      .catch(err => {
        // Show error message
        setHtmlContent(`<html><body style="padding: 20px; font-family: Arial;"><h1>Error loading template</h1><p>${err.message}</p><p>Please ensure the template file exists at: ${templatePath}</p></body></html>`);
      });
  }, [formData]);

  const processHtmlTemplate = (html: string, data: VendorFormData): string => {
    let processed = html;

    // Function to escape HTML special characters
    const escapeHtml = (text: string) => {
      const map: { [key: string]: string } = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };
      return text.replace(/[&<>"']/g, (m) => map[m]);
    };

    const vendorName = escapeHtml(data.vendorName || '________________');
    const vendorType = escapeHtml(data.vendorType || '________________');
    const registeredOffice = escapeHtml(data.registeredOffice || '________________________________');
    const city = escapeHtml(data.city || '________________');
    const gstNumber = escapeHtml(data.gstNumber || '____________________');
    const date = escapeHtml(data.date || '22.10.2025');
    
    // Notices to Supplier fields (optional)
    // Address will use registered office, Attention will be "Name (Designation)"
    const supplierNoticeAddress = registeredOffice; // Use registered office address
    const supplierNoticeAttention = data.vendorSignatureName && data.vendorDesignation 
      ? `${escapeHtml(data.vendorSignatureName)} (${escapeHtml(data.vendorDesignation)})`
      : '';
    const supplierNoticeEmail = escapeHtml(data.supplierNoticeEmail || '');
    
    // Digital signature fields (required)
    const vendorSignatureName = escapeHtml(data.vendorSignatureName || '');
    const vendorDesignation = escapeHtml(data.vendorDesignation || '');
    
    // Commission percentage
    const commissionPercentage = escapeHtml(data.commissionPercentage || '____');

    // Replace date first - pattern in the agreement date section
    // Make the date bold
    processed = processed.replace(
      /(entered on )(\d{1,2}\.\d{1,2}\.\d{4})( at New Delhi\.)/,
      `$1<strong>${date}</strong>$3`
    );

    // Replace Commission Percentage - pattern: "____ of the Selling Price"
    processed = processed.replace(
      /____ of the Selling Price of each Product sold through the/g,
      `${commissionPercentage}% of the Selling Price of each Product sold through the`
    );
    
    // Replace notices to Supplier section - add content after the colon
    // Address field (line 3758) - use registered office
    if (supplierNoticeAddress) {
      processed = processed.replace(
        /(<div class="pdf24_01" style="left:10\.8108em;top:57\.4007em;"><span class="pdf24_13 pdf24_14 pdf24_24">:<\/span><\/div>)/,
        `<div class="pdf24_01" style="left:10.8108em;top:57.4007em;"><span class="pdf24_13 pdf24_14 pdf24_24">: ${supplierNoticeAddress}</span></div>`
      );
    }
    
    // Attention field (line 3759) - auto-generated as "Name (Designation)"
    if (supplierNoticeAttention) {
      processed = processed.replace(
        /(<div class="pdf24_01" style="left:10\.8108em;top:59\.2024em;"><span class="pdf24_13 pdf24_14 pdf24_24">:<\/span><\/div>)/,
        `<div class="pdf24_01" style="left:10.8108em;top:59.2024em;"><span class="pdf24_13 pdf24_14 pdf24_24">: ${supplierNoticeAttention}</span></div>`
      );
    }
    
    // Email field (line 3760)
    if (supplierNoticeEmail) {
      processed = processed.replace(
        /(<div class="pdf24_01" style="left:10\.8108em;top:61\.0532em;"><span class="pdf24_13 pdf24_14 pdf24_24">:<\/span><\/div>)/,
        `<div class="pdf24_01" style="left:10.8108em;top:61.0532em;"><span class="pdf24_13 pdf24_14 pdf24_24">: ${supplierNoticeEmail}</span></div>`
      );
    }
    
    // Remove signature box - no signature needed
    
    // Replace Vendor signature Name and Designation fields
    if (vendorSignatureName) {
      processed = processed.replace(
        /(<span class="pdf24_13 pdf24_14 pdf24_389">Name: )(&nbsp;<\/span>)/,
        `$1${vendorSignatureName}$2`
      );
    }
    
    if (vendorDesignation) {
      processed = processed.replace(
        /(<span class="pdf24_13 pdf24_14 pdf24_112">Designation: )(&nbsp;<\/span>)/,
        `$1${vendorDesignation}$2`
      );
    }

    // Create dynamic vendor paragraph - replaces lines 3130-3132 with a single flowing block
    // Make field labels bold as requested
    const vendorParagraph = `
      <div class="pdf24_01 vendor-dynamic-block" style="left:3.0042em;top:21.1757em;position:absolute;width:43.5em;">
        <span class="pdf24_13 pdf24_14" style="font-size:0.65em;font-family:'ADURSG+Book Antiqua';color:#000000;">
          <strong>${vendorName}</strong>, a <strong>${vendorType}</strong>, registered under the laws of India, having its <strong>registered office ${registeredOffice}</strong>, <strong>${city}</strong>, and bearing <strong>GST Registration Number - ${gstNumber}</strong>, (hereinafter referred to as the "<strong>Vendor</strong>", which expression shall, unless repugnant to the context or meaning thereof, include its successors, legal representatives, administrators, and permitted assigns), of the Other Part.
        </span>
      </div>`;

    // Find and replace the vendor section (lines 3130, 3131, 3132, 3133)
    // Pattern matches from "AND" div to "Part." div
    const vendorSectionRegex = /<div class="pdf24_01" style="left:3\.0042em;top:21\.1757em;">[\s\S]*?<\/div>\s*<div class="pdf24_01" style="left:3\.0042em;top:22\.0257em;">[\s\S]*?<\/div>\s*<div class="pdf24_01" style="left:3\.0042em;top:22\.8257em;">[\s\S]*?<\/div>\s*<div class="pdf24_01" style="left:3\.0042em;top:23\.6757em;">[\s\S]*?Part\.\s*&nbsp;<\/span><\/div>/;
    
    processed = processed.replace(vendorSectionRegex, vendorParagraph);

    // Add CSS for word wrapping and dynamic vendor block
    const wrappingCSS = `
      <style>
        .pdf24_01 {
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
          white-space: normal !important;
        }
        .pdf24_01 span {
          white-space: normal !important;
          word-break: break-word !important;
          overflow-wrap: break-word !important;
          display: inline !important;
        }
        /* Dynamic vendor block styling */
        .vendor-dynamic-block {
          position: absolute !important;
          width: 43.5em !important;
          white-space: normal !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
        }
        .vendor-dynamic-block span {
          white-space: normal !important;
          word-wrap: break-word !important;
          line-height: 1.3 !important;
          display: inline !important;
        }
        .vendor-dynamic-block strong {
          font-weight: bold !important;
        }
        @media print {
          .pdf24_01 {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      </style>
    `;

    // Insert CSS before closing head tag
    processed = processed.replace('</head>', wrappingCSS + '</head>');

    // Add JavaScript to adjust positions when vendor content expands
    const adjustmentScript = `
      <script>
        (function() {
          // Original positions for elements that need adjustment
          var originalPositions = {};
          var vendorBlockOriginalTop = 21.1757; // Original top of vendor block
          var vendorBlockOriginalBottom = 23.6757 + 0.85; // Original bottom (Part. line + line height)
          
          function storeOriginalPositions() {
            document.querySelectorAll('.pdf24_01').forEach(function(el, index) {
              var top = parseFloat(el.style.top) || 0;
              if (!originalPositions[index]) {
                originalPositions[index] = top;
              }
            });
          }
          
          function adjustAllPositions() {
            // Find the vendor dynamic block
            var vendorBlock = document.querySelector('.vendor-dynamic-block');
            if (!vendorBlock) return;
            
            // Get vendor block's actual height
            var vendorRect = vendorBlock.getBoundingClientRect();
            var fontSize = parseFloat(getComputedStyle(vendorBlock).fontSize) || 10.4; // 0.65em of 16px
            var vendorHeightInEm = vendorRect.height / fontSize;
            
            // Calculate how much extra space the vendor block needs
            var originalVendorHeight = vendorBlockOriginalBottom - vendorBlockOriginalTop;
            var extraHeight = Math.max(0, vendorHeightInEm - originalVendorHeight);
            
            // Add some padding
            extraHeight += 0.8;
            
            // Get all elements in the same page
            var page = vendorBlock.closest('.pdf24_03');
            if (!page) return;
            
            var elements = Array.from(page.querySelectorAll('.pdf24_01:not(.vendor-dynamic-block)'));
            
            // Adjust positions of elements that come after the vendor block
            elements.forEach(function(el, index) {
              var originalTop = originalPositions[index];
              if (originalTop === undefined) {
                originalTop = parseFloat(el.style.top) || 0;
                originalPositions[index] = originalTop;
              }
              
              // Only adjust elements that are below the original vendor section
              if (originalTop > vendorBlockOriginalBottom - 0.5) {
                var newTop = originalTop + extraHeight;
                el.style.top = newTop + 'em';
              }
            });
          }
          
          function runAdjustment() {
            storeOriginalPositions();
            adjustAllPositions();
          }
          
          // Run multiple times to ensure proper rendering after fonts load
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
              setTimeout(runAdjustment, 100);
              setTimeout(runAdjustment, 300);
              setTimeout(runAdjustment, 600);
            });
          } else {
            setTimeout(runAdjustment, 100);
            setTimeout(runAdjustment, 300);
            setTimeout(runAdjustment, 600);
          }
          
          // Adjust on resize
          var resizeTimer;
          window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(runAdjustment, 200);
          });
        })();
      </script>
    `;

    // Insert script before closing body tag
    processed = processed.replace('</body>', adjustmentScript + '</body>');

    return processed;
  };

  const handlePrint = useCallback(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.print();
      // Trigger callback after print dialog is initiated
      onPrintOrDownload?.();
    }
  }, [onPrintOrDownload]);

  const handleDownload = useCallback(async () => {
    if (!htmlContent) {
      toast.error("Document not ready. Please wait for the preview to load.");
      return;
    }
    
    setIsDownloading(true);
    
    // Create a temporary hidden container to render the HTML
    const hiddenContainer = document.createElement('div');
    hiddenContainer.id = 'pdf-generation-container';
    hiddenContainer.style.position = 'fixed';
    hiddenContainer.style.left = '-9999px';
    hiddenContainer.style.top = '0';
    hiddenContainer.style.width = '210mm'; // A4 width
    hiddenContainer.style.backgroundColor = '#ffffff';
    
    try {
      // Parse the HTML content to extract body content
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      
      // Get styles from head
      const styles = doc.head.querySelectorAll('style, link[rel="stylesheet"]');
      const styleContent = Array.from(styles).map(style => {
        if (style.tagName === 'STYLE') {
          return style.outerHTML;
        } else if (style.tagName === 'LINK') {
          return style.outerHTML;
        }
        return '';
      }).join('\n');
      
      // Get body content
      const bodyContent = doc.body.innerHTML;
      
      if (!bodyContent) {
        throw new Error('No content found in document');
      }
      
      // Create a complete HTML structure in the hidden container
      hiddenContainer.innerHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            ${styleContent}
          </head>
          <body style="margin: 0; padding: 0; background: white;">
            ${bodyContent}
          </body>
        </html>
      `;
      
      // Since we can't set innerHTML with full HTML structure, we'll use a different approach
      // Create an iframe-like structure or use the body content directly
      const bodyWrapper = document.createElement('div');
      bodyWrapper.style.width = '210mm';
      bodyWrapper.style.minHeight = '297mm';
      bodyWrapper.style.backgroundColor = '#ffffff';
      bodyWrapper.style.position = 'relative';
      
      // Extract and append styles to document head
      const addedStyleElements: HTMLStyleElement[] = [];
      styles.forEach(style => {
        if (style.tagName === 'STYLE' && style.textContent) {
          const styleEl = document.createElement('style');
          styleEl.setAttribute('data-pdf-gen', 'true');
          styleEl.textContent = style.textContent;
          document.head.appendChild(styleEl);
          addedStyleElements.push(styleEl);
        }
      });
      
      // Set body content
      bodyWrapper.innerHTML = bodyContent;
      hiddenContainer.appendChild(bodyWrapper);
      document.body.appendChild(hiddenContainer);
      
      // Wait for content to render
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          setTimeout(resolve, 500);
        });
      });
      
      // Wait for fonts to load
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
        await new Promise<void>((resolve) => setTimeout(resolve, 300));
      } else {
        await new Promise<void>((resolve) => setTimeout(resolve, 1000));
      }
      
      // Wait for images to load
      const images = bodyWrapper.querySelectorAll('img');
      if (images.length > 0) {
        await Promise.all(
          Array.from(images).map((img) => {
            if (img.complete) return Promise.resolve();
            return new Promise<void>((resolve) => {
              const timeout = setTimeout(resolve, 2000);
              img.onload = () => {
                clearTimeout(timeout);
                resolve();
              };
              img.onerror = () => {
                clearTimeout(timeout);
                resolve();
              };
            });
          })
        );
        await new Promise<void>((resolve) => setTimeout(resolve, 300));
      }
      
      // Wait for any scripts to execute
      await new Promise<void>((resolve) => setTimeout(resolve, 1000));
      
      // Dynamically import html2pdf.js
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default;
      
      if (!html2pdf) {
        throw new Error('Failed to load html2pdf.js');
      }
      
      // Use the body wrapper as the element to convert
      const element = bodyWrapper;
      
      // Configure options for PDF generation
      const opt = {
        margin: [0, 0, 0, 0] as [number, number, number, number],
        filename: `Vendor_Agreement_${formData.vendorName.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true,
          logging: false,
          allowTaint: false,
          backgroundColor: '#ffffff',
          windowWidth: element.scrollWidth || 794,
          windowHeight: element.scrollHeight || 1123
        },
        jsPDF: { 
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait' as const,
          compress: true
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };
      
      // Generate and save the PDF
      await html2pdf().set(opt).from(element).save();
      
      // Show success toast
      toast.success("PDF downloaded successfully");
      
      // Trigger callback after download is complete
      onPrintOrDownload?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to generate PDF: ${errorMessage}`);
    } finally {
      // Clean up: remove hidden container and injected styles
      if (hiddenContainer.parentNode) {
        document.body.removeChild(hiddenContainer);
      }
      
      // Remove any styles we added
      const addedStyles = document.head.querySelectorAll('style[data-pdf-gen]');
      addedStyles.forEach(style => {
        if (style.parentNode) {
          style.parentNode.removeChild(style);
        }
      });
      
      setIsDownloading(false);
    }
  }, [htmlContent, formData.vendorName, onPrintOrDownload]);

  if (!htmlContent) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-200 rounded-full animate-pulse"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="mt-6 text-gray-600 font-medium">Loading agreement...</p>
        <p className="mt-2 text-sm text-gray-400">Preparing your document</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Action Buttons */}
      <div className="mb-4 flex gap-3 justify-end">
        <Button
          onClick={handlePrint}
          variant="outline"
          className="flex items-center gap-2 px-5 py-2 rounded-xl border-2 border-gray-300 hover:border-primary-500 hover:bg-primary-50 transition-all duration-200"
        >
          <Printer className="w-4 h-4" />
          Print Agreement
        </Button>
        <Button
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary-800 hover:bg-primary-900 text-white shadow-lg hover:shadow-xl transition-all duration-200"
        >
          {isDownloading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Download PDF
            </>
          )}
        </Button>
      </div>

      {/* Agreement Preview */}
      <div className="relative border-2 border-gray-200 rounded-2xl overflow-hidden shadow-xl bg-white">
        {/* Preview Badge */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full text-sm font-medium">
          <FileCheck className="w-4 h-4" />
          Preview Mode
        </div>
        
        <iframe
          ref={iframeRef}
          srcDoc={htmlContent}
          className="w-full"
          style={{ minHeight: '600px', height: '70vh' }}
          title="Vendor Agreement Preview"
          onLoad={() => {
            // Only notify once per content load
            if (htmlContent && !previewReadyNotifiedRef.current) {
              previewReadyNotifiedRef.current = true;
              onPreviewReady?.();
            }
          }}
        />
      </div>
    </div>
  );
};

export default VendorAgreementViewer;
