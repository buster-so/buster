import isEqual from 'lodash/isEqual';
import React, { useMemo } from 'react';
import type { ChartConfigProps } from '@buster/server-shared/metrics';
import { useMemoizedFn } from '@/hooks';
import type { IColorTheme } from '@/components/features/colors/ThemeList';
import { ThemeList } from '@/components/features/colors/ThemeList';
import { useColorThemes } from '@/api/buster_rest/dictionaries';
import { useOrganizationThemes } from '@/hooks/useOrganizationThemes';
import { useUserConfigContextSelector } from '@/context/Users';
import { EditCustomThemeMenu } from '@/components/features/colors/DefaultThemeSelector/EditCustomThemeMenu';
import { AddThemeProviderWrapper } from '@/components/features/colors/DefaultThemeSelector/AddThemeProviderWrapper';

export const ColorsApp: React.FC<{
  colors: ChartConfigProps['colors'];
  onUpdateChartConfig: (chartConfig: Partial<ChartConfigProps>) => void;
}> = ({ colors, onUpdateChartConfig }) => {
  const { data: themes = [] } = useColorThemes();
  const isAdmin = useUserConfigContextSelector((x) => x.isAdmin);
  const {
    organizationColorPalettes,
    onCreateCustomTheme,
    onDeleteCustomTheme,
    onModifyCustomTheme
  } = useOrganizationThemes();

  const organizationPalettes = organizationColorPalettes?.palettes || [];

  const iThemes: Required<IColorTheme>[] = useMemo(() => {
    // Organization themes should show the three dot menu (for admins)
    const orgThemes = organizationPalettes.map((theme) => ({
      ...theme,
      selected: isEqual(theme.colors, colors),
      hideThreeDotMenu: false // Show three dot menu for org themes
    }));

    // Dictionary themes should hide the three dot menu
    const dictThemes = themes.map((theme) => ({
      ...theme,
      selected: isEqual(theme.colors, colors),
      hideThreeDotMenu: true // Hide three dot menu for dictionary themes
    }));

    return [...orgThemes, ...dictThemes];
  }, [themes, organizationPalettes, colors]);

  const onChangeColorTheme = useMemoizedFn((theme: IColorTheme) => {
    onUpdateChartConfig({ colors: theme.colors });
  });

  return (
    <div className="flex flex-col space-y-2">
      <AddThemeProviderWrapper
        createCustomTheme={onCreateCustomTheme}
        deleteCustomTheme={onDeleteCustomTheme}
        modifyCustomTheme={onModifyCustomTheme}>
        <ColorPicker
          themes={iThemes}
          onChangeColorTheme={onChangeColorTheme}
          isAdmin={isAdmin}
        />
      </AddThemeProviderWrapper>
    </div>
  );
};

const ColorPicker: React.FC<{
  themes: Required<IColorTheme>[];
  onChangeColorTheme: (theme: IColorTheme) => void;
  isAdmin: boolean;
}> = React.memo(({ themes, onChangeColorTheme, isAdmin }) => {
  return (
    <ThemeList
      themes={themes}
      onChangeColorTheme={onChangeColorTheme}
      themeThreeDotsMenu={isAdmin ? EditCustomThemeMenu : undefined}
    />
  );
});
ColorPicker.displayName = 'ColorPicker';
