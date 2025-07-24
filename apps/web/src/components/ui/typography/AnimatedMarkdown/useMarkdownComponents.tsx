import { useMemo } from 'react';
import { type MarkdownAnimation, type MarkdownAnimationTimingFunction } from '../animation-common';
import { type Components } from 'react-markdown';
import {
  ParagraphComponent,
  HeaderComponent,
  BlockquoteComponent,
  StrongComponent,
  EmphasisComponent,
  DeleteComponent,
  LinkComponent,
  ImageComponent,
  HorizontalRuleComponent,
  TableComponent,
  TableHeadComponent,
  TableBodyComponent,
  TableRowComponent,
  UnorderedListComponent,
  OrderedListComponent,
  ListItemComponent,
  TableCellComponent,
  TableHeaderCellComponent,
  BreakComponent,
  CodeComponent
} from './MarkdownComponent';

interface UseMarkdownComponentsProps {
  stripFormatting?: boolean;
  animation?: MarkdownAnimation;
  animationDuration?: number;
  isStreamFinished: boolean;
  animationTimingFunction?: MarkdownAnimationTimingFunction;
}

export const useMarkdownComponents = ({
  animation = 'fadeIn',
  animationDuration = 700,
  animationTimingFunction = 'ease-in-out',
  isStreamFinished = true,
  stripFormatting = true
}: UseMarkdownComponentsProps) => {
  const commonProps = useMemo(() => {
    return {
      animation,
      animationDuration,
      animationTimingFunction,
      isStreamFinished,
      stripFormatting
    };
  }, [animation, animationDuration, animationTimingFunction, isStreamFinished, stripFormatting]);

  const components: Components = useMemo(() => {
    return {
      // Components with animations
      p: ({ children, className, style }) => (
        <ParagraphComponent {...commonProps} className={className} style={style}>
          {children}
        </ParagraphComponent>
      ),
      h1: ({ children, className, style }) => (
        <HeaderComponent {...commonProps} tag="h1" className={className} style={style}>
          {children}
        </HeaderComponent>
      ),
      h2: ({ children, className, style }) => (
        <HeaderComponent {...commonProps} tag="h2" className={className} style={style}>
          {children}
        </HeaderComponent>
      ),
      h3: ({ children, className, style }) => (
        <HeaderComponent {...commonProps} tag="h3" className={className} style={style}>
          {children}
        </HeaderComponent>
      ),
      h4: ({ children, className, style }) => (
        <HeaderComponent {...commonProps} tag="h4" className={className} style={style}>
          {children}
        </HeaderComponent>
      ),
      h5: ({ children, className, style }) => (
        <HeaderComponent {...commonProps} tag="h5" className={className} style={style}>
          {children}
        </HeaderComponent>
      ),
      h6: ({ children, className, style }) => (
        <HeaderComponent {...commonProps} tag="h6" className={className} style={style}>
          {children}
        </HeaderComponent>
      ),
      blockquote: ({ children, className, style }) => (
        <BlockquoteComponent {...commonProps} className={className} style={style}>
          {children}
        </BlockquoteComponent>
      ),
      strong: ({ children, className, style }) => (
        <StrongComponent {...commonProps} className={className} style={style}>
          {children}
        </StrongComponent>
      ),
      em: ({ children, className, style }) => (
        <EmphasisComponent {...commonProps} className={className} style={style}>
          {children}
        </EmphasisComponent>
      ),
      del: ({ children, className, style }) => (
        <DeleteComponent {...commonProps} className={className} style={style}>
          {children}
        </DeleteComponent>
      ),
      a: ({ children, className, style, href }) => (
        <LinkComponent {...commonProps} className={className} style={style} href={href}>
          {children}
        </LinkComponent>
      ),
      img: ({ className, style, src, alt }) => (
        <ImageComponent {...commonProps} className={className} style={style} src={src} alt={alt} />
      ),
      hr: ({ className, style }) => (
        <HorizontalRuleComponent {...commonProps} className={className} style={style} />
      ),
      table: ({ children, className, style }) => (
        <TableComponent {...commonProps} className={className} style={style}>
          {children}
        </TableComponent>
      ),
      thead: ({ children, className, style }) => (
        <TableHeadComponent {...commonProps} className={className} style={style}>
          {children}
        </TableHeadComponent>
      ),
      tbody: ({ children, className, style }) => (
        <TableBodyComponent {...commonProps} className={className} style={style}>
          {children}
        </TableBodyComponent>
      ),
      tr: ({ children, className, style }) => (
        <TableRowComponent {...commonProps} className={className} style={style}>
          {children}
        </TableRowComponent>
      ),

      ul: ({ children, className, style }) => (
        <UnorderedListComponent {...commonProps} className={className} style={style}>
          {children}
        </UnorderedListComponent>
      ),
      ol: ({ children, className, style, ...rest }) => (
        <OrderedListComponent {...commonProps} className={className} style={style} {...rest}>
          {children}
        </OrderedListComponent>
      ),
      li: ({ children, className, style }) => {
        return (
          <ListItemComponent {...commonProps} className={className} style={style}>
            {children}
          </ListItemComponent>
        );
      },
      td: ({ children, className, style }) => (
        <TableCellComponent className={className} style={style}>
          {children}
        </TableCellComponent>
      ),
      th: ({ children, className, style }) => (
        <TableHeaderCellComponent className={className} style={style}>
          {children}
        </TableHeaderCellComponent>
      ),
      br: ({ className, style }) => <BreakComponent className={className} style={style} />,
      code: ({ children, className, style, ...rest }) => (
        //we can assume that code is inline if it reach to this point
        <CodeComponent {...commonProps} className={className} style={style} isInline={true}>
          {children}
        </CodeComponent>
      )
    };
  }, [commonProps]);

  return { components, commonProps };
};
