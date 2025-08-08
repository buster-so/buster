import React, { type PropsWithChildren } from 'react';
import type { IColorPalette } from '../ThemeList';
import { useMemoizedFn } from '@/hooks';
import { NewThemePopup } from './NewThemePopup';
import { useAddTheme } from './AddThemeProviderWrapper';

export const EditCustomThemeMenu: React.FC<PropsWithChildren<{ theme: IColorPalette }>> =
  ({ theme, children }) => {
    const { deleteCustomTheme, modifyCustomTheme } = useAddTheme();

    const onSave = useMemoizedFn((theme: IColorPalette) => {
      return modifyCustomTheme(theme.id, theme);
    });

    const onDelete = useMemoizedFn((themeId: string) => {
      return deleteCustomTheme(themeId);
    });

    const onUpdate = useMemoizedFn((theme: IColorPalette) => {
      return modifyCustomTheme(theme.id, theme);
    });

    return (
      <NewThemePopup selectedTheme={theme} onSave={onSave} onDelete={onDelete} onUpdate={onUpdate}>
        {children}
      </NewThemePopup>
    );
  };

EditCustomThemeMenu.displayName = 'EditCustomThemeMenu';
