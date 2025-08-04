import * as React from 'react';

import type { SlateElementProps, TEquationElement } from 'platejs';

import { getEquationHtml } from '@platejs/math';
import { SlateElement } from 'platejs';
import { NodeTypeIcons } from '../config/icons';

import { cn } from '@/lib/utils';

export function EquationElementStatic(props: SlateElementProps<TEquationElement>) {
  const { element } = props;

  const html = getEquationHtml({
    element,
    options: {
      displayMode: true,
      errorColor: '#cc0000',
      fleqn: false,
      leqno: false,
      macros: { '\\f': '#1f(#2)' },
      output: 'htmlAndMathml',
      strict: 'warn',
      throwOnError: false,
      trust: false
    }
  });

  return (
    <SlateElement className="my-1" {...props}>
      <div
        className={cn(
          'group hover:bg-primary/10 data-[selected=true]:bg-primary/10 flex items-center justify-center rounded-sm select-none',
          element.texExpression.length === 0 ? 'bg-muted p-3 pr-9' : 'px-2 py-1'
        )}>
        {element.texExpression.length > 0 ? (
          <span
            dangerouslySetInnerHTML={{
              __html: html
            }}
          />
        ) : (
          <div className="text-muted-foreground flex h-7 w-full items-center gap-2 text-sm whitespace-nowrap">
            <div className="text-muted-foreground/80 size-6">
              <NodeTypeIcons.equation />
            </div>
            <div>Add a Tex equation</div>
          </div>
        )}
      </div>
      {props.children}
    </SlateElement>
  );
}

export function InlineEquationElementStatic(props: SlateElementProps<TEquationElement>) {
  const html = getEquationHtml({
    element: props.element,
    options: {
      displayMode: true,
      errorColor: '#cc0000',
      fleqn: false,
      leqno: false,
      macros: { '\\f': '#1f(#2)' },
      output: 'htmlAndMathml',
      strict: 'warn',
      throwOnError: false,
      trust: false
    }
  });

  return (
    <SlateElement
      {...props}
      className="inline-block rounded-sm select-none [&_.katex-display]:my-0">
      <div
        className={cn(
          'after:absolute after:inset-0 after:-top-0.5 after:-left-1 after:z-1 after:h-[calc(100%)+4px] after:w-[calc(100%+8px)] after:rounded-sm after:content-[""]',
          'h-6',
          props.element.texExpression.length === 0 &&
            'text-muted-foreground after:bg-neutral-500/10'
        )}>
        <span
          className={cn(
            props.element.texExpression.length === 0 && 'hidden',
            'font-mono leading-none'
          )}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
      {props.children}
    </SlateElement>
  );
}
