import { useBusterNotifications } from '@/context/BusterNotifications';
import { useRouter } from 'next/navigation';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { useMemoizedFn } from '@/hooks';
import { useConfetti } from '@/hooks/useConfetti';

export const useStorageFormSuccess = () => {
  const { openSuccessMessage, openConfirmModal } = useBusterNotifications();
  const { fireConfetti } = useConfetti();
  const router = useRouter();

  return useMemoizedFn(async ({ onCreate }: { onCreate: () => Promise<unknown> }) => {
    await onCreate();
    fireConfetti(9999);
    openConfirmModal({
      preventCloseOnClickOutside: true,
      title: 'Storage connected',
      description:
        'Your storage has been successfully connected. You can now use it to store and retrieve files.',
      content: null,
      primaryButtonProps: {
        text: 'Continue to integrations'
      },
      cancelButtonProps: {
        hide: true
      },
      showClose: false,
      onOk: () =>
        router.push(
          createBusterRoute({
            route: BusterRoutes.SETTINGS_INTEGRATIONS
          })
        )
    });
  });
};
