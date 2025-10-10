import { useIsAnonymousUser } from '@/api/buster_rest/users/useGetUserInfo';
import { InvitePeopleModal } from '@/components/features/modals/InvitePeopleModal';
import { SupportModal } from '@/components/features/modals/SupportModal';
import { GlobalSearchModal } from '@/components/features/search/GlobalSearchModal';
import {
  closeContactSupportModal,
  useContactSupportModalStore,
} from '@/context/GlobalStore/useContactSupportModalStore';
import { closeInviteModal, useInviteModalStore } from '@/context/GlobalStore/useInviteModalStore';

const GlobalModals = () => {
  const { openInviteModal } = useInviteModalStore();
  const isAnonymousUser = useIsAnonymousUser();
  const { formType } = useContactSupportModalStore();

  if (isAnonymousUser) return null;

  return (
    <>
      <InvitePeopleModal open={openInviteModal} onClose={closeInviteModal} />
      <SupportModal formType={formType} onClose={closeContactSupportModal} />
      <GlobalSearchModal />
    </>
  );
};
GlobalModals.displayName = 'GlobalModals';

export default GlobalModals;
