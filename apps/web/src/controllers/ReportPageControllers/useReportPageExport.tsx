'use client';

import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { useRef, useState } from 'react';
import { printHTMLPage } from '@/lib/print';
import { timeout } from '@/lib/timeout';
import dynamic from 'next/dynamic';

const DynamicReportPageController = dynamic(
  () => import('./ReportPageController').then((mod) => mod.ReportPageController),
  { ssr: false }
);

const ExportContainerComponent: React.FC<{
  reportId: string;
  reportName: string;
  buildHtmlMethod: (node: HTMLElement, title: string) => Promise<void>;
}> = ({ reportId, reportName, buildHtmlMethod }) => {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      className="export-container-report-page bg-background"
      ref={ref}
      style={{
        width: '820px',
        minWidth: '820px',
        maxWidth: '820px',
        height: '100%',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1
      }}>
      <DynamicReportPageController
        reportId={reportId}
        readOnly={true}
        mode="export"
        onReady={() => {
          setTimeout(async () => {
            const immiateChild = ref.current?.children[0] as HTMLElement;
            if (immiateChild) {
              await buildHtmlMethod(immiateChild, reportName || '');
            }
          }, 150);
        }}
      />
    </div>
  );
};

export const useReportPageExport = ({
  reportId,
  reportName
}: {
  reportId: string;
  reportName: string;
}) => {
  const [isExportingReport, setIsExportingReport] = useState(false);

  const exportReportAsPDF = useMemoizedFn(async () => {
    setIsExportingReport(true);
    return;
  });

  const cancelExport = useMemoizedFn(() => {
    setIsExportingReport(false);
  });

  const buildHtmlMethod = useMemoizedFn(async (node: HTMLElement, title: string) => {
    try {
      await timeout(150); //wait for chart nodes to be rendered
      const result = await buildExportHtml({ root: node, title });
      printHTMLPage({ html: result, filename: title, closeOnPrint: false });
    } finally {
      //  setIsExportingReport(false);
    }
  });

  const ExportContainer = isExportingReport ? (
    <ExportContainerComponent
      reportId={reportId}
      reportName={reportName}
      buildHtmlMethod={buildHtmlMethod}
    />
  ) : null;

  return {
    exportReportAsPDF,
    cancelExport,
    ExportContainer
  };
};

