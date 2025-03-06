import React, { PropsWithChildren } from 'react';
import { ThemeProvider as NextThemeProvider } from 'next-themes';
import { BusterNotificationsProvider } from '../BusterNotifications';
import 'react-material-symbols/rounded';

const ENABLE_DARK_MODE = false;

export const BusterStyleProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={ENABLE_DARK_MODE}
      themes={['light', 'dark']}
      disableTransitionOnChange>
      <BusterNotificationsProvider>{children}</BusterNotificationsProvider>
    </NextThemeProvider>
  );
};

// import 'react-material-symbols/rounded';
// import React, { PropsWithChildren } from 'react';
// import { ThemeProvider as NextThemeProvider } from 'next-themes';
// import { BusterNotificationsProvider } from '../BusterNotifications';

// const ENABLE_DARK_MODE = false;

// export const BusterStyleProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
//   return (
//     <NextThemeProvider
//       attribute="class"
//       defaultTheme="light"
//       enableSystem={ENABLE_DARK_MODE}
//       themes={['light', 'dark']}
//       disableTransitionOnChange>
//       <BusterNotificationsProvider>{children}</BusterNotificationsProvider>
//     </NextThemeProvider>
//   );
// };
/*
'use client';

import 'react-material-symbols/rounded';
import React, { PropsWithChildren } from 'react';
import { usePreventBackwardNavigation } from '@/hooks/dom/usePreventBackwardsNavigation';
import { App, ConfigProvider, theme, ThemeConfig } from 'antd';
import {
  busterAppStyleConfig,
  busterAppStyleConfigDark,
  useBusterAppComponentConfig
} from '@/styles/busterAntDStyleConfig';
import { ThemeProvider } from 'antd-style';
import { ThemeProvider as NextThemeProvider, useTheme as useNextTheme } from 'next-themes';
import StyleRegistry from './StyleRegistry';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { createContext, useContextSelector } from 'use-context-selector';
import { BusterNotificationsProvider } from '../BusterNotifications';

const { defaultAlgorithm, darkAlgorithm } = theme;

export const ENABLE_DARK_MODE = false;

export const BaseBusterStyleProvider: React.FC<PropsWithChildren<{}>> = React.memo(
  ({ children }) => {
    usePreventBackwardNavigation();

    const nextThemeMode = useNextTheme();
    const isDarkMode =
      ENABLE_DARK_MODE &&
      (nextThemeMode.theme === 'dark' || nextThemeMode.resolvedTheme === 'dark');
    const selectedTheme = !isDarkMode ? busterAppStyleConfig : busterAppStyleConfigDark;
    const selectedAlgorithm = isDarkMode ? darkAlgorithm : defaultAlgorithm;
    const token = selectedTheme.token!;

    const busterAppComponentConfig = useBusterAppComponentConfig();

    const cssVariables = {
      '--focus-border': '#E5E5E5',
      '--separator-border': token.colorBorder
    };

    return (
      <StyleRegistry>
        <BusterStyles.Provider value={{ theme: selectedTheme }}>
          <ThemeProvider
            themeMode={isDarkMode ? 'dark' : 'light'}
            appearance={isDarkMode ? 'dark' : 'light'}
            prefixCls="busterv2"
            theme={{
              algorithm: selectedAlgorithm,
              ...selectedTheme
            }}>
            <ConfigProvider
              popupMatchSelectWidth={false}
              virtual={true}
              locale={{
                locale: 'en'
              }}
              {...busterAppComponentConfig}>
              <App
                message={{
                  maxCount: 4,
                  duration: 2.5
                }}
                className="min-h-[100vh] w-full text-base"
                style={{
                  ...(cssVariables as any)
                }}>
                <BusterNotificationsProvider>{children}</BusterNotificationsProvider>
                <div id="modal-root"></div>
              </App>
            </ConfigProvider>
          </ThemeProvider>
        </BusterStyles.Provider>
      </StyleRegistry>
    );
  }
);
BaseBusterStyleProvider.displayName = 'BusterStyleProvider';

export const BusterStyleProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  return (
    <AntdRegistry>
      <NextThemeProvider
        attribute="class"
        enableSystem={ENABLE_DARK_MODE}
        themes={['light', 'dark']}>
        <BaseBusterStyleProvider>{children}</BaseBusterStyleProvider>
      </NextThemeProvider>
    </AntdRegistry>
  );
};

const BusterStyles = createContext<{ theme: ThemeConfig }>({
  theme: busterAppStyleConfig
});

type ContextSelector<T> = (value: { theme: ThemeConfig }) => T;

export const useBusterStylesContext = <T,>(selector: ContextSelector<T>) => {
  return useContextSelector(BusterStyles, selector);
};

// Example usage:
// const theme = useBusterStylesContext(state => state.theme);
// const specificToken = useBusterStylesContext(state => state.theme.token?.colorPrimary);
*/
