'use client';

import clamp from 'lodash/clamp';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useDeleteTerm, useGetTerm, useUpdateTerm } from '@/api/buster_rest/terms';
import { Button } from '@/components/ui/buttons';
import { Card, CardContent, CardHeader } from '@/components/ui/card/CardBase';
import { Dropdown, type DropdownItems } from '@/components/ui/dropdown';
import { CircleQuestion, Dots, EditSquare, Trash } from '@/components/ui/icons';
import { DynamicAppCodeEditor as AppCodeEditor } from '@/components/ui/inputs/AppCodeEditor/DynamicAppCodeEditor';
import { InputTextArea } from '@/components/ui/inputs/InputTextArea';
import { Text } from '@/components/ui/typography';
import { EditableTitle } from '@/components/ui/typography/EditableTitle';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useDebounceFn } from '@/hooks';
import { formatDate } from '@/lib';
import { BusterRoutes } from '@/routes';

export const TermIndividualContent: React.FC<{
  termId: string;
}> = ({ termId }) => {
  const { mutateAsync: updateTerm } = useUpdateTerm();
  const { data: term } = useGetTerm(termId);
  const loadingSelectedTerm = !term?.id;

  const [editingTermName, setEditingTermName] = useState(false);
  const [termName, setTermName] = useState(term?.name || '');
  const [termDefinition, setTermDefinition] = useState(term?.definition || '');
  const [termSQL, setTermSQL] = useState(term?.sql_snippet || '');
  const [sqlHeight, setSqlHeight] = useState(300);

  const onSetTermName = (value: string) => {
    setTermName(value);
    updateTerm({
      id: termId,
      name: value
    });
  };

  const onSetTermDefinition = (value: string) => {
    setTermDefinition(value);
    updateTerm({
      id: termId,
      definition: value
    });
  };

  const onSetTermSQL = useDebounceFn(
    (value: string) => {
      setTermSQL(value);
      updateTerm({
        id: termId,
        sql_snippet: value
      });
    },
    { wait: 500 }
  );

  useEffect(() => {
    setTermName(term?.name || '');
    setTermDefinition(term?.definition || '');
    setTermSQL(term?.sql_snippet || '');
  }, [term?.name, term?.definition]);

  return (
    <>
      <div className="flex flex-col">
        <div className="flex justify-between space-x-3">
          <div className="mb-5 flex flex-col space-y-0.5">
            <div className={'overflow-hidden'}>
              <EditableTitle
                onEdit={setEditingTermName}
                onChange={(v) => {
                  onSetTermName(v);
                }}
                level={4}>
                {termName}
              </EditableTitle>
            </div>
            <div>
              <Text variant="secondary">
                Last updated:{' '}
                {term?.updated_at
                  ? formatDate({
                      date: term.updated_at,
                      format: 'lll'
                    })
                  : 'Unknown date'}
              </Text>
            </div>
          </div>

          <div>
            <MoreDropdown termId={termId} />
          </div>
        </div>

        <div className="flex flex-col space-y-4">
          <ItemContainer title="Definition">
            <div className={'overflow-hidden'}>
              <InputTextArea
                key={term?.id || 'default'}
                defaultValue={term?.definition || termDefinition}
                autoResize={{ minRows: 3, maxRows: 20 }}
                placeholder={'Enter definition...'}
                onBlur={(e) => {
                  onSetTermDefinition(e.target.value);
                }}
                variant="ghost"
              />
            </div>
          </ItemContainer>

          <ItemContainer
            title={
              <div className="flex w-full items-center justify-between space-x-2">
                <Text>SQL Snippet</Text>

                <div className="cursor-pointer">
                  <CircleQuestion />
                </div>
              </div>
            }>
            <div className="relative h-full w-full" style={{ height: sqlHeight }}>
              <AppCodeEditor
                style={{ minHeight: sqlHeight }}
                defaultValue={termSQL}
                onChangeEditorHeight={(v) => {
                  setSqlHeight(clamp(v, 300, 800));
                }}
                onChange={(v) => {
                  onSetTermSQL.run(v);
                }}
              />
            </div>
          </ItemContainer>
        </div>
      </div>
    </>
  );
};

const MoreDropdown: React.FC<{ termId: string }> = ({ termId }) => {
  const { mutateAsync: deleteTerm, isPending: isPendingDeleteTerm } = useDeleteTerm();
  const onChangePage = useAppLayoutContextSelector((s) => s.onChangePage);

  const onDeleteTermsPreflight = async () => {
    await deleteTerm({ ids: [termId] })
      .then(() => {
        onChangePage({
          route: BusterRoutes.APP_TERMS
        });
      })
      .catch((error) => {
        //
      });
  };

  const dropdownItems: DropdownItems = useMemo(
    () => [
      {
        value: 'edit',
        icon: <EditSquare />,
        label: 'Edit term title'
      },
      {
        value: 'delete',
        icon: <Trash />,
        label: 'Delete term',
        loading: isPendingDeleteTerm,
        onClick: onDeleteTermsPreflight
      }
    ],
    [onDeleteTermsPreflight]
  );

  return (
    <Dropdown items={dropdownItems}>
      <Button variant={'ghost'} prefix={<Dots />} />
    </Dropdown>
  );
};

const ItemContainer: React.FC<{
  title: string | React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, children, className }) => {
  return (
    <Card className={className}>
      <CardHeader variant={'gray'}>{title}</CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};
