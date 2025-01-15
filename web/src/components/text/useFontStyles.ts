import { createStyles } from 'antd-style';

export const useFontStyles = createStyles(({ token, css }) => {
  return {
    default: {
      color: `${token.colorText} !important`
    },
    secondary: css`
      color: ${token.colorTextSecondary} !important;

      &.clickable {
        &:hover {
          color: ${token.colorText} !important;
        }
      }
    `,
    tertiary: {
      color: `${token.colorTextTertiary} !important`
    },
    primary: {
      color: `${token.colorPrimary} !important`
    },
    danger: {
      color: `${token.colorError} !important`
    },
    link: {
      color: `${token.colorPrimary} !important`,
      '&:hover': {
        color: `${token.colorPrimaryHover} !important`
      }
    },
    ellipsis: {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  };
});
