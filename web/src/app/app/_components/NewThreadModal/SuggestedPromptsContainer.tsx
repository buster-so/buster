import { BusterSearchResult } from '@/api/buster_rest';
import { CircleSpinnerLoader } from '@/components';
import { boldHighlights } from '@/utils/element';
import { createStyles } from 'antd-style';
import React, { useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export const SuggestedPromptsContainer: React.FC<{
  prompts: BusterSearchResult[];
  onSelectPrompt: (prompt: BusterSearchResult) => void;
  open: boolean;
  activeItem: number | null;
  setActiveItem: React.Dispatch<React.SetStateAction<number | null>>;
  navigatingToThreadId: string | null;
}> = React.memo(
  ({ navigatingToThreadId, activeItem, setActiveItem, prompts, open, onSelectPrompt }) => {
    const activeItemId = activeItem !== null ? prompts[activeItem]?.id : null;

    useEffect(() => {
      setActiveItem(null);

      if (open) {
        const handleKeyPress = (event: KeyboardEvent) => {
          if (event.code === 'Enter' && activeItem !== null) {
            event.preventDefault();
            event.stopPropagation();
            onSelectPrompt(prompts[activeItem]);
          }

          if (event.code === 'ArrowDown') {
            setActiveItem((prev) => {
              if (prev === null) {
                return 0;
              }
              return Math.min(prompts.length - 1, prev + 1);
            });
          } else if (event.code === 'ArrowUp') {
            setActiveItem((prev) => {
              if (prev === null) {
                return 0;
              }
              return Math.max(0, prev - 1);
            });
          }
        };

        const handleClick = (e: MouseEvent) => {
          e.stopPropagation();
          e.preventDefault();
          setActiveItem(null);
        };

        document.addEventListener('keydown', handleKeyPress);
        document.addEventListener('click', handleClick);

        return () => {
          document.removeEventListener('keydown', handleKeyPress);
          document.removeEventListener('click', handleClick);
        };
      }
    }, [open, prompts]);

    return (
      <div className="flex max-h-[250px] w-full flex-col overflow-y-auto p-1">
        {prompts.map((prompt, index) => (
          <PromptItem
            key={prompt.id + prompt.updated_at + index}
            {...prompt}
            onSelectPrompt={onSelectPrompt}
            activeItemId={activeItemId}
            loading={navigatingToThreadId === prompt.id}
          />
        ))}
      </div>
    );
  }
);
SuggestedPromptsContainer.displayName = 'SuggestedPromptsContainer';

const PromptItem: React.FC<
  BusterSearchResult & {
    onSelectPrompt: (prompt: BusterSearchResult) => void;
    activeItemId: string | null;
    loading: boolean;
  }
> = ({ onSelectPrompt, activeItemId, loading, ...prompt }) => {
  const { highlights } = prompt;
  const { styles, cx } = useStyles();
  const boldedHTML = boldHighlights(prompt.name, highlights);

  return (
    <div
      className={cx(
        styles.item,
        `flex w-full cursor-pointer items-center space-x-1.5 px-4 transition`,
        prompt.id === activeItemId && 'active'
      )}
      onClick={() => onSelectPrompt(prompt)}>
      {loading && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 'auto', opacity: 1 }}
          transition={{ duration: 0.2 }}>
          <CircleSpinnerLoader size={13} />
        </motion.div>
      )}
      <div className="flex-1">{boldedHTML}</div>
    </div>
  );
};

const useStyles = createStyles(({ token, css }) => ({
  item: css`
    &:hover,
    &.active {
      background-color: ${token.colorBgTextHover};
    }

    white-space: pre;
    min-height: 40px;
    max-height: 40px;
    border-radius: ${token.borderRadius}px;
  `
}));
