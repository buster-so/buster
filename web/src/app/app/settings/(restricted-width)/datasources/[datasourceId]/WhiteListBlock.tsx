import React, { useContext } from 'react';
import { useAntToken } from '@/styles/useAntToken';
import { Divider } from 'antd';
import { Text } from '@/components';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from 'ahooks';

export const IP_ADDRESSES = ['44.219.39.124', '34.230.173.35', '100.26.25.127'];

export const WhiteListBlock: React.FC = () => {
  const token = useAntToken();
  const numberOfIpAddresses = IP_ADDRESSES.length;
  const { openInfoMessage } = useBusterNotifications();

  const onClickIpAddress = useMemoizedFn((ip: string) => {
    navigator.clipboard.writeText(ip);
    openInfoMessage('Copied to clipboard');
  });
  return (
    <div
      className="flex flex-col space-y-2"
      style={{
        background: token.colorBgBase,
        border: `0.5px solid ${token.colorBorder}`,
        borderRadius: `${token.borderRadius}px`,
        padding: `${token.paddingContentVertical}px ${token.paddingContentHorizontal}px`
      }}>
      <Text type="secondary">{`If you would like to whitelist our IP addresses, they are: `}</Text>

      <div
        className="flex w-fit rounded p-1.5"
        style={{
          border: `0.5px solid ${token.colorBorder}`,
          borderRadius: `${token.borderRadius}px`
        }}>
        {IP_ADDRESSES.map((ip, index) => {
          return (
            <div
              className="flex cursor-pointer items-center"
              onClick={() => onClickIpAddress(ip)}
              key={index}>
              <div>{ip}</div>
              {index !== numberOfIpAddresses - 1 && <Divider className="h-full" type="vertical" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};
