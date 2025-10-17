export const useRadixDropdownSearch = ({
  showIndex,
  onSelectItem,
  onChange: onChangeProp,
}: {
  showIndex?: boolean;
  onSelectItem?: (index: number) => void;
  onChange: (text: string) => void;
}) => {
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const isFirstCharacter = (e.target as HTMLInputElement).value.length === 0;

    // Only prevent default for digit shortcuts when showIndex is true
    if (showIndex && isFirstCharacter && /^Digit[0-9]$/.test(e.code)) {
      e.preventDefault();
      const index = Number.parseInt(e.key, 10);
      onSelectItem?.(index);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      // Find all visible, non-disabled menu items
      // Look for items in the current dropdown scope (could be main menu or submenu)
      const input = e.target as HTMLInputElement;
      const menuContent = input.closest('[role="menu"]');

      if (menuContent) {
        // Query for all menu item types (menuitem, menuitemcheckbox, menuitemradio)
        const menuItems = Array.from(
          menuContent.querySelectorAll(
            '[role="menuitem"]:not([data-disabled="true"]), [role="menuitemcheckbox"]:not([data-disabled="true"]), [role="menuitemradio"]:not([data-disabled="true"])'
          )
        ).filter((item) => {
          // Filter out items that are not visible
          const element = item as HTMLElement;
          return element.offsetParent !== null;
        }) as HTMLElement[];

        if (menuItems.length > 0) {
          e.preventDefault();
          e.stopPropagation();

          if (e.key === 'ArrowDown') {
            // Focus the first item
            menuItems[0].focus();
          } else if (e.key === 'ArrowUp') {
            // Focus the last item
            menuItems[menuItems.length - 1].focus();
          }
        }
      }
    } else {
      e.stopPropagation();
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    e.preventDefault();
    onChangeProp(e.target.value);
  };

  return {
    onKeyDown,
    onChange,
  };
};
