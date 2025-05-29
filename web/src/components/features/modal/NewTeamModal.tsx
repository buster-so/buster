import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useCreateTeam } from '@/api/buster_rest';
import { Input } from '@/components/ui/inputs';
import { AppModal } from '@/components/ui/modal';
import { useMemoizedFn } from '@/hooks';

export const NewTeamModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = React.memo(({ isOpen, onClose }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const { mutateAsync: createTeam, isPending: creatingTeam } = useCreateTeam();

  const disableSubmit = !title;

  const createNewTeamPreflight = useMemoizedFn(async () => {
    if (creatingTeam || disableSubmit) return;
    await createTeam({
      name: title,
      description
    });
    setTimeout(() => {
      onClose();
      setTitle('');
      setDescription('');
    }, 250);
  });

  const onChangeTitle = useMemoizedFn((e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  });

  const footer = useMemo(() => {
    return {
      primaryButton: {
        text: 'Create team',
        onClick: createNewTeamPreflight,
        loading: creatingTeam,
        disabled: disableSubmit
      }
    };
  }, [creatingTeam, disableSubmit]);

  useEffect(() => {
    if (isOpen)
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
  }, [open]);

  return (
    <AppModal
      open={isOpen}
      onClose={onClose}
      header={{
        title: 'Create a team',
        description: `Once created, you'll be able to add team members to the team.`
      }}
      footer={footer}>
      <Input
        ref={inputRef}
        autoFocus
        placeholder="Team name..."
        value={title}
        onChange={onChangeTitle}
        onPressEnter={createNewTeamPreflight}
      />
    </AppModal>
  );
});
NewTeamModal.displayName = 'NewTeamModal';
