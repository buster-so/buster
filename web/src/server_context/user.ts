import { getMyUserInfo_server } from '@/api/buster_rest/users/requests';
import { getSupabaseServerContext } from '@/context/Supabase/getSupabaseServerContext';
import { checkIfUserIsAdmin } from '@/context/Users/helpers';

export const checkIfUserIsAdmin_server = async (): Promise<boolean> => {
  const supabaseContext = await getSupabaseServerContext();
  const userInfo = await getMyUserInfo_server({ jwtToken: supabaseContext.accessToken });
  const isAdmin = checkIfUserIsAdmin(userInfo);

  return isAdmin;
};
