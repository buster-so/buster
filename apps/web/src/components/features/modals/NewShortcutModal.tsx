import { shortcutNameSchema } from '@buster/server-shared/shortcuts';
import React, { useEffect, useMemo, useState } from 'react';
import {
  useCreateShortcut,
  useGetShortcut,
  useListShortcuts,
  useUpdateShortcut,
} from '@/api/buster_rest/shortcuts/queryRequests';
import { Input } from '@/components/ui/inputs';
import { InputTextArea } from '@/components/ui/inputs/InputTextArea';
import { AppModal } from '@/components/ui/modal';
import { Text } from '@/components/ui/typography/Text';
import { inputHasText } from '@/lib/text';

export const NewShortcutModal: React.FC<{
  open: boolean;
  onClose: () => void;
  shortcutId?: string;
}> = React.memo(({ open, onClose, shortcutId }) => {
  const { mutateAsync: createShortcut, isPending: isCreatingShortcut } = useCreateShortcut();
  const { mutateAsync: updateShortcut, isPending: isUpdatingShortcut } = useUpdateShortcut();
  const { data: allShortcuts } = useListShortcuts();
  const { data: shortcut } = useGetShortcut({ id: shortcutId || '' });
  const [name, setName] = useState('');
  const [instructions, setInstructions] = useState('');

  const nameCheckMessage = useMemo(() => {
    if (!name || shortcut?.name === name) return;

    const isDuplicate = allShortcuts?.shortcuts.some((shortcut) => shortcut.name === name);
    if (isDuplicate)
      return 'Shortcut name must be unique, there is already a shortcut with this name';

    const nameCheck = shortcutNameSchema.safeParse(name);
    return nameCheck.error?.issues[0]?.message;
  }, [name]);

  const disableSubmit = !inputHasText(name) || !inputHasText(instructions) || !!nameCheckMessage;
  const isEditMode = !!shortcutId;

  const resetModal = () => {
    setName('');
    setInstructions('');
  };

  useEffect(() => {
    if (shortcut) {
      setName(shortcut.name);
      setInstructions(shortcut.instructions);
    }
  }, [!!shortcut]);

  return (
    <AppModal
      open={open}
      onClose={onClose}
      header={{
        title: 'Create a shortcut',
        description: 'Use shortcuts for your repeatable workflows in Buster.',
      }}
      footer={{
        primaryButton: {
          loading: isCreatingShortcut || isUpdatingShortcut,
          text: isEditMode ? 'Save changes' : 'Create shortcut',
          tooltip: disableSubmit ? 'Please fill in all fields' : undefined,
          onClick: async () => {
            if (disableSubmit) return;
            if (isEditMode) {
              await updateShortcut({
                id: shortcutId,
                name,
                instructions,
                shareWithWorkspace: false,
              });
            } else {
              await createShortcut({ name, instructions, shareWithWorkspace: false });
            }
            onClose();
            setTimeout(() => {
              resetModal();
            }, 350);
          },
          disabled: disableSubmit,
        },
      }}
    >
      <StyleContainer title="Shortcut name">
        <div className="flex flex-col space-y-1">
          <Input
            placeholder="name"
            prefix="/"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {nameCheckMessage && (
            <Text size={'xs'} variant={'danger'}>
              {nameCheckMessage}
            </Text>
          )}
        </div>
      </StyleContainer>
      <StyleContainer title="Shortcut description">
        <InputTextArea
          placeholder="Instructions that Buster should follow when you use this shortcut..."
          minRows={4}
          maxRows={16}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />
      </StyleContainer>
    </AppModal>
  );
});

const StyleContainer = ({ children, title }: { children: React.ReactNode; title: string }) => {
  return (
    <div className="p-0 flex flex-col space-y-1 w-full">
      <Text size={'xs'} variant={'secondary'}>
        {title}
      </Text>
      {children}
    </div>
  );
};
