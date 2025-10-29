import type { Command } from 'cmdk';
import type { ButtonProps } from '../../buttons';

export type SearchItem<M = unknown, T extends string = string> = {
  icon?: React.ReactNode;
  label: string | React.ReactNode;
  secondaryLabel?: string | React.ReactNode; //displayed below the label
  tertiaryLabel?: string | React.ReactNode; //displayed to the right of the label
  value: T;
  keywords?: string[];
  meta?: M;
  onSelect?: () => void; //should only be used for side effects
  loading?: boolean;
  disabled?: boolean;
  type: 'item';
  selected?: boolean | ((itemId: T) => boolean);
};

export type SearchItemGroup<M = unknown, T extends string = string> = {
  label: string | React.ReactNode;
  items: SearchItem<M, T>[];
  type: 'group';
  className?: string;
  value?: string; //this is used to identify the group in case the heading changes
};

export type SearchItemSeperator = {
  type: 'seperator';
};

export type SearchItems<M = unknown, T extends string = string> =
  | SearchItem<M, T>
  | SearchItemGroup<M, T>
  | SearchItemSeperator;

export type SearchMode = 'select-single' | 'select-multiple' | 'navigate';

export type SearchModalContentProps<M = unknown, T extends string = string> = {
  open: boolean; //is modal open
  value: string;
  filterDropdownContent?: React.ReactNode;
  filterContent?: React.ReactNode;
  searchItems: SearchItems<M, T>[];
  onChangeValue: (searchValue: string) => void;
  onSelect?: (item: SearchItem<M, T>, modifier: 'select' | 'navigate') => void;
  onViewSearchItem: (item: SearchItem<M, T>) => void;
  emptyState?: React.ReactNode | string;
  placeholder?: string;
  loading?: boolean;
  showTopLoading?: boolean;
  showBottomLoading?: boolean;
  secondaryContent?: React.ReactNode | null;
  openSecondaryContent?: boolean; //if undefined it will close and open with the secondary content
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  mode: SearchMode;
  //TODO: type this a little better
  footerConfig?: {
    secondaryButton?: ButtonProps;
    primaryButton?: ButtonProps;
    tertiaryButton?: ButtonProps;
  };
} & Pick<React.ComponentProps<typeof Command>, 'filter' | 'shouldFilter'>;

export type SearchModalProps<M = unknown, T extends string = string> = SearchModalContentProps<
  M,
  T
> & {
  open: boolean;
  onClose: () => void;
  className?: string;
};
