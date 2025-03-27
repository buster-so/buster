import { useConfetti } from '@/hooks/useConfetti';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { BusterRoutes } from '@/routes/busterRoutes';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';

export const useDataSourceFormSuccess = () => {
  const { fireConfetti } = useConfetti();
  const { openSuccessMessage, openConfirmModal } = useBusterNotifications();
  const onChangePage = useAppLayoutContextSelector((state) => state.onChangePage);

  const handleCreateSuccess = useMemoizedFn(() => {
    fireConfetti(9999);
    openConfirmModal({
      preventCloseOnClickOutside: true,
      title: 'Data source created',
      description:
        'Hooray! Your datasource has been created. You can now use it in your projects. You will need to create datasets to use with it.',
      content: null,
      primaryButtonProps: {
        text: 'Continue to datasets'
      },
      cancelButtonProps: {
        hide: true
      },
      showClose: false,
      onOk: () =>
        onChangePage({
          route: BusterRoutes.APP_DATASETS
        })
    });
  });

  const handleUpdateSuccess = useMemoizedFn(() => {
    openSuccessMessage('Datasource updated');
  });

  const method = useMemoizedFn(
    async ({
      flow,
      dataSourceId,
      onUpdate,
      onCreate
    }: {
      flow: 'create' | 'update';
      dataSourceId: string | undefined;
      onUpdate: () => Promise<unknown>;
      onCreate: () => Promise<unknown>;
    }) => {
      if (flow === 'update' && dataSourceId) {
        await onUpdate();
        handleUpdateSuccess();
      } else {
        await onCreate();
        handleCreateSuccess();
      }
    }
  );

  return method;
};
