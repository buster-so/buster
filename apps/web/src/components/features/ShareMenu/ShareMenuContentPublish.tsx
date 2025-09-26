import React, { useEffect, useMemo, useState } from 'react';
import { useUpdateChatShare } from '@/api/buster_rest/chats';
import { useUpdateCollectionShare } from '@/api/buster_rest/collections';
import { useUpdateDashboardShare } from '@/api/buster_rest/dashboards';
import { useUpdateMetricShare } from '@/api/buster_rest/metrics';
import { useUpdateReportShare } from '@/api/buster_rest/reports';
import { Button } from '@/components/ui/buttons';
import { DatePicker } from '@/components/ui/date';
import { Eye, EyeSlash, Link } from '@/components/ui/icons';
import { Input } from '@/components/ui/inputs';
import { PulseLoader } from '@/components/ui/loaders';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/typography';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useBuildLocation } from '@/context/Routes/useRouteBuilder';
import { cn } from '@/lib/classMerge';
import { createDayjsDate } from '@/lib/date';
import { timeout } from '@/lib/timeout';
import type { ShareMenuContentBodyProps } from './ShareMenuContentBody';

export const ShareMenuContentPublish: React.FC<ShareMenuContentBodyProps> = React.memo(
  ({
    assetType,
    assetId,
    password = '',
    publicly_accessible,
    onCopyLink,
    publicExpirationDate,
    className,
    embedLinkURL,
  }) => {
    const { openInfoMessage } = useBusterNotifications();
    const { mutateAsync: onShareMetric, isPending: isPublishingMetric } = useUpdateMetricShare();
    const { mutateAsync: onShareDashboard, isPending: isPublishingDashboard } =
      useUpdateDashboardShare();
    const { mutateAsync: onShareCollection, isPending: isPublishingCollection } =
      useUpdateCollectionShare();
    const { mutateAsync: onShareReport, isPending: isPublishingReport } = useUpdateReportShare();
    const { mutateAsync: onShareChat, isPending: isPublishingChat } = useUpdateChatShare();
    const [isPasswordProtected, setIsPasswordProtected] = useState<boolean>(!!password);
    const [_password, _setPassword] = React.useState<string>(password || '');

    const isPublishing =
      isPublishingMetric ||
      isPublishingDashboard ||
      isPublishingCollection ||
      isPublishingChat ||
      isPublishingReport;

    const linkExpiry = useMemo(() => {
      return publicExpirationDate ? new Date(publicExpirationDate) : null;
    }, [publicExpirationDate]);

    const onTogglePublish = async (v?: boolean) => {
      const linkExp = linkExpiry ? linkExpiry.toISOString() : null;
      const payload: Parameters<typeof onShareMetric>[0] = {
        id: assetId,
        params: {
          publicly_accessible: v === undefined ? true : !!v,
          public_password: _password || undefined,
          public_expiry_date: linkExp || undefined,
        },
      };
      if (assetType === 'metric_file') {
        await onShareMetric(payload);
      } else if (assetType === 'dashboard_file') {
        await onShareDashboard(payload);
      } else if (assetType === 'collection') {
        await onShareCollection(payload);
      } else if (assetType === 'report_file') {
        await onShareReport(payload);
      } else if (assetType === 'chat') {
        await onShareChat(payload);
      } else {
        const _exhaustiveCheck: never = assetType;
      }
      await timeout(100);
      if (v) onCopyLink(true);
    };

    const onSetPasswordProtected = async (v: boolean) => {
      onSetPassword(null);
      setIsPasswordProtected(v);
    };

    const onSetPassword = async (password: string | null) => {
      const payload: Parameters<typeof onShareMetric>[0] = {
        id: assetId,
        params: {
          public_password: password,
        },
      };

      if (assetType === 'metric_file') {
        await onShareMetric(payload);
      } else if (assetType === 'dashboard_file') {
        await onShareDashboard(payload);
      } else if (assetType === 'collection') {
        await onShareCollection(payload);
      } else if (assetType === 'report_file') {
        await onShareReport(payload);
      } else if (assetType === 'chat') {
        await onShareChat(payload);
      } else {
        const _exhaustiveCheck: never = assetType;
      }
      _setPassword(password || '');
      if (password) openInfoMessage('Password updated');
    };

    const onSetExpirationDate = async (date: Date | null) => {
      const linkExp = date ? date.toISOString() : null;

      const payload: Parameters<typeof onShareMetric>[0] = {
        id: assetId,
        params: {
          public_expiry_date: linkExp,
        },
      };

      if (assetType === 'metric_file') {
        await onShareMetric(payload);
      } else if (assetType === 'dashboard_file') {
        await onShareDashboard(payload);
      } else if (assetType === 'collection') {
        await onShareCollection(payload);
      } else if (assetType === 'report_file') {
        await onShareReport(payload);
      } else if (assetType === 'chat') {
        await onShareChat(payload);
      } else {
        const _exhaustiveCheck: never = assetType;
      }
    };

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
                <Input size="small" readOnly value={embedLinkURL} />
                <Button
                  variant="default"
                  className="flex"
                  prefix={<Link />}
                  onClick={() => onCopyLink(true)}
                />
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
                }}
              >
                Create public link
              </Button>
            </div>
          )}
        </div>

        {publicly_accessible && (
          <div className={cn('flex justify-end space-x-2 border-t', className)}>
            <Button
              block
              onClick={async () => {
                onTogglePublish(false);
              }}
            >
              Unpublish
            </Button>
            <Button block onClick={() => onCopyLink(true)}>
              Copy link
            </Button>
          </div>
        )}
      </div>
    );
  }
);
ShareMenuContentPublish.displayName = 'ShareMenuContentPublish';

const IsPublishedInfo: React.FC<{ isPublished: boolean }> = ({ isPublished }) => {
  if (!isPublished) return null;

  return (
    <div className="flex items-center space-x-2">
      <PulseLoader />
      <Text variant="link">Live on the web</Text>
    </div>
  );
};

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

  const onSelect = (date: Date | undefined) => {
    onChangeLinkExpiry(date || null);
  };

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
}> = ({ password: passwordProp, onSetPassword, isPasswordProtected, onSetPasswordProtected }) => {
  const [visibilityToggle, setVisibilityToggle] = useState<boolean>(false);
  const [password, setPassword] = useState<string>(passwordProp);

  const isPasswordDifferent = password !== passwordProp;

  const onChangeChecked = (checked: boolean) => {
    onSetPasswordProtected(checked);
  };

  const onChangePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const onClickVisibilityToggle = () => {
    setVisibilityToggle(!visibilityToggle);
  };

  const onClickSave = () => {
    onSetPassword(password);
  };

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
};

SetAPassword.displayName = 'SetAPassword';
