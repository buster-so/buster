import React, { useMemo, useState } from 'react';
import { ShimmerText } from '@/components/text';
import { IBusterThreadMessage } from '@/context/Threads/interfaces';
import { AppMaterialIcons } from '@/components/icons';
import { AnimatePresence, motion } from 'framer-motion';
import { Text, Title } from '@/components/text';
import { useAntToken } from '@/styles/useAntToken';
import { BusterThought, BusterThoughtCode, BusterThoughtText } from '@/api/buster_rest';
import { createStyles } from 'antd-style';
import { Collapse, CollapseProps, ConfigProvider } from 'antd';
import { useDebounce, useMemoizedFn } from 'ahooks';

const THOUGHT_MOTION_CONFIG = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.12 }
};

export const AppMessageThoughts: React.FC<IBusterThreadMessage['thoughts']> = React.memo(
  ({ thoughts, title, completed }) => {
    const initialThought = useDebounce(title || 'Understanding your request...', { wait: 550 });
    const showShimmer = !completed || !thoughts?.length;

    return (
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={showShimmer ? 'thought_dropdown' : 'shimmer_text'}
          className="w-full"
          initial={THOUGHT_MOTION_CONFIG.initial}
          animate={THOUGHT_MOTION_CONFIG.animate}
          exit={THOUGHT_MOTION_CONFIG.exit}
          transition={THOUGHT_MOTION_CONFIG.transition}>
          {!showShimmer && <ThoughtDropdown thoughts={thoughts} title={title} />}
          {showShimmer && <ShimmerText text={initialThought} />}
        </motion.div>
      </AnimatePresence>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps?.thoughts?.length === nextProps?.thoughts?.length &&
      prevProps?.title === nextProps?.title &&
      prevProps?.completed === nextProps?.completed
    );
  }
);
AppMessageThoughts.displayName = 'AppMessageThoughts';

const containerStyle = {
  height: '16px',
  width: '16px'
};
const dropdownMotionConfig = {
  initial: { rotate: 180 },
  transition: { duration: 0.2 }
};
const dropdownIconMotionConfig = {
  initial: { height: 5, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  exit: { height: 5, opacity: 0 },
  transition: { duration: 0.2 }
};
const ThoughtDropdown: React.FC<{
  thoughts: IBusterThreadMessage['thoughts']['thoughts'];
  title: IBusterThreadMessage['thoughts']['title'];
}> = React.memo(({ thoughts, title }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { cx, styles } = useDropdownStyles();

  const memoizedAnimate = useMemo(() => {
    return {
      rotate: isOpen ? 0 : 180
    };
  }, [isOpen]);

  const onClickDropdown = useMemoizedFn((e: React.MouseEvent<HTMLDivElement>, value?: boolean) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(value ?? !isOpen);
  });

  const onCloseDropdown = useMemoizedFn((e: React.MouseEvent<HTMLDivElement>) => {
    onClickDropdown(e, false);
  });

  return (
    <div className="flex flex-col">
      <div
        className="flex cursor-pointer items-center space-x-1 overflow-hidden"
        style={{
          maxHeight: 16
        }}
        onClick={onClickDropdown}>
        <Text size="sm" type="secondary" className="select-none">
          {title}
        </Text>
        <div className={cx('flex flex-col items-center justify-center', styles.icon)}>
          <motion.div
            style={containerStyle}
            initial={dropdownMotionConfig.initial}
            animate={memoizedAnimate}
            transition={dropdownMotionConfig.transition}>
            <AppMaterialIcons icon={'expand_less'} />
          </motion.div>
        </div>
      </div>
      <AnimatePresence initial={true}>
        {isOpen && (
          <motion.div
            onClick={onCloseDropdown}
            initial={dropdownIconMotionConfig.initial}
            animate={dropdownIconMotionConfig.animate}
            exit={dropdownIconMotionConfig.exit}
            transition={dropdownIconMotionConfig.transition}>
            <div className="relative flex cursor-pointer space-x-3 overflow-hidden py-3">
              <div className={cx(styles.container, 'absolute left-0 h-full')} />
              <div className="flex flex-col space-y-3">
                {thoughts.map((thought, index) => (
                  <ThoughtSelector key={index} {...thought} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
ThoughtDropdown.displayName = 'ThoughtDropdown';

const TextThought: React.FC<BusterThoughtText> = React.memo(({ title, content }) => {
  return (
    <div className="flex flex-col space-y-1">
      <Title
        level={5}
        style={{
          fontWeight: 500
        }}>
        {title}
      </Title>
      <Text size="sm">{content}</Text>
    </div>
  );
});
TextThought.displayName = 'TextThought';

const useDropdownStyles = createStyles(({ css, token }) => ({
  icon: css`
    color: ${token.colorIcon};
  `,
  container: css`
    border-left: 1px solid ${token.colorBorder};
    top: 8px;
    max-height: calc(100% - 20px);
  `
}));

const useCodeStyles = createStyles(({ css, token, prefixCls }) => ({
  code: css``,
  codeContainer: css`
    background-color: ${token.colorBgContainer};
    border-radius: ${token.borderRadius}px;
    border: 0.5px solid ${token.colorBorder};

    .${prefixCls}-collapse-content-active {
      border-top: 0.5px solid ${token.colorBorder} !important;
      background-color: ${token.colorBgContainer} !important;
    }
  `,
  header: css`
    border-bottom: 0.5px solid ${token.colorBorder};
  `
}));

const CodeThought: React.FC<BusterThoughtCode> = React.memo(({ error, title }) => {
  const { cx, styles } = useCodeStyles();
  const token = useAntToken();

  const items: CollapseProps['items'] = [
    {
      key: '1',
      label: 'Error',
      children: (
        <div className="w-full pt-1">
          <Text>{error}</Text>
        </div>
      )
    }
  ];

  return (
    <div className={cx(styles.codeContainer)} onClick={(e) => e.stopPropagation()}>
      <div className={cx(styles.header, 'flex items-start space-x-1 p-3')}>
        <Text type="danger">
          <AppMaterialIcons icon="report" size={16} />
        </Text>
        <Text type="danger">{title}</Text>
      </div>
      <ConfigProvider
        theme={{
          components: {
            Collapse: {
              headerBg: token.controlItemBgHover,
              headerPadding: '10px 12px',
              contentPadding: '12px',
              colorTextHeading: token.colorTextSecondary
            }
          }
        }}>
        <Collapse bordered={false} items={items} />
      </ConfigProvider>
    </div>
  );
});
CodeThought.displayName = 'CodeThought';

const ThoughtRecord: Record<BusterThought['type'], React.FC<any>> = {
  thoughtBlock: TextThought,
  codeBlock: CodeThought
};

const ThoughtSelector: React.FC<BusterThought> = (thought) => {
  const { type } = thought;
  const SelectedComponent = ThoughtRecord[type] || TextThought;
  return <SelectedComponent {...thought} />;
};
