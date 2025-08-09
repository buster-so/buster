import { useMemo, useCallback } from 'react';
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

  const ParagraphWrapper = useCallback(
    ({ children, className, style }: any) => (
      <ParagraphComponent {...commonProps} className={className} style={style}>
        {children}
      </ParagraphComponent>
    ),
    [commonProps]
  );

  const H1Wrapper = useCallback(
    ({ children, className, style }: any) => (
      <HeaderComponent {...commonProps} tag="h1" className={className} style={style}>
        {children}
      </HeaderComponent>
    ),
    [commonProps]
  );

  const H2Wrapper = useCallback(
    ({ children, className, style }: any) => (
      <HeaderComponent {...commonProps} tag="h2" className={className} style={style}>
        {children}
      </HeaderComponent>
    ),
    [commonProps]
  );

  const H3Wrapper = useCallback(
    ({ children, className, style }: any) => (
      <HeaderComponent {...commonProps} tag="h3" className={className} style={style}>
        {children}
      </HeaderComponent>
    ),
    [commonProps]
  );

  const H4Wrapper = useCallback(
    ({ children, className, style }: any) => (
      <HeaderComponent {...commonProps} tag="h4" className={className} style={style}>
        {children}
      </HeaderComponent>
    ),
    [commonProps]
  );

  const H5Wrapper = useCallback(
    ({ children, className, style }: any) => (
      <HeaderComponent {...commonProps} tag="h5" className={className} style={style}>
        {children}
      </HeaderComponent>
    ),
    [commonProps]
  );

  const H6Wrapper = useCallback(
    ({ children, className, style }: any) => (
      <HeaderComponent {...commonProps} tag="h6" className={className} style={style}>
        {children}
      </HeaderComponent>
    ),
    [commonProps]
  );

  const BlockquoteWrapper = useCallback(
    ({ children, className, style }: any) => (
      <BlockquoteComponent {...commonProps} className={className} style={style}>
        {children}
      </BlockquoteComponent>
    ),
    [commonProps]
  );

  const StrongWrapper = useCallback(
    ({ children, className, style }: any) => (
      <StrongComponent {...commonProps} className={className} style={style}>
        {children}
      </StrongComponent>
    ),
    [commonProps]
  );

  const EmphasisWrapper = useCallback(
    ({ children, className, style }: any) => (
      <EmphasisComponent {...commonProps} className={className} style={style}>
        {children}
      </EmphasisComponent>
    ),
    [commonProps]
  );

  const DeleteWrapper = useCallback(
    ({ children, className, style }: any) => (
      <DeleteComponent {...commonProps} className={className} style={style}>
        {children}
      </DeleteComponent>
    ),
    [commonProps]
  );

  const LinkWrapper = useCallback(
    ({ children, className, style, href }: any) => (
      <LinkComponent {...commonProps} className={className} style={style} href={href}>
        {children}
      </LinkComponent>
    ),
    [commonProps]
  );

  const ImageWrapper = useCallback(
    ({ className, style, src, alt }: any) => (
      <ImageComponent {...commonProps} className={className} style={style} src={src} alt={alt} />
    ),
    [commonProps]
  );

  const HorizontalRuleWrapper = useCallback(
    ({ className, style }: any) => (
      <HorizontalRuleComponent {...commonProps} className={className} style={style} />
    ),
    [commonProps]
  );

  const TableWrapper = useCallback(
    ({ children, className, style }: any) => (
      <TableComponent {...commonProps} className={className} style={style}>
        {children}
      </TableComponent>
    ),
    [commonProps]
  );

  const TableHeadWrapper = useCallback(
    ({ children, className, style }: any) => (
      <TableHeadComponent {...commonProps} className={className} style={style}>
        {children}
      </TableHeadComponent>
    ),
    [commonProps]
  );

  const TableBodyWrapper = useCallback(
    ({ children, className, style }: any) => (
      <TableBodyComponent {...commonProps} className={className} style={style}>
        {children}
      </TableBodyComponent>
    ),
    [commonProps]
  );

  const TableRowWrapper = useCallback(
    ({ children, className, style }: any) => (
      <TableRowComponent {...commonProps} className={className} style={style}>
        {children}
      </TableRowComponent>
    ),
    [commonProps]
  );

  const UnorderedListWrapper = useCallback(
    ({ children, className, style }: any) => (
      <UnorderedListComponent {...commonProps} className={className} style={style}>
        {children}
      </UnorderedListComponent>
    ),
    [commonProps]
  );

  const OrderedListWrapper = useCallback(
    ({ children, className, style, ...rest }: any) => (
      <OrderedListComponent {...commonProps} className={className} style={style} {...rest}>
        {children}
      </OrderedListComponent>
    ),
    [commonProps]
  );

  const ListItemWrapper = useCallback(
    ({ children, className, style }: any) => (
      <ListItemComponent {...commonProps} className={className} style={style}>
        {children}
      </ListItemComponent>
    ),
    [commonProps]
  );

  const TableCellWrapper = useCallback(
    ({ children, className, style }: any) => (
      <TableCellComponent className={className} style={style}>
        {children}
      </TableCellComponent>
    ),
    []
  );

  const TableHeaderCellWrapper = useCallback(
    ({ children, className, style }: any) => (
      <TableHeaderCellComponent className={className} style={style}>
        {children}
      </TableHeaderCellComponent>
    ),
    []
  );

  const BreakWrapper = useCallback(
    ({ className, style }: any) => <BreakComponent className={className} style={style} />,
    []
  );

  const CodeWrapper = useCallback(
    ({ children, className, style, ...rest }: any) => (
      <CodeComponent {...commonProps} className={className} style={style} isInline={true}>
        {children}
      </CodeComponent>
    ),
    [commonProps]
  );

  const components: Components = useMemo(() => {
    return {
      p: ParagraphWrapper,
      h1: H1Wrapper,
      h2: H2Wrapper,
      h3: H3Wrapper,
      h4: H4Wrapper,
      h5: H5Wrapper,
      h6: H6Wrapper,
      blockquote: BlockquoteWrapper,
      strong: StrongWrapper,
      em: EmphasisWrapper,
      del: DeleteWrapper,
      a: LinkWrapper,
      img: ImageWrapper,
      hr: HorizontalRuleWrapper,
      table: TableWrapper,
      thead: TableHeadWrapper,
      tbody: TableBodyWrapper,
      tr: TableRowWrapper,
      ul: UnorderedListWrapper,
      ol: OrderedListWrapper,
      li: ListItemWrapper,
      td: TableCellWrapper,
      th: TableHeaderCellWrapper,
      br: BreakWrapper,
      code: CodeWrapper
    };
  }, [
    ParagraphWrapper,
    H1Wrapper,
    H2Wrapper,
    H3Wrapper,
    H4Wrapper,
    H5Wrapper,
    H6Wrapper,
    BlockquoteWrapper,
    StrongWrapper,
    EmphasisWrapper,
    DeleteWrapper,
    LinkWrapper,
    ImageWrapper,
    HorizontalRuleWrapper,
    TableWrapper,
    TableHeadWrapper,
    TableBodyWrapper,
    TableRowWrapper,
    UnorderedListWrapper,
    OrderedListWrapper,
    ListItemWrapper,
    TableCellWrapper,
    TableHeaderCellWrapper,
    BreakWrapper,
    CodeWrapper
  ]);

  return { components, commonProps };
};
