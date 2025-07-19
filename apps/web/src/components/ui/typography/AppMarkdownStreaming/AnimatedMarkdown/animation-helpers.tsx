import type { AnimatedMarkdownProps } from './AnimatedMarkdown';
import React from 'react';
import TokenizedText from './TokenizedText';

export type MarkdownAnimation =
  | 'fadeIn'
  | 'slideUp'
  | 'wave'
  | 'elastic'
  | 'bounceIn'
  | 'rotateIn'
  | 'colorTransition'
  | 'fadeAndScale'
  | 'slideInFromLeft'
  | 'blurIn'
  | 'typewriter'
  | 'highlight'
  | 'blurAndSharpen'
  | 'dropIn';

export type MarkdownAnimationTimingFunction = 'ease-in-out' | 'ease-out' | 'ease-in' | 'linear';

export const animations: Record<MarkdownAnimation, string> = {
  fadeIn: 'buster-fadeIn',
  slideUp: 'buster-slideUp',
  wave: 'buster-wave',
  elastic: 'buster-elastic',
  bounceIn: 'buster-bounceIn',
  rotateIn: 'buster-rotateIn',
  colorTransition: 'buster-colorTransition',
  fadeAndScale: 'buster-fadeAndScale',
  slideInFromLeft: 'buster-slideInFromLeft',
  blurIn: 'buster-blurIn',
  typewriter: 'buster-typewriter',
  highlight: 'buster-highlight',
  blurAndSharpen: 'buster-blurAndSharpen',
  dropIn: 'buster-dropIn'
};

interface AnimationStyleProps {
  animation?: MarkdownAnimation;
  animationDuration?: number;
  isStreamFinished?: boolean;
  animationTimingFunction?: MarkdownAnimationTimingFunction;
}

export const createAnimationStyle = ({
  animation = 'fadeIn',
  animationDuration = 700,
  animationTimingFunction = 'ease-in-out',
  isStreamFinished = true
}: AnimationStyleProps) => {
  return {
    animation:
      animation && !isStreamFinished
        ? `${animations[animation]} ${animationDuration}ms ${animationTimingFunction}`
        : 'none'
  };
};

export const animateTokenizedText = (
  text: string | React.ReactNode,
  animationsProps: Pick<
    AnimatedMarkdownProps,
    'animation' | 'animationDuration' | 'animationTimingFunction' | 'isStreamFinished'
  > & {
    doNotAnimateInitialText?: boolean;
  }
) => {
  if (!animationsProps.animation) {
    return text;
  }

  const tokenizedText = Array.isArray(text) ? text : [text];

  const result = tokenizedText.map((item, index) => {
    if (typeof item === 'string') {
      return <TokenizedText key={`text-${index}`} text={item} {...animationsProps} />;
    } else if (React.isValidElement(item)) {
      const noAnimateElementTypes: Array<React.ElementType> = ['br', 'ul', 'ol', 'td', 'th'];
      let typeName = item.type;
      if (typeof typeName === 'function') {
        typeName = typeName.name;
      }

      if (
        typeof typeName === 'string' &&
        noAnimateElementTypes.includes(typeName as React.ElementType)
      ) {
        // Render these elements directly without an animation wrapper
        return <React.Fragment key={`fragment-${index}`}>{item}</React.Fragment>;
      }

      // For other React elements, wrap them in animation span if they are not container elements
      // whose children are already animated by the `components` prop of ReactMarkdown
      // This else block might still wrap elements if they are not explicitly handled
      // by the ReactMarkdown components mapping (e.g. custom components not passing animateText to children)
      // For standard HTML elements, the `components` mapping should handle animation of children.
      return (
        <span
          key={`react-element-${index}`}
          data-testid="other-markdown-element"
          style={{
            ...createAnimationStyle(animationsProps),
            animationIterationCount: 1,
            whiteSpace: 'pre-wrap',
            display: 'inline-block'
          }}>
          {item}
        </span>
      );
    }
    return (
      <span
        key={`unknown-element-${index}`}
        data-testid="animated-markdown-element"
        style={{
          ...createAnimationStyle(animationsProps),
          animationIterationCount: 1,
          whiteSpace: 'pre-wrap',
          display: 'inline-block'
        }}>
        {item}
      </span>
    );
  });

  return result;
};
