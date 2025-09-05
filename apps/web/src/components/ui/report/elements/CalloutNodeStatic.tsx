import * as React from 'react';

import type { SlateElementProps, TCalloutElement } from 'platejs';

import { SlateElement } from 'platejs';
import { Button } from '@/components/ui/buttons';
import { NodeTypeIcons } from '../config/icons';

import { cn } from '@/lib/utils';

export function CalloutElementStatic({
  children,
  className,
  ...props
}: SlateElementProps<TCalloutElement>) {
  const [hasCopied, setHasCopied] = React.useState(false);

  React.useEffect(() => {
    if (hasCopied) {
      const timeout = setTimeout(() => {
        setHasCopied(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [hasCopied]);

  const handleCopy = () => {
    // Extract text content from the children
    const getTextContent = (node: unknown): string => {
      if (typeof node === 'string') return node;
      if (Array.isArray(node)) return node.map(getTextContent).join('');
      if (node && typeof node === 'object' && 'props' in node) {
        const reactNode = node as { props?: { children?: unknown } };
        if (reactNode.props?.children) {
          return getTextContent(reactNode.props.children);
        }
      }
      return '';
    };

    const textContent = getTextContent(children);
    void navigator.clipboard.writeText(textContent);
    setHasCopied(true);
  };

  return (
    <SlateElement
      className={cn('bg-muted my-2.5 flex rounded-sm p-2 pl-3 relative group text-[15px] leading-[150%] font-normal', className)}
      style={{
        backgroundColor: props.element.backgroundColor as string
      }}
      {...props}>
      <div className="flex w-full gap-2 rounded-md">
        <div
          className="size-6 text-[18px] select-none"
          style={{
            fontFamily:
              '"Apple Color Emoji", "Segoe UI Emoji", NotoColorEmoji, "Noto Color Emoji", "Segoe UI Symbol", "Android Emoji", EmojiSymbols'
          }}>
          <span data-plate-prevent-deserialization>{props.element.icon || '💡'}</span>
        </div>
        <div className="w-full">{children}</div>
      </div>
      
      {/* Copy button - hidden by default, shown on hover */}
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <Button
          variant="ghost"
          size="small"
          onClick={handleCopy}
          prefix={hasCopied ? <NodeTypeIcons.check /> : <NodeTypeIcons.copy />}
          className="h-6 w-6 p-0"
        />
      </div>
    </SlateElement>
  );
}
