import type { PropsWithChildren } from 'react';
import type { HTMLElementProps, IPaneConfigs } from './types';

export default function Pane({
  children,
  style,
  className,
  role,
  title
}: PropsWithChildren<HTMLElementProps & IPaneConfigs>) {
  return (
    <div role={role} title={title} className={className} style={style}>
      {children}
    </div>
  );
}
