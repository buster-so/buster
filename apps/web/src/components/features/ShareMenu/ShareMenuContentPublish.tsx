'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useUpdateCollectionShare } from '@/api/buster_rest/collections';
import { useUpdateDashboardShare } from '@/api/buster_rest/dashboards';
import { useUpdateMetricShare } from '@/api/buster_rest/metrics';
import { Button } from '@/components/ui/buttons';
import { DatePicker } from '@/components/ui/date';
import { Eye, EyeSlash, Link } from '@/components/ui/icons';
import { Input } from '@/components/ui/inputs';
import { PulseLoader } from '@/components/ui/loaders';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/typography';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks';
import { cn } from '@/lib/classMerge';
import { createDayjsDate } from '@/lib/date';
import { BusterRoutes, createBusterRoute } from '@/routes';
import type { ShareMenuContentBodyProps } from './ShareMenuContentBody';

export const ShareMenuContentPublish: React.FC<ShareMenuContentBodyProps> = React.memo(
  ({
    assetType,
    assetId,
    password = '',
    publicly_accessible,
    onCopyLink,
    publicExpirationDate,
    className
  }) => {
    const { openInfoMessage } = useBusterNotifications();
    const { mutateAsync: onShareMetric, isPending: isPublishingMetric } = useUpdateMetricShare();
    const { mutateAsync: onShareDashboard, isPending: isPublishingDashboard } =
      useUpdateDashboardShare();
    const { mutateAsync: onShareCollection, isPending: isPublishingCollection } =
      useUpdateCollectionShare();
    const [isPasswordProtected, setIsPasswordProtected] = useState<boolean>(!!password);
    const [_password, _setPassword] = React.useState<string>(password || '');

    const isPublishing = isPublishingMetric || isPublishingDashboard || isPublishingCollection;

    const linkExpiry = useMemo(() => {
      return publicExpirationDate ? new Date(publicExpirationDate) : null;
    }, [publicExpirationDate]);

    const url = useMemo(() => {
      let url = '';
      if (assetType === 'metric') {
        url = createBusterRoute({ route: BusterRoutes.APP_METRIC_ID_CHART, metricId: assetId });
      } else if (assetType === 'dashboard') {
        url = createBusterRoute({ route: BusterRoutes.APP_DASHBOARD_ID, dashboardId: assetId });
      } else if (assetType === 'collection') {
        url = createBusterRoute({ route: BusterRoutes.APP_COLLECTIONS });
      }
      return window.location.origin + url;
    }, [assetId, assetType]);

    const onTogglePublish = useMemoizedFn(async (v?: boolean) => {
      const linkExp = linkExpiry ? linkExpiry.toISOString() : null;
      const payload: Parameters<typeof onShareMetric>[0] = {
        id: assetId,
        params: {
          publicly_accessible: v === undefined ? true : !!v,
          public_password: _password || undefined,
          public_expiry_date: linkExp || undefined
        }
      };
      if (assetType === 'metric') {
        await onShareMetric(payload);
      } else if (assetType === 'dashboard') {
        await onShareDashboard(payload);
      } else if (assetType === 'collection') {
        await onShareCollection(payload);
      }
    });

    const onSetPasswordProtected = useMemoizedFn(async (v: boolean) => {
      onSetPassword(null);
      setIsPasswordProtected(v);
    });

    const onSetPassword = useMemoizedFn(async (password: string | null) => {
      const payload: Parameters<typeof onShareMetric>[0] = {
        id: assetId,
        params: {
          public_password: password
        }
      };

      if (assetType === 'metric') {
        await onShareMetric(payload);
      } else if (assetType === 'dashboard') {
        await onShareDashboard(payload);
      } else if (assetType === 'collection') {
        await onShareCollection(payload);
      }
      _setPassword(password || '');
      if (password) openInfoMessage('Password updated');
    });

    const onSetExpirationDate = useMemoizedFn(async (date: Date | null) => {
      const linkExp = date ? date.toISOString() : null;

      const payload: Parameters<typeof onShareMetric>[0] = {
        id: assetId,
        params: {
          public_expiry_date: linkExp
        }
      };

      if (assetType === 'metric') {
        await onShareMetric(payload);
      } else if (assetType === 'dashboard') {
        await onShareDashboard(payload);
      } else if (assetType === 'collection') {
        await onShareCollection(payload);
      }
    });

    useEffect(() => {
      _setPassword(password || '');
      setIsPasswordProtected(!!password);
    }, [password]);

    return (
      <div className="flex flex-col space-y-1">
        <div className={cn('flex flex-col space-y-3', className)}>
          {publicly_accessible ? (
            <>
              <IsPublishedInfo isPublished={publicly_accessible} />

              <div className="flex w-full space-x-0.5">
                <Input size="small" readOnly value={url} />
                <Button variant="default" className="flex" prefix={<Link />} onClick={onCopyLink} />
              </div>

              <LinkExpiration linkExpiry={linkExpiry} onChangeLinkExpiry={onSetExpirationDate} />

              <SetAPassword
                password={_password}
                onSetPassword={onSetPassword}
                isPasswordProtected={isPasswordProtected}
                onSetPasswordProtected={onSetPasswordProtected}
              />
            </>
          ) : (
            <div className="flex flex-col space-y-2.5">
              <Text variant="secondary">Anyone with the link will be able to view.</Text>

              <Button
                loading={isPublishing}
                onClick={() => {
                  onTogglePublish(true);
                }}>
                Create public link
              </Button>
            </div>
          )}
        </div>

        {publicly_accessible && (
          <div className={cn('flex justify-end space-x-2 border-t', className)}>
            <Button
              block
              onClick={async (v) => {
                onTogglePublish(false);
              }}>
              Unpublish
            </Button>
            <Button block onClick={onCopyLink}>
              Copy link
            </Button>
          </div>
        )}
      </div>
    );
  }
);
ShareMenuContentPublish.displayName = 'ShareMenuContentPublish';

