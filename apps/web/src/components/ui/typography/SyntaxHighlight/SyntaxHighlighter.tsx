import { getHighlighter } from 'shiki';
import { useEffect, useState } from 'react';
import { shikiLightTheme } from './shiki-light-theme';

let highlighterInstance: any = null;

export const SyntaxHighlighter = (
  props: {
    children: string;
    language?: string;
    showLineNumbers?: boolean;
    startingLineNumber?: number;
    lineNumberStyle?: React.CSSProperties;
    lineNumberContainerStyle?: React.CSSProperties;
    className?: string;
    customStyle?: React.CSSProperties;
    isDarkMode?: boolean;
  }
) => {
  const [isReady, setIsReady] = useState(false);
  const [highlightedCode, setHighlightedCode] = useState('');

  useEffect(() => {
    const initHighlighter = async () => {
      try {
        if (!highlighterInstance) {
          highlighterInstance = await getHighlighter({
            themes: [shikiLightTheme],
            langs: ['yaml', 'sql', 'javascript', 'typescript', 'json', 'markdown']
          });
        }
        
        const lang = props.language || 'yaml';
        const html = highlighterInstance.codeToHtml(props.children || '', { 
          lang,
          theme: 'buster-light'
        });
        
        setHighlightedCode(html);
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize syntax highlighter:', error);
        setIsReady(true);
      }
    };

    initHighlighter();
  }, [props.children, props.language]);

  if (!isReady) {
    return (
      <pre 
        className={props.className} 
        style={{
          ...props.customStyle,
          fontFamily: '"Consolas", "Bitstream Vera Sans Mono", "Courier New", Courier, monospace',
          fontSize: '.9em',
          lineHeight: '1.2em',
          color: '#393A34',
          margin: 0,
          padding: 0
        }}
      >
        <code>{props.children}</code>
      </pre>
    );
  }

  return (
    <div 
      className={props.className}
      style={props.customStyle}
      dangerouslySetInnerHTML={{ __html: highlightedCode }}
    />
  );
};
