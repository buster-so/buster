import { BusterShareAssetType } from '@/api/busterv2';
import { AppMaterialIcons, AppTooltip } from '@/components';
import { useUserConfigContextSelector } from '@/context/Users';
import React, { useCallback, useMemo } from 'react';
import { gold } from '@ant-design/colors/es/presets';
import { css } from 'antd-style';
import { createStyles } from 'antd-style';
import { useMemoizedFn } from 'ahooks';
import { Button } from 'antd';

const useStyles = createStyles(({ token }) => ({
  icon: css`
    color: ${token.colorIcon};

    &.tertiary {
      color: ${token.colorTextTertiary};
    }

    &.is-favorited {
      color: ${gold[4]} !important;
    }

    &:not(.is-favorited):hover {
      color: ${token.colorIconHover};
    }
  `
}));

export const FavoriteStar: React.FC<{
  id: string;
  type: BusterShareAssetType;
  name: string;
  className?: string;
  iconStyle?: 'default' | 'tertiary';
}> = React.memo(({ name, id, type, className = '', iconStyle = 'default' }) => {
  const userFavorites = useUserConfigContextSelector((state) => state.userFavorites);
  const removeItemFromFavorite = useUserConfigContextSelector(
    (state) => state.removeItemFromFavorite
  );
  const addItemToFavorite = useUserConfigContextSelector((state) => state.addItemToFavorite);
  const { cx, styles } = useStyles();

  const isFavorited = useMemo(() => {
    return userFavorites.some((favorite) => favorite.id === id || favorite.collection_id === id);
  }, [userFavorites, id]);

  const onFavoriteClick = useMemoizedFn(async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isFavorited)
      return await addItemToFavorite({
        asset_type: type,
        id,
        name
      });

    await removeItemFromFavorite({
      asset_type: type,
      id
    });
  });

  const tooltipText = isFavorited ? 'Remove from favorites' : 'Add to favorites';

  return (
    <AppTooltip title={tooltipText} performant key={tooltipText}>
      <Button
        classNames={{
          icon: '!text-inherit !mt-[-2px]'
        }}
        className={cx(className, 'flex', styles.icon, iconStyle, { 'is-favorited': isFavorited })}
        onClick={onFavoriteClick}
        type="text"
        icon={<AppMaterialIcons icon="star" fill={isFavorited} />}
      />
    </AppTooltip>
  );
});
FavoriteStar.displayName = 'FavoriteStar';
