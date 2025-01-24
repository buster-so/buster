'use client';

import React from 'react';
import { SettingsPageHeader } from '../../_components/SettingsPageHeader';
import { useUserConfigContextSelector } from '@/context/Users';
import { createStyles } from 'antd-style';
import { formatDate } from '@/utils/date';
import { Text, Title } from '@/components/text';
import { BusterUserAvatar } from '@/components';
import { Card } from 'antd';

const useStyles = createStyles(({ token, css }) => ({
  infoRow: css`
    display: flex;
    align-items: center;
    &:not(:last-child) {
      margin-bottom: 6px;
    }
  `,
  label: css`
    width: 120px;
  `,
  value: css`
    flex: 1;
  `
}));

export default function ProfilePage() {
  const user = useUserConfigContextSelector((state) => state.user);
  const { styles } = useStyles();

  if (!user) return <></>;

  const { name, email, created_at } = user;

  return (
    <div>
      <SettingsPageHeader title="Profile" description="Manage your profile & information" />
      <Card
        classNames={{
          body: 'flex flex-col space-y-3'
        }}>
        <div className={'flex items-center space-x-2.5'}>
          <BusterUserAvatar name={name} size={48} />
          <Title level={4}>{name}</Title>
        </div>
        <div className={'flex flex-col space-y-0.5'}>
          <div className={styles.infoRow}>
            <Text type="secondary" className={styles.label}>
              Email
            </Text>
            <Text className={styles.value}>{email}</Text>
          </div>
          <div className={styles.infoRow}>
            <Text type="secondary" className={styles.label}>
              Member Since
            </Text>
            <Text className={styles.value}>{formatDate({ date: created_at, format: 'll' })}</Text>
          </div>
        </div>
      </Card>
    </div>
  );
}
