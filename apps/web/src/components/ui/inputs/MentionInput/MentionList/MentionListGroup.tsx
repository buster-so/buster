import { cn } from '@/lib/utils';
import { type MentionListGroupExtended, MentionListSelector } from './MentionListSelector';

export function MentionListGroup<T = string>({
  items,
  label,
  icon,
  setSelectedItem,
  selectedItem,
  onSelectItem,
  type,
  className,
  disabled, //this is consumed by the children items, we can stylized this if we want
}: MentionListGroupExtended<T>) {
  const hasLabelContent = !!label || !!icon;
  return (
    <div
      className={cn('mention-list-group', className)}
      aria-disabled={disabled}
      data-testid={type}
    >
      {hasLabelContent && (
        <div className="flex items-center pb-1 px-2 pt-2 h-7 text-sm text-gray-dark">
          {icon && <span className="mr-2 text-icon-color">{icon}</span>}
          {label}
        </div>
      )}

      {items.map((item, index) => (
        <MentionListSelector
          key={index}
          {...item}
          selectedItem={selectedItem}
          setSelectedItem={setSelectedItem}
          onSelectItem={onSelectItem}
        />
      ))}
    </div>
  );
}
