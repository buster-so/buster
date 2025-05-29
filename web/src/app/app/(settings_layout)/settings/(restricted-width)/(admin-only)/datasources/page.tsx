import React from 'react';
import { SettingsPageHeader } from '../../../_components/SettingsPageHeader';
import { DatasourceList } from './_DatasourceList';

export default function Page() {
  return (
    <div className="flex h-full w-full flex-col">
      <SettingsPageHeader
        title="Datasources"
        description={'Connect your database, data warehouse, DBT models, & more.'}
      />

      <DatasourceList />
    </div>
  );
}
