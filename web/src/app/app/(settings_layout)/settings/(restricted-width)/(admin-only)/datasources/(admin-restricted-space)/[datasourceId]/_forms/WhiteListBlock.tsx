import { Text } from '@/components/ui/typography';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks';
import React from 'react';

export const IP_ADDRESSES = ['44.219.39.124', '34.230.173.35', '100.26.25.127'];

export const WhiteListBlock: React.FC = React.memo(() => {
  const { openInfoMessage } = useBusterNotifications();

  const onClickIpAddress = useMemoizedFn((ip: string) => {
    navigator.clipboard.writeText(ip);
    openInfoMessage('Copied to clipboard');
  });
  return (
    <div className="bg-background flex flex-col space-y-2 rounded border border-gray-200 p-4">
      <Text variant="secondary">
        {'If you would like to whitelist our IP addresses, they are: '}
      </Text>

      <div className="flex gap-x-2">
        {IP_ADDRESSES.map((ip) => {
          return (
            <div
              className="hover:bg-item-hover flex cursor-pointer items-center rounded-xl border px-2 py-1 shadow"
              onClick={() => onClickIpAddress(ip)}
              key={ip}>
              {ip}
            </div>
          );
        })}
      </div>
    </div>
  );
});

WhiteListBlock.displayName = 'WhiteListBlock';
