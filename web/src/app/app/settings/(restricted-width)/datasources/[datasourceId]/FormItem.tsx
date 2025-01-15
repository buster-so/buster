import { useAntToken } from '@/styles/useAntToken';
import React, { PropsWithChildren } from 'react';
import { Text } from '@/components';

export const FormItem: React.FC<PropsWithChildren<{ label: string }>> = ({ label, children }) => {
  const token = useAntToken();

  return (
    <div
      className="p-4"
      style={{
        borderTop: `0.5px solid ${token.colorBorder}`,
        display: 'grid',
        gridTemplateColumns: '195px 1fr',
        alignItems: 'center'
      }}>
      <Text
        style={{
          color: token.colorTextDescription
        }}
        type="secondary">
        {label}
      </Text>

      <div>{children}</div>
    </div>
  );
};
