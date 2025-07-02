import { PrismAsyncLight as SyntaxHighlighterBase } from 'react-syntax-highlighter';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import lightTheme from './light';

SyntaxHighlighterBase.registerLanguage('yaml', yaml);
SyntaxHighlighterBase.registerLanguage('sql', sql);

export const SyntaxHighlighter = (
  props: React.ComponentProps<typeof SyntaxHighlighterBase> & {
    isDarkMode?: boolean;
  }
) => {
  return <SyntaxHighlighterBase {...props} style={lightTheme} />;
};
