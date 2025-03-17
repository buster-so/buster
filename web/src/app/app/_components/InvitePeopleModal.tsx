import React, { useMemo } from 'react';
import { useMemoizedFn } from 'ahooks';
import { AppModal } from '@/components';
import { useUserConfigContextSelector } from '@/context/Users';
import { AppSelectTagInput } from '@/components/select/AppSelectTagInput';
import { Tag } from 'antd';
import { useGetOrganizationUsers } from '@/api/buster_rest/organizations';

export const InvitePeopleModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = React.memo(({ open, onClose }) => {
  const [emails, setEmails] = React.useState<string[]>([]);
  const [inviting, setInviting] = React.useState<boolean>(false);
  const inviteUsers = useUserConfigContextSelector((state) => state.inviteUsers);
  const isAdmin = useUserConfigContextSelector((state) => state.isAdmin);
  const userTeams = useUserConfigContextSelector((state) => state.userTeams);
  const userOrganizations = useUserConfigContextSelector((state) => state.userOrganizations);
  const firstOrganizationId = userOrganizations?.id || '';
  const { refetch } = useGetOrganizationUsers(firstOrganizationId);

  const handleInvite = useMemoizedFn(async () => {
    setInviting(true);
    await inviteUsers(emails);
    refetch();
    setInviting(false);
    onClose();
  });

  const onCloseEmail = useMemoizedFn((email: string) => {
    setEmails(emails.filter((e) => e !== email));
  });

  const memoizedHeader = useMemo(() => {
    return {
      title: 'Invite others to join your workspace',
      description: `You can share the link below with others you’d like to join your workspace. You can also input their email to send them an invite.`
    };
  }, []);

  const memoizedFooter = useMemo(() => {
    return {
      primaryButton: {
        text: 'Send invites',
        onClick: handleInvite,
        loading: inviting,
        disabled: emails.length === 0
      }
    };
  }, [inviting, emails.length]);

  const tagRender = useMemoizedFn((v) => {
    return (
      <Tag
        closable
        onClose={() => {
          onCloseEmail(v.label as string);
        }}>
        {v.label}
      </Tag>
    );
  });

  return (
    <AppModal open={open} onClose={onClose} header={memoizedHeader} footer={memoizedFooter}>
      <div className="flex flex-col">
        <AppSelectTagInput
          useTagRenderer={false}
          value={emails}
          inputType="textarea"
          tagRender={tagRender}
          onChange={setEmails}
          placeholder="buster@bluthbananas.com, tobias@bluthbananas.com..."
        />
      </div>
    </AppModal>
  );
});

InvitePeopleModal.displayName = 'InvitePeopleModal';
