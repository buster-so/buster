import tailwind from '../../../../../tailwind.config';
const colors = tailwind.theme.extend.colors;

const theme = {
  base: 'vs',
  inherit: true,
  rules: [
    {
      background: 'FFFFFF',
      token: ''
    },
    {
      foreground: '008e00',
      token: 'comment'
    },
    {
      foreground: '7d4726',
      token: 'meta.preprocessor'
    },
    {
      foreground: '7d4726',
      token: 'keyword.control.import'
    },
    {
      foreground: 'df0002',
      token: 'string'
    },
    {
      foreground: '3a00dc',
      token: 'constant.numeric'
    },
    {
      foreground: colors.buster.primary,
      token: 'constant.language'
    },
    {
      foreground: '275a5e',
      token: 'constant.character'
    },
    {
      foreground: '275a5e',
      token: 'constant.other'
    },
    {
      foreground: colors.buster.primary,
      token: 'variable.language'
    },
    {
      foreground: colors.buster.primary,
      token: 'variable.other'
    },
    {
      foreground: colors.buster.primary,
      token: 'keyword'
    },
    {
      foreground: 'c900a4',
      token: 'storage'
    },
    {
      foreground: '438288',
      token: 'entity.name.class'
    },
    {
      foreground: '790ead',
      token: 'entity.name.tag'
    },
    {
      foreground: '450084',
      token: 'entity.other.attribute-name'
    },
    {
      foreground: '450084',
      token: 'support.function'
    },
    {
      foreground: '450084',
      token: 'support.constant'
    },
    {
      foreground: '790ead',
      token: 'support.type'
    },
    {
      foreground: '790ead',
      token: 'support.class'
    },
    {
      foreground: '790ead',
      token: 'support.other.variable'
    }
  ],
  colors: {
    'editor.foreground': '#000000',
    'editor.background': '#FFFFFF',
    'editor.selectionBackground': '#B5D5FF',
    'editor.lineHighlightBackground': '#00000012',
    'editorCursor.foreground': '#000000',
    'editorWhitespace.foreground': '#BFBFBF',
    'inputValidation.infoBorder': '#000000',
    'editorHoverWidget.background': '#FFF',
    'editorHoverWidget.foreground': '#000'
    //--vscode-inputValidation-infoBorder
  }
};

export default theme;
