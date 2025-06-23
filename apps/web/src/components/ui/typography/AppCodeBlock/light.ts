import type React from 'react';

const magneta5 = '#08979c';
const token = {
  colorTextTertiary: 'var(--color-text-tertiary)',
  colorPrimary: 'var(--color-primary)',
  green3: '#08979c'
};

export default {
  'code[class*="language-"]': {
    color: '#393A34',
    fontFamily: '"Consolas", "Bitstream Vera Sans Mono", "Courier New", Courier, monospace',
    direction: 'ltr',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    fontSize: '.9em',
    lineHeight: '1.2em',
    MozTabSize: '4',
    OTabSize: '4',
    tabSize: '4',
    WebkitHyphens: 'none',
    MozHyphens: 'none',
    msHyphens: 'none',
    hyphens: 'none'
  },
  'pre[class*="language-"]': {
    color: '#393A34',
    fontFamily: '"Consolas", "Bitstream Vera Sans Mono", "Courier New", Courier, monospace',
    direction: 'ltr',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    fontSize: '.9em',
    lineHeight: '1.2em',
    MozTabSize: '4',
    OTabSize: '4',
    tabSize: '4',
    WebkitHyphens: 'none',
    MozHyphens: 'none',
    msHyphens: 'none',
    hyphens: 'none',
    padding: '1em',
    margin: '.5em 0',
    overflow: 'auto',
    border: '1px solid #dddddd',
    backgroundColor: 'white'
  },
  'pre > code[class*="language-"]': {
    fontSize: '1em'
  },
  'pre[class*="language-"]::-moz-selection': {
    background: '#C1DEF1'
  },
  'pre[class*="language-"] ::-moz-selection': {
    background: '#C1DEF1'
  },
  'code[class*="language-"]::-moz-selection': {
    background: '#C1DEF1'
  },
  'code[class*="language-"] ::-moz-selection': {
    background: '#C1DEF1'
  },
  'pre[class*="language-"]::selection': {
    background: '#C1DEF1'
  },
  'pre[class*="language-"] ::selection': {
    background: '#C1DEF1'
  },
  'code[class*="language-"]::selection': {
    background: '#C1DEF1'
  },
  'code[class*="language-"] ::selection': {
    background: '#C1DEF1'
  },
  ':not(pre) > code[class*="language-"]': {
    padding: '.2em',
    paddingTop: '1px',
    paddingBottom: '1px',
    background: '#f8f8f8',
    border: '1px solid #dddddd'
  },
  comment: {
    color: token.colorTextTertiary,
    fontStyle: 'italic'
  },
  prolog: {
    color: '#008000',
    fontStyle: 'italic'
  },
  doctype: {
    color: '#008000',
    fontStyle: 'italic'
  },
  cdata: {
    color: '#008000',
    fontStyle: 'italic'
  },
  namespace: {
    Opacity: '.7'
  },
  string: {
    color: '#b86f08'
  },
  punctuation: {
    color: '#393A34'
  },
  operator: {
    color: '#393A34'
  },
  url: {
    color: token.green3
  },
  symbol: {
    color: magneta5
  },
  number: {
    color: magneta5
  },
  boolean: {
    color: magneta5
  },
  variable: {
    color: magneta5
  },
  constant: {
    color: magneta5
  },
  inserted: {
    color: magneta5
  },
  atrule: {
    color: token.colorPrimary
  },
  keyword: {
    color: token.colorPrimary
  },
  'attr-value': {
    color: token.colorPrimary
  },
  '.language-autohotkey .token.selector': {
    color: token.colorPrimary
  },
  '.language-json .token.boolean': {
    color: token.colorPrimary
  },
  '.language-json .token.number': {
    color: token.colorPrimary
  },
  'code[class*="language-css"]': {
    color: token.colorPrimary
  },
  function: {
    color: '#393A34'
  },
  deleted: {
    color: '#9a050f'
  },
  '.language-autohotkey .token.tag': {
    color: '#9a050f'
  },
  selector: {
    color: '#800000'
  },
  '.language-autohotkey .token.keyword': {
    color: '#00009f'
  },
  important: {
    color: '#e90',
    fontWeight: 'bold'
  },
  bold: {
    fontWeight: 'bold'
  },
  italic: {
    fontStyle: 'italic'
  },
  'class-name': {
    color: '#2B91AF'
  },
  '.language-json .token.property': {
    color: '#2B91AF'
  },
  tag: {
    color: '#800000'
  },
  'attr-name': {
    color: '#ff0000'
  },
  property: {
    color: '#ff0000'
  },
  regex: {
    color: '#ff0000'
  },
  entity: {
    color: '#ff0000'
  },
  'directive.tag.tag': {
    background: '#ffff00',
    color: '#393A34'
  },
  '.line-numbers.line-numbers .line-numbers-rows': {
    borderRightColor: '#a5a5a5'
  },
  '.line-numbers .line-numbers-rows > span:before': {
    color: '#2B91AF'
  },
  '.line-highlight.line-highlight': {
    background: 'linear-gradient(to right, rgba(193, 222, 241, 0.2) 70%, rgba(221, 222, 241, 0))'
  }
} as {
  [key: string]: React.CSSProperties;
};
