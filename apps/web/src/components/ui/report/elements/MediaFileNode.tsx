'use client';

import * as React from 'react';

import type { TFileElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { useMediaState } from '@platejs/media/react';
import { ResizableProvider } from '@platejs/resizable';
import { PlateElement, useReadOnly, withHOC } from 'platejs/react';
import { NodeTypeIcons } from '../config/icons';

import { Caption, CaptionTextarea } from './CaptionNode';

export const FileElement = withHOC(
  ResizableProvider,
  function FileElement(props: PlateElementProps<TFileElement>) {
    const readOnly = useReadOnly();
    const { name, unsafeUrl } = useMediaState();

    return (
      <PlateElement className="my-px rounded-sm" {...props}>
        <a
          className="group hover:bg-muted relative m-0 flex cursor-pointer items-center rounded px-0.5 py-[3px]"
          contentEditable={false}
          download={name}
          href={unsafeUrl}
          rel="noopener noreferrer"
          role="button"
          target="_blank">
          <div className="flex items-center gap-1 p-1">
            <div className="size-5">
              <NodeTypeIcons.upload />
            </div>
            <div>{name}</div>
          </div>

          <Caption align="left">
            <CaptionTextarea
              className="text-left"
              readOnly={readOnly}
              placeholder="Write a caption..."
            />
          </Caption>
        </a>
        {props.children}
      </PlateElement>
    );
  }
);
