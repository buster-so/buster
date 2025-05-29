import { useInviteUser } from '@/api/buster_rest/users';
import { InputTagInput } from '@/components/ui/inputs/InputTagInput';
import { AppModal } from '@/components/ui/modal';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks';
import { timeout } from '@/lib';
import { validate } from 'email-validator';
import uniq from 'lodash/uniq';
import React, { useMemo } from 'react';

export const InvitePeopleModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = React.memo(({ open, onClose }) => {
  const [emails, setEmails] = React.useState<string[]>([]);
  const { mutateAsync: inviteUsers, isPending: inviting } = useInviteUser();
  const [inputText, setInputText] = React.useState<string>('');
  const { openErrorMessage, openSuccessMessage } = useBusterNotifications();

  const handleInvite = useMemoizedFn(async () => {
    const allEmails = uniq([...emails, inputText].filter((email) => !!email && validate(email)));
    try {
      await inviteUsers({ emails: allEmails });
      onClose();
      openSuccessMessage('Invites sent');
      await timeout(330);
      setEmails([]);
      setInputText('');
    } catch (error) {
      openErrorMessage('Failed to invite users');
    }
  });

  const memoizedHeader = useMemo(() => {
    return {
      title: 'Invite others to join your workspace',
      description:
        'You can share the link below with others you’d like to join your workspace. You can also input their email to send them an invite.'
    };
  }, []);

  const isInputTextValidEmail = useMemo(() => {
    return validate(inputText);
  }, [inputText]);

  const memoizedFooter = useMemo(() => {
    return {
      primaryButton: {
        text: 'Send invites',
        onClick: handleInvite,
        loading: inviting,
        disabled: inputText.length ? !isInputTextValidEmail : emails.length === 0
      }
    };
  }, [inviting, isInputTextValidEmail, emails.length, inputText.length]);

  return (
    <AppModal open={open} onClose={onClose} header={memoizedHeader} footer={memoizedFooter}>
      <div className="flex flex-col">
        <InputTagInput
          tags={emails}
          onChangeText={setInputText}
          onPressEnter={handleInvite}
          onTagAdd={(v) => {
            const arrayedTags = Array.isArray(v) ? v : [v];
            const hadMultipleTags = arrayedTags.length > 1;
            const validTags = arrayedTags.filter((tag) => validate(tag));

            setEmails([...emails, ...validTags]);

            if (validTags.length !== arrayedTags.length) {
              openErrorMessage(hadMultipleTags ? 'List contained invalid emails' : 'Invalid email');
            }
          }}
          onTagRemove={(index) => {
            setEmails(emails.filter((_, i) => i !== index));
          }}
          placeholder="buster@bluthbananas.com, tobias@bluthbananas.com..."
        />
      </div>
    </AppModal>
  );
});

InvitePeopleModal.displayName = 'InvitePeopleModal';
