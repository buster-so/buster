import type { ThemeRegistration } from 'shiki';

const token = {
  colorTextTertiary: 'var(--color-text-tertiary)',
  colorPrimary: 'var(--color-primary)',
  green3: '#08979c'
};

const magneta5 = '#08979c';

export const shikiLightTheme: ThemeRegistration = {
  name: 'buster-light',
  type: 'light',
  colors: {
    'editor.background': '#ffffff',
    'editor.foreground': '#393A34'
  },
  tokenColors: [
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: {
        foreground: token.colorTextTertiary,
        fontStyle: 'italic'
      }
    },
    {
      scope: ['string'],
      settings: {
        foreground: '#b86f08'
      }
    },
    {
      scope: ['punctuation', 'operator'],
      settings: {
        foreground: '#393A34'
      }
    },
    {
      scope: ['constant.numeric', 'constant.language.boolean', 'variable', 'constant'],
      settings: {
        foreground: magneta5
      }
    },
    {
      scope: ['keyword', 'storage.type', 'storage.modifier'],
      settings: {
        foreground: token.colorPrimary
      }
    },
    {
      scope: ['entity.name.function', 'support.function'],
      settings: {
        foreground: '#393A34'
      }
    },
    {
      scope: ['entity.name.tag', 'support.type.property-name'],
      settings: {
        foreground: '#800000'
      }
    },
    {
      scope: ['entity.other.attribute-name'],
      settings: {
        foreground: '#ff0000'
      }
    },
    {
      scope: ['entity.name.type', 'entity.name.class'],
      settings: {
        foreground: '#2B91AF'
      }
    },
    {
      scope: ['string.regexp'],
      settings: {
        foreground: '#ff0000'
      }
    },
    {
      scope: ['markup.deleted'],
      settings: {
        foreground: '#9a050f'
      }
    },
    {
      scope: ['markup.inserted'],
      settings: {
        foreground: magneta5
      }
    },
    {
      scope: ['markup.bold'],
      settings: {
        fontStyle: 'bold'
      }
    },
    {
      scope: ['markup.italic'],
      settings: {
        fontStyle: 'italic'
      }
    }
  ]
};