const IsPublishedInfo: React.FC<{ isPublished: boolean }> = React.memo(({ isPublished }) => {
  if (!isPublished) return null;

  return (
    <div className="flex items-center space-x-2">
      <PulseLoader />
      <Text variant="link">Live on the web</Text>
    </div>
  );
});
IsPublishedInfo.displayName = 'IsPublishedInfo';

const LinkExpiration: React.FC<{
  linkExpiry: Date | null;
  onChangeLinkExpiry: (date: Date | null) => void;
}> = React.memo(({ onChangeLinkExpiry, linkExpiry }) => {
  const dateFormat = 'LL';

  const now = useMemo(() => {
    return createDayjsDate(new Date());
  }, []);

  const maxDate = useMemo(() => {
    return createDayjsDate(new Date()).add(2, 'year');
  }, []);

  const onSelect = useMemoizedFn((date: Date | undefined) => {
    onChangeLinkExpiry(date || null);
  });

  return (
    <div className="flex items-center justify-between space-x-2">
      <Text truncate>Link expiration</Text>

      <DatePicker
        selected={linkExpiry || undefined}
        onSelect={onSelect}
        mode="single"
        dateFormat={dateFormat}
        placeholder="Never"
        disabled={(date) => {
          const dateValue = createDayjsDate(date);
          return dateValue.isBefore(now) || dateValue.isAfter(maxDate);
        }}
      />
    </div>
  );
});
LinkExpiration.displayName = 'LinkExpiration';

const SetAPassword: React.FC<{
  password: string;
  onSetPassword: (password: string | null) => void;
  isPasswordProtected: boolean;
  onSetPasswordProtected: (isPasswordProtected: boolean) => void;
}> = React.memo(
  ({ password: passwordProp, onSetPassword, isPasswordProtected, onSetPasswordProtected }) => {
    const [visibilityToggle, setVisibilityToggle] = useState<boolean>(false);
    const [password, setPassword] = useState<string>(passwordProp);

    const isPasswordDifferent = password !== passwordProp;

    const onChangeChecked = useMemoizedFn((checked: boolean) => {
      onSetPasswordProtected(checked);
    });

    const onChangePassword = useMemoizedFn((e: React.ChangeEvent<HTMLInputElement>) => {
      setPassword(e.target.value);
    });

    const onClickVisibilityToggle = useMemoizedFn(() => {
      setVisibilityToggle(!visibilityToggle);
    });

    const onClickSave = useMemoizedFn(() => {
      onSetPassword(password);
    });

    useEffect(() => {
      if (isPasswordProtected) {
        setPassword(password);
      } else {
        setPassword('');
      }
    }, [isPasswordProtected, password]);

    return (
      <div className="flex w-full flex-col space-y-3">
        <div className="flex w-full justify-between">
          <Text>Set a password</Text>
          <Switch checked={isPasswordProtected} onCheckedChange={onChangeChecked} />
        </div>

        {isPasswordProtected && (
          <div className="flex w-full items-center space-x-2">
            <div className="flex w-full">
              <div className="relative flex w-full space-x-0.5">
                <Input
                  value={password}
                  onChange={onChangePassword}
                  placeholder="Password"
                  type={visibilityToggle ? 'text' : 'password'}
                  autoComplete="off"
                  autoCorrect="off"
                />

                <Button
                  variant="ghost"
                  size="small"
                  className="absolute top-1/2 right-[7px] -translate-y-1/2"
                  prefix={!visibilityToggle ? <Eye /> : <EyeSlash />}
                  onClick={onClickVisibilityToggle}
                />
              </div>
            </div>

            <Button disabled={!isPasswordDifferent} onClick={onClickSave}>
              Save
            </Button>
          </div>
        )}
      </div>
    );
  }
);

SetAPassword.displayName = 'SetAPassword';
