import uniq from 'lodash/uniq';
import React, { useMemo } from 'react';
import { useInviteUser } from '@/api/buster_rest/users';
import { InputTagInput } from '@/components/ui/inputs/InputTagInput';
import { AppModal } from '@/components/ui/modal';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { isValidEmail } from '@/lib/email';
import { timeout } from '@/lib/timeout';

export const InvitePeopleModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = React.memo(({ open, onClose }) => {
  const [emails, setEmails] = React.useState<string[]>([]);
  const { mutateAsync: inviteUsers, isPending: inviting } = useInviteUser();
  const [inputText, setInputText] = React.useState<string>('');
  const { openErrorMessage, openSuccessMessage } = useBusterNotifications();

  const handleInvite = useMemoizedFn(async () => {
    const allEmails = uniq(
      [...emails, inputText].filter((email) => !!email && isValidEmail(email))
    );
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
      description: 'Enter the emails of the people you want to invite to your workspace.',
    };
  }, []);

  const isInputTextValidEmail = useMemo(() => {
    return isValidEmail(inputText);
  }, [inputText]);

  const memoizedFooter = useMemo(() => {
    return {
      primaryButton: {
        text: 'Send invites',
        onClick: handleInvite,
        loading: inviting,
        disabled: inputText.length ? !isInputTextValidEmail : emails.length === 0,
      },
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
            const validTags = arrayedTags.filter((tag) => isValidEmail(tag));

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
