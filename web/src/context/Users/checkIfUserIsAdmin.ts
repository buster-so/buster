import { getMyUserInfo_server } from '@/api/buster_rest/users/requests';
import { getSupabaseUserContext } from '@/lib/supabase';
import { checkIfUserIsAdmin } from '@/lib/user';
import { useGetMyUserInfo } from '@/api/buster_rest';

export const checkIfUserIsAdmin_server = async (): Promise<boolean> => {
  const supabaseContext = await getSupabaseUserContext();
  const userInfo = await getMyUserInfo_server({ jwtToken: supabaseContext.accessToken });
  const isAdmin = checkIfUserIsAdmin(userInfo);

  return isAdmin;
};

export const useCheckIfUserIsAdmin = () => {
  const { data: userInfo, isFetched } = useGetMyUserInfo();
  const isAdmin = isFetched && checkIfUserIsAdmin(userInfo);
  return isAdmin;
};
