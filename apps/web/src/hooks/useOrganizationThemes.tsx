import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { useGetMyUserInfo } from '@/api/buster_rest/users/queryRequests';
import { useUpdateOrganization } from '@/api/buster_rest/organizations/queryRequests';
import type { IColorTheme } from '@/components/features/colors/ThemeList';

export const useOrganizationThemes = () => {
  const { data: userData } = useGetMyUserInfo();
  const { mutateAsync: updateOrganization } = useUpdateOrganization();

  const organization = userData?.organizations?.[0];
  const organizationColorPalettes = organization?.organizationColorPalettes;

  const onCreateCustomTheme = useMemoizedFn(async (theme: IColorTheme) => {
    if (!organization) return;
    await updateOrganization({
      organizationColorPalettes: {
        selectedId: theme.id,
        palettes: [theme, ...organization.organizationColorPalettes.palettes]
      }
    });
  });

  const onDeleteCustomTheme = useMemoizedFn(async (themeId: string) => {
    if (!organization) return;
    const currentThemeId = organization.organizationColorPalettes.selectedId;
    const isSelectedTheme = currentThemeId === themeId;

    await updateOrganization({
      organizationColorPalettes: {
        selectedId: isSelectedTheme ? null : currentThemeId,
        palettes: organization.organizationColorPalettes.palettes.filter(
          (theme) => theme.id !== themeId
        )
      }
    });
  });

  const onModifyCustomTheme = useMemoizedFn(async (themeId: string, theme: IColorTheme) => {
    if (!organization) return;

    await updateOrganization({
      organizationColorPalettes: {
        selectedId: organization.organizationColorPalettes.selectedId,
        palettes: organization.organizationColorPalettes.palettes.map((t) =>
          t.id === themeId ? theme : t
        )
      }
    });
  });

  const onSelectTheme = useMemoizedFn((theme: IColorTheme) => {
    if (!organization) return;

    updateOrganization({
      organizationColorPalettes: {
        selectedId: theme.id,
        palettes: organization.organizationColorPalettes.palettes
      }
    });
  });

  return {
    organization,
    organizationColorPalettes,
    onCreateCustomTheme,
    onDeleteCustomTheme,
    onModifyCustomTheme,
    onSelectTheme
  };
};