'use client';

import type React from 'react';

import { useGetTerm, useUpdateTerm } from '@/api/buster_rest/terms';
import { Avatar } from '@/components/ui/avatar';
import { Text } from '@/components/ui/typography';
import { formatDate } from '@/lib';
import { DatasetList } from './TermDatasetSelect';

export const TermIndividualContentSider: React.FC<{ termId: string }> = ({ termId }) => {
  const { mutateAsync: updateTerm } = useUpdateTerm();
  const { data: term } = useGetTerm(termId);

  const datasets = term?.datasets || [];

  const onChangeDatasets = async (datasets: string[]) => {
    const add_to_dataset = datasets.filter(
      (item) => !term?.datasets?.some((dataset) => dataset.id === item)
    );
    const remove_from_dataset =
      term?.datasets?.filter((dataset) => !datasets.includes(dataset.id)).map((item) => item.id) ||
      [];

    await updateTerm({
      id: termId,
      add_to_dataset: add_to_dataset.length ? add_to_dataset : undefined,
      remove_from_dataset: remove_from_dataset.length ? remove_from_dataset : undefined
    });
  };

  return (
    <div className="h-full space-y-5 p-4">
      <div className="flex flex-col space-y-2.5">
        <Text variant="secondary" className="text-sm!">
          Datasets that reference this term
        </Text>

        <DatasetList selectedDatasets={datasets} termId={termId} onChange={onChangeDatasets} />
      </div>

      <div className="space-y-2.5">
        <Text variant="secondary" className="text-sm!">
          Created by
        </Text>

        <div className="flex items-center space-x-1.5">
          <Avatar size={24} name={term?.created_by.name} />
          <Text>{term?.created_by.name}</Text>
          <Text variant="secondary">
            (
            {term?.created_at
              ? formatDate({
                  date: term.created_at,
                  format: 'LL'
                })
              : 'Unknown date'}
            )
          </Text>
        </div>
      </div>
    </div>
  );
};
