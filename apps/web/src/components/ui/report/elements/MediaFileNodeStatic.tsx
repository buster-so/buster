import * as React from 'react';

import type { SlateElementProps, TFileElement } from 'platejs';

import { SlateElement } from 'platejs';
import { NodeTypeIcons } from '../config/icons';

export function FileElementStatic(props: SlateElementProps<TFileElement>) {
  const { name, url } = props.element;

  return (
    <SlateElement className="my-px rounded-sm" {...props}>
      <a
        className="group hover:bg-muted relative m-0 flex cursor-pointer items-center rounded px-0.5 py-[3px]"
        contentEditable={false}
        download={name}
        href={url}
        rel="noopener noreferrer"
        role="button"
        target="_blank">
        <div className="flex items-center gap-1 p-1">
          <div className="size-5">
            <NodeTypeIcons.upload />
          </div>
          <div>{name}</div>
        </div>
      </a>
      {props.children}
    </SlateElement>
  );
}
