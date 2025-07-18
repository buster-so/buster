import React from 'react';
import { DefaultThemeSelectorBase } from './DefaultThemeSelectorBase';
import type { IColorTheme } from '../ThemeList';
import { useColorThemes } from '@/api/buster_rest/dictionaries';
import { StatusCard } from '@/components/ui/card/StatusCard';
import { CircleSpinnerLoader } from '../../../ui/loaders';
import { useOrganizationThemes } from '@/hooks/useOrganizationThemes';

export const DefaultThemeSelector = React.memo(
  ({ className, themeListClassName }: { className?: string; themeListClassName?: string }) => {
    const { data: themes, isFetched: isFetchedThemes, isError: isErrorThemes } = useColorThemes();
    const {
      organization,
      organizationColorPalettes,
      onCreateCustomTheme,
      onDeleteCustomTheme,
      onModifyCustomTheme,
      onSelectTheme
    } = useOrganizationThemes();


    if (!organizationColorPalettes || !organization) return null;

    if (!isFetchedThemes) return <CircleSpinnerLoader />;

    if (isErrorThemes)
      return (
        <StatusCard
          title="Error fetching themes"
          message="Something went wrong fetching the themes. Please try again later."
          variant="danger"
        />
      );

    return (
      <DefaultThemeSelectorBase
        customThemes={organizationColorPalettes.palettes}
        selectedThemeId={organizationColorPalettes.selectedId}
        themes={themes || []}
        onCreateCustomTheme={onCreateCustomTheme}
        onDeleteCustomTheme={onDeleteCustomTheme}
        onModifyCustomTheme={onModifyCustomTheme}
        onChangeTheme={onSelectTheme}
        themeListClassName={themeListClassName}
      />
    );
  }
);

DefaultThemeSelector.displayName = 'DefaultThemeSelector';
