import { SlateElement, type SlateElementProps } from 'platejs';
import * as React from 'react';

export function BlockquoteElementStatic(props: SlateElementProps) {
  return <SlateElement as="blockquote" className="my-1 border-l-2 pl-6" {...props} />;
}
