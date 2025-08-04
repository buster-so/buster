'use client';

import {
  PreviewImage,
  useImagePreview,
  useImagePreviewValue,
  useScaleInput
} from '@platejs/media/react';
import { cva } from 'class-variance-authority';
import { useEditorRef } from 'platejs/react';
import { NodeTypeIcons } from '../config/icons';

import { cn } from '@/lib/utils';
import type { RefObject } from 'react';

const buttonVariants = cva('rounded bg-[rgba(0,0,0,0.5)] px-1', {
  defaultVariants: {
    variant: 'default'
  },
  variants: {
    variant: {
      default: 'text-white',
      disabled: 'cursor-not-allowed text-gray-400'
    }
  }
});

const SCROLL_SPEED = 4;

export function MediaPreviewDialog() {
  const editor = useEditorRef();
  const isOpen = useImagePreviewValue('isOpen', editor.id);
  const scale = useImagePreviewValue('scale');
  const isEditingScale = useImagePreviewValue('isEditingScale');
  const {
    closeProps,
    currentUrlIndex,
    maskLayerProps,
    nextDisabled,
    nextProps,
    prevDisabled,
    prevProps,
    scaleTextProps,
    zommOutProps,
    zoomInDisabled,
    zoomInProps,
    zoomOutDisabled
  } = useImagePreview({ scrollSpeed: SCROLL_SPEED });

  return (
    <div
      className={cn('fixed top-0 left-0 z-50 h-screen w-screen select-none', !isOpen && 'hidden')}
      onContextMenu={(e) => e.stopPropagation()}
      {...maskLayerProps}>
      <div className="absolute inset-0 size-full bg-black opacity-30"></div>
      <div className="absolute inset-0 size-full bg-black opacity-30"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative flex max-h-screen w-full items-center">
          <PreviewImage
            className={cn(
              'mx-auto block max-h-[calc(100vh-4rem)] w-auto object-contain transition-transform'
            )}
          />
          <div
            className="absolute bottom-0 left-1/2 z-40 flex w-fit -translate-x-1/2 justify-center gap-4 p-2 text-center text-white"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex gap-1">
              <button
                {...prevProps}
                className={cn(
                  buttonVariants({
                    variant: prevDisabled ? 'disabled' : 'default'
                  })
                )}
                type="button">
                <NodeTypeIcons.arrowLeft />
              </button>
              {(currentUrlIndex ?? 0) + 1}
              <button
                {...nextProps}
                className={cn(
                  buttonVariants({
                    variant: nextDisabled ? 'disabled' : 'default'
                  })
                )}
                type="button">
                <NodeTypeIcons.arrowRight />
              </button>
            </div>
            <div className="flex">
              <button
                className={cn(
                  buttonVariants({
                    variant: zoomOutDisabled ? 'disabled' : 'default'
                  })
                )}
                {...zommOutProps}
                type="button">
                <div className="size-4">
                  <NodeTypeIcons.remove />
                </div>
              </button>
              <div className="mx-px">
                {isEditingScale ? (
                  <>
                    <ScaleInput className="w-10 rounded px-1 text-slate-500 outline" />{' '}
                    <span>%</span>
                  </>
                ) : (
                  <span {...scaleTextProps}>{scale * 100 + '%'}</span>
                )}
              </div>
              <button
                className={cn(
                  buttonVariants({
                    variant: zoomInDisabled ? 'disabled' : 'default'
                  })
                )}
                {...zoomInProps}
                type="button">
                <div className="size-4">
                  <NodeTypeIcons.add />
                </div>
              </button>
            </div>
            {/* TODO: downLoad the image */}
            <button className={cn(buttonVariants())} type="button">
              <div className="size-4">
                <NodeTypeIcons.download />
              </div>
            </button>
            <button {...closeProps} className={cn(buttonVariants())} type="button">
              <div className="size-4">
                <NodeTypeIcons.close />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScaleInput(props: React.ComponentProps<'input'>) {
  const { props: scaleInputProps, ref } = useScaleInput();

  return <input {...scaleInputProps} {...props} ref={ref as RefObject<HTMLInputElement>} />;
}
