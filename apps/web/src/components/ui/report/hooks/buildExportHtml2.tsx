'use client';

import { PAGE_CONTROLLER_ID, ReportPageController } from '@/controllers/ReportPageControllers/ReportPageController';
import { BusterReactQueryProvider } from '@/context/BusterReactQuery/BusterReactQueryAndApi';
import { SupabaseContextProvider, useSupabaseContext } from '@/context/Supabase/SupabaseContextProvider';
import type { UseSupabaseUserContextType } from '@/lib/supabase';
import { printHTMLPage } from './printHTMLPage';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import React from 'react';
import { createRoot } from 'react-dom/client';

export const useBuildExportHtml2 = ({ reportId: defaultReportId }: { reportId?: string } = {}) => {
  const user = useSupabaseContext((s) => s.user);
  const accessToken = useSupabaseContext((s) => s.accessToken);

  const build = useMemoizedFn(
    async ({
      reportId = defaultReportId,
      filename = 'Buster Report',
      triggerPrint = false
    }: {
      reportId?: string;
      filename?: string;
      triggerPrint?: boolean;
    } = {}) => {
      if (!reportId) throw new Error('reportId is required');

      // 1) Create a hidden, offscreen container
      const container = document.createElement('div');
      container.setAttribute('data-report-export-container', reportId);
      Object.assign(container.style, {
        position: 'fixed',
        left: '-10000px',
        top: '0',
        width: '850px',
        maxWidth: '850px',
        pointerEvents: 'none',
        opacity: '0',
        visibility: 'hidden'
      } as CSSStyleDeclaration);
      document.body.appendChild(container);

      // 2) Mount the controller wrapped with minimal providers so hooks work
      const supabaseContext = { user, accessToken } as UseSupabaseUserContextType;

      const root = createRoot(container);
      root.render(
        <SupabaseContextProvider supabaseContext={supabaseContext}>
          <BusterReactQueryProvider>
            <ReportPageController reportId={reportId} readOnly className="px-0!" />
          </BusterReactQueryProvider>
        </SupabaseContextProvider>
      );

      try {
        // 3) Wait for the editor DOM to be ready in the hidden mount
        const controllerSelector = `#${CSS.escape(PAGE_CONTROLLER_ID(reportId))}`;
        const editorRoot = await waitForElement(
          () => container.querySelector(`${controllerSelector} [contenteditable="true"]`) as HTMLElement | null,
          { timeoutMs: 10000 }
        );

        // Small settle time for charts/canvases/fonts
        await delay(150);

        // 4) Build portable HTML (inline styles, snapshot canvases)
        const contentHtml = await buildPortableHtmlFromRoot(editorRoot);

        const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light dark" />
    <title>${escapeHtml(filename)}</title>
    <style>
      body { margin: 0; background: #f5f5f5; }
      @media print {
        body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    </style>
  </head>
  <body>
    ${contentHtml}
  </body>
</html>`;

        if (triggerPrint) {
          printHTMLPage({ html, filename });
        }

        return html;
      } finally {
        // 5) Cleanup
        try {
          root.unmount();
        } catch {
          // noop
        }
        container.remove();
      }
    }
  );

  return build;
};

async function buildPortableHtmlFromRoot(liveRoot: HTMLElement): Promise<string> {
  // Clone live DOM subtree and inline computed styles
  const clonedRoot = liveRoot.cloneNode(true) as HTMLElement;

  // Snapshot metric canvases from the LIVE DOM and replace in the clone
  const liveMetricCanvases = Array.from(
    liveRoot.querySelectorAll('[data-export-metric] canvas')
  ) as HTMLCanvasElement[];
  const cloneMetricCanvases = Array.from(
    clonedRoot.querySelectorAll('[data-export-metric] canvas')
  ) as HTMLCanvasElement[];

  for (let i = 0; i < Math.min(liveMetricCanvases.length, cloneMetricCanvases.length); i++) {
    const liveCanvas = liveMetricCanvases[i];
    const cloneCanvas = cloneMetricCanvases[i];
    try {
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
      // eslint-disable-next-line no-console
      console.error('Failed to snapshot metric canvas for HTML export', e);
    }
  }

  // Inline computed styles by pairing original and clone nodes in order
  const originals = [liveRoot, ...Array.from(liveRoot.querySelectorAll('*'))];
  const clones = [clonedRoot, ...Array.from(clonedRoot.querySelectorAll('*'))];

  for (let i = 0; i < Math.min(originals.length, clones.length); i++) {
    const original = originals[i] as HTMLElement;
    const clone = clones[i] as HTMLElement;
    const computed = window.getComputedStyle(original);
    const cssText = Array.from(computed)
      .map((prop) => `${prop}: ${computed.getPropertyValue(prop)};`)
      .join(' ');
    clone.setAttribute('style', cssText);
  }

  // Return inner HTML of cloned editor root
  return clonedRoot.outerHTML;
}

async function waitForElement<T extends Element | null>(
  getter: () => T,
  { timeoutMs = 8000, intervalMs = 50 }: { timeoutMs?: number; intervalMs?: number } = {}
): Promise<NonNullable<T>> {
  const start = Date.now();
  // First try immediate
  const immediate = getter();
  if (immediate) return immediate as NonNullable<T>;

  return new Promise<NonNullable<T>>((resolve, reject) => {
    const timer = setInterval(() => {
      const el = getter();
      if (el) {
        clearInterval(timer);
        resolve(el as NonNullable<T>);
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(timer);
        reject(new Error('Timed out waiting for element'));
      }
    }, intervalMs);
  });
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#039;');
}