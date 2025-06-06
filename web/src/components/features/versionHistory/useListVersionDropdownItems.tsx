import { useMemo } from 'react';
import type { FileType } from '@/api/asset_interfaces/chat';
import type { DropdownItems } from '@/components/ui/dropdown';
import { useGetFileLink } from '@/context/Assets/useGetFileLink';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useMemoizedFn } from '@/hooks';
import { timeFromNow } from '@/lib/date';

export const useListVersionDropdownItems = ({
  versions,
  selectedVersion,
  chatId,
  fileId,
  fileType,
  useVersionHistoryMode
}: {
  selectedVersion: number | undefined;
  versions: {
    version_number: number;
    updated_at: string;
  }[];
  chatId: string | undefined;
  fileId: string;
  fileType: FileType;
  useVersionHistoryMode: boolean;
}) => {
  const { getFileLink } = useGetFileLink();
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);

  const onClickLink = useMemoizedFn((versionNumber: number) => {
    const link = getFileLink({
      fileId,
      fileType,
      chatId,
      useVersionHistoryMode,
      versionNumber
    });

    if (link) onChangePage(link);
  });

  const versionHistoryItems: DropdownItems = useMemo(() => {
    return versions.map(({ version_number, updated_at }) => ({
      label: `Version ${version_number}`,
      secondaryLabel: timeFromNow(updated_at, false),
      value: version_number.toString(),
      selected: version_number === selectedVersion,
      onClick: () => onClickLink(version_number)
    }));
  }, [versions, selectedVersion]);

  return versionHistoryItems;
};