const buildExportHtml = async (options?: {
  title?: string;
  root: HTMLElement;
}): Promise<string> => {
  // Resolve the document title with a sensible default
  const documentTitle = options?.title || 'Buster Report';
  // Prefer using the live editor DOM to inline computed styles

  let contentHtml = '';
  const root = options?.root;

  if (root) {
    // Clone live DOM subtree and inline computed styles
    const clonedRoot = root.cloneNode(true) as HTMLElement;

    // Snapshot metric canvases from the LIVE DOM and replace in the clone
    const liveMetricCanvases = Array.from(
      root.querySelectorAll('[data-export-metric] canvas')
    ) as HTMLCanvasElement[];
    const cloneMetricCanvases = Array.from(
      clonedRoot.querySelectorAll('[data-export-metric] canvas')
    ) as HTMLCanvasElement[];

    for (let i = 0; i < Math.min(liveMetricCanvases.length, cloneMetricCanvases.length); i++) {
      const liveCanvas = liveMetricCanvases[i];
      const cloneCanvas = cloneMetricCanvases[i];
      try {
        // Use the raw canvas data to preserve exact rendering
        const dataUrl = liveCanvas.toDataURL('image/png');
        if (dataUrl) {
          const img = document.createElement('img');
          img.src = dataUrl;
          img.alt = 'Metric';
          const computed = window.getComputedStyle(liveCanvas);
          const width = computed.getPropertyValue('width');
          const height = computed.getPropertyValue('height');
          if (width) (img.style as CSSStyleDeclaration).width = width;
          if (height) (img.style as CSSStyleDeclaration).height = height;
          (img.style as CSSStyleDeclaration).display = 'block';
          cloneCanvas.replaceWith(img);
        }
      } catch (e) {
        // If canvas is tainted or fails, leave the canvas as-is
        console.error('Failed to snapshot metric canvas for HTML export', e);
      }
    }

    // Inline computed styles by pairing original and clone nodes in order
    const originals = [root, ...Array.from(root.querySelectorAll('*'))];
    const clones = [clonedRoot, ...Array.from(clonedRoot.querySelectorAll('*'))];
    for (let i = 0; i < originals.length; i++) {
      const orig = originals[i] as HTMLElement;
      const clone = clones[i] as HTMLElement | undefined;
      if (!clone) continue;
      const computed = window.getComputedStyle(orig);
      const parts: string[] = [];
      for (let j = 0; j < computed.length; j++) {
        const propName = computed.item(j);
        if (!propName) continue;
        const value = computed.getPropertyValue(propName);
        if (!value) continue;
        parts.push(`${propName}: ${value};`);
      }
      const existing = clone.getAttribute('style') || '';
      clone.setAttribute('style', `${existing}; ${parts.join(' ')}`.trim());
      // Remove interactive attributes
      clone.removeAttribute('contenteditable');
      clone.removeAttribute('draggable');
      clone.removeAttribute('spellcheck');
    }

    // Apply page-friendly styles to elements for proper pagination
    const reportSections = clonedRoot.querySelectorAll(
      '.report-section, .report-block, article, section, [data-export-metric]'
    );
    reportSections.forEach((section) => {
      const el = section as HTMLElement;
      // Add page-break-inside avoid to keep sections together
      const currentStyle = el.getAttribute('style') || '';
      el.setAttribute('style', `${currentStyle}; page-break-inside: avoid;`);
    });

    // Ensure the cloned root has proper styles for pagination
    const existingStyle = clonedRoot.getAttribute('style') || '';
    clonedRoot.setAttribute(
      'style',
      `${existingStyle}; width: 100%; padding: 0; height: auto !important; overflow: visible;`.trim()
    );

    // Remove fixed height from report-page-controller and its children
    const reportController = clonedRoot.querySelector('#report-page-controller');
    if (reportController) {
      const rcEl = reportController as HTMLElement;
      const rcStyle = rcEl.getAttribute('style') || '';
      rcEl.setAttribute(
        'style',
        rcStyle.replace(/height:\s*[^;]+;?/gi, 'height: auto !important;')
      );

      // Also fix direct children
      const directChild = rcEl.children[0] as HTMLElement;
      if (directChild) {
        const childStyle = directChild.getAttribute('style') || '';
        directChild.setAttribute(
          'style',
          childStyle.replace(/height:\s*[^;]+;?/gi, 'height: auto !important;')
        );
      }
    }

    // Wrap content with proper print layout container
    const wrapper = document.createElement('div');
    wrapper.setAttribute(
      'style',
      ['width: 100%', 'background: #ffffff', 'padding: 0', 'box-sizing: border-box'].join('; ')
    );
    wrapper.appendChild(clonedRoot);
    contentHtml = wrapper.outerHTML;
  } else {
    throw new Error('No live root found');
  }

  // Build HTML document with proper print pagination CSS
  const html = `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta name="color-scheme" content="light dark" />
          <title>${documentTitle}</title>
          <style>
            body { 
              margin: 0; 
              background: #ffffff;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            /* Override height constraints for pagination */
            #report-page-controller,
            #report-page-controller > div {
              height: auto !important;
              overflow: visible !important;
            }
            
            /* Print-specific styles for proper pagination */
            @media print {
              @page {
                size: letter;
                margin: 0.75in;
              }
              
              body { 
                background: #fff; 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact;
                margin: 0;
                padding: 0;
              }
              
              /* Page break controls */
              h1, h2, h3, h4, h5, h6 {
                page-break-after: avoid;
                page-break-inside: avoid;
              }
              
              p, li, blockquote {
                page-break-inside: avoid;
                orphans: 3;
                widows: 3;
              }
              
              img, svg, canvas {
                page-break-inside: avoid;
                max-width: 100% !important;
              }
              
              table {
                page-break-inside: avoid;
              }
              
              /* Keep sections together when possible */
              section, article, .report-section, .report-block {
                page-break-inside: avoid;
              }
              
              /* Add page breaks between major sections if needed */
              .page-break {
                page-break-before: always;
              }
              
              /* Ensure content flows naturally across pages */
              * {
                float: none !important;
                position: static !important;
              }
            }
            
            /* Screen styles for preview */
            @media screen {
              body {
                background: #f5f5f5;
                padding: 20px;
              }
              
              #report-page-controller {
                background: white;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                margin: 0 auto;
                max-width: 8.5in;
                min-height: 11in;
                padding: 0.75in;
              }
            }
          </style>
        </head>
        <body>
          ${contentHtml}
        </body>
      </html>`;

  return html;
};
