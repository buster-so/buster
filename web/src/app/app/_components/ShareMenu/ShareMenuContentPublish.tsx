'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button, Divider, DatePicker, Input, Space, Switch } from 'antd';
import { AppMaterialIcons, PulseLoader } from '@/components';
import { useMemoizedFn } from 'ahooks';
import { createStyles } from 'antd-style';
import { createDayjsDate } from '@/utils/date';
import { useDashboardContextSelector } from '@/context/Dashboards';
import { useBusterThreadsContextSelector } from '@/context/Threads';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { useCollectionsContextSelector } from '@/context/Collections';
import { BusterShareAssetType } from '@/api/buster-rest';
import { Text } from '@/components';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { Dayjs } from 'dayjs';

export const ShareMenuContentPublish: React.FC<{
  onCopyLink: () => void;
  publicExpirationDate: string;
  publicly_accessible: boolean;
  password: string | null;
  shareType: BusterShareAssetType;
  threadId?: string;
  dashboardId?: string;
  collectionId?: string;
}> = React.memo(
  ({
    shareType,
    password = '',
    publicly_accessible,
    onCopyLink,
    threadId,
    dashboardId,
    collectionId,
    publicExpirationDate
  }) => {
    const { openInfoMessage } = useBusterNotifications();
    const onShareThread = useBusterThreadsContextSelector((state) => state.onShareThread);
    const onShareDashboard = useDashboardContextSelector((state) => state.onShareDashboard);
    const onShareCollection = useCollectionsContextSelector((state) => state.onShareCollection);
    const [isPublishing, setIsPublishing] = useState<boolean>(false);
    const [isPasswordProtected, setIsPasswordProtected] = useState<boolean>(!!password);
    const [_password, _setPassword] = React.useState<string>(password || '');

    const id = threadId || dashboardId || collectionId || '';

    const linkExpiry = useMemo(() => {
      return publicExpirationDate ? new Date(publicExpirationDate) : null;
    }, [publicExpirationDate]);

    const url = useMemo(() => {
      let url = '';
      if (shareType === BusterShareAssetType.THREAD) {
        url = createBusterRoute({ route: BusterRoutes.APP_THREAD_ID, threadId: id });
      } else if (shareType === 'dashboard') {
        url = createBusterRoute({ route: BusterRoutes.APP_DASHBOARD_ID, dashboardId: id });
      } else if (shareType === 'collection') {
        url = createBusterRoute({ route: BusterRoutes.APP_COLLECTIONS });
      }
      return window.location.origin + url;
    }, [id]);

    const onTogglePublish = useMemoizedFn(async (v?: boolean) => {
      setIsPublishing(true);
      const linkExp = linkExpiry ? linkExpiry.toISOString() : null;
      const payload = {
        id,
        publicly_accessible: v === undefined ? true : !!v,
        public_password: _password || null,
        public_expiry_date: linkExp
      };
      if (shareType === BusterShareAssetType.THREAD) {
        await onShareThread(payload);
      } else if (shareType === 'dashboard') {
        await onShareDashboard(payload);
      } else if (shareType === 'collection') {
        await onShareCollection(payload);
      }

      setIsPublishing(false);
    });

    const onSetPasswordProtected = useMemoizedFn(async (v: boolean) => {
      if (!v) {
        if (shareType === BusterShareAssetType.THREAD) {
          await onShareThread({ id, public_password: null });
        } else if (shareType === 'dashboard') {
          await onShareDashboard({ id, public_password: null });
        } else if (shareType === 'collection') {
          await onShareCollection({ id, public_password: null });
        }
      }

      setIsPasswordProtected(v);
    });

    const onSetPassword = useMemoizedFn(async (password: string | null) => {
      if (shareType === BusterShareAssetType.THREAD) {
        await onShareThread({ id, public_password: password });
      } else if (shareType === 'dashboard') {
        await onShareDashboard({ id, public_password: password });
      } else if (shareType === 'collection') {
        await onShareCollection({ id, public_password: password });
      }
      _setPassword(password || '');
      if (password) openInfoMessage('Password updated');
    });

    const onSetExpirationDate = useMemoizedFn(async (date: Date | null) => {
      const linkExp = date ? date.toISOString() : null;
      if (shareType === BusterShareAssetType.THREAD) {
        await onShareThread({ id, public_expiry_date: linkExp });
      } else if (shareType === 'dashboard') {
        await onShareDashboard({ id, public_expiry_date: linkExp });
      } else if (shareType === 'collection') {
        await onShareCollection({ id, public_expiry_date: linkExp });
      }
    });

    useEffect(() => {
      _setPassword(password || '');
      setIsPasswordProtected(!!password);
    }, [password]);

    return (
      <div className="pt-3">
        <div className="space-y-3 px-3 pb-3">
          {publicly_accessible ? (
            <>
              <IsPublishedInfo isPublished={publicly_accessible} />

              <Space.Compact className="!w-full">
                <Input className="!h-[24px]" value={url} />
                <Button type="default" className="flex" onClick={onCopyLink}>
                  <AppMaterialIcons icon="link" />
                </Button>
              </Space.Compact>

              <LinkExpiration linkExpiry={linkExpiry} onChangeLinkExpiry={onSetExpirationDate} />

              <SetAPassword
                password={_password}
                onSetPassword={onSetPassword}
                isPasswordProtected={isPasswordProtected}
                onSetPasswordProtected={onSetPasswordProtected}
              />
            </>
          ) : (
            <div className="flex flex-col space-y-2">
              <Text type="secondary">Anyone with the link will be able to view.</Text>

              <Button
                type="default"
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
          <>
            <Divider />

            <div className="flex justify-end space-x-2 px-3 py-2">
              <Button
                type="default"
                loading={isPublishing}
                onClick={async (v) => {
                  onTogglePublish(false);
                }}>
                Unpublish
              </Button>
              <Button onClick={onCopyLink} type="default">
                Copy link
              </Button>
            </div>
          </>
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
      <Text type="primary">Live on the web</Text>
    </div>
  );
});
IsPublishedInfo.displayName = 'IsPublishedInfo';

const useStyles = createStyles(({ token, css }) => {
  return {
    datePicker: css`
      padding-right: 0px;
      input {
        text-align: end !important;
      }

      &:hover {
        .busterv2-picker-input {
          cursor: pointer;
          .busterv2-picker-suffix {
            color: ${token.colorText};
          }
          input {
            cursor: pointer;
          }
          input::placeholder {
            color: ${token.colorText};
          }
        }
      }
    `
  };
});

const LinkExpiration: React.FC<{
  linkExpiry: Date | null;
  onChangeLinkExpiry: (date: Date | null) => void;
}> = React.memo(({ onChangeLinkExpiry, linkExpiry }) => {
  const { cx, styles } = useStyles();
  const dateFormat = 'LL';

  const now = useMemo(() => {
    return createDayjsDate(new Date());
  }, []);

  const maxDate = useMemo(() => {
    return createDayjsDate(new Date()).add(3, 'year');
  }, []);

  const onChangeLinkExpiryPreflight = useMemoizedFn((date: Dayjs | null) => {
    onChangeLinkExpiry(date ? date.toDate() : null);
  });

  const memoizedStyle = useMemo(() => {
    return {
      minWidth: 160
    };
  }, []);

  return (
    <div className="flex items-center justify-between space-x-2">
      <Text>Link expiration</Text>

      <DatePicker
        style={memoizedStyle}
        className={cx(styles.datePicker)}
        defaultValue={linkExpiry ? createDayjsDate(linkExpiry) : undefined}
        format={dateFormat}
        allowClear
        minDate={now}
        maxDate={maxDate}
        placeholder="Never"
        variant="borderless"
        suffixIcon={<AppMaterialIcons icon="keyboard_arrow_down" />}
        onChange={onChangeLinkExpiryPreflight}
        inputReadOnly
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

    const memoizedVisibilityToggle = useMemo(() => {
      return {
        visible: visibilityToggle,
        onVisibleChange: (visible: boolean) => setVisibilityToggle(visible)
      };
    }, [visibilityToggle]);

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
          <Switch checked={isPasswordProtected} onChange={onChangeChecked} />
        </div>

        {isPasswordProtected && (
          <div className="flex w-full items-center space-x-2">
            <div className="flex w-full">
              <Space.Compact className="w-full">
                <Input.Password
                  value={password}
                  onChange={onChangePassword}
                  placeholder="Password"
                  iconRender={iconRender}
                  visibilityToggle={memoizedVisibilityToggle}
                />

                <Button
                  type="default"
                  className="!h-full"
                  icon={
                    !visibilityToggle ? (
                      <AppMaterialIcons icon="visibility" />
                    ) : (
                      <AppMaterialIcons icon="visibility_off" />
                    )
                  }
                  onClick={onClickVisibilityToggle}></Button>
              </Space.Compact>
            </div>

            <Button type="default" disabled={!isPasswordDifferent} onClick={onClickSave}>
              Save
            </Button>
          </div>
        )}
      </div>
    );
  }
);

SetAPassword.displayName = 'SetAPassword';

const iconRender = () => <></>;
