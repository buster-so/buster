import React from 'react';
import { DatasourceList } from './_DatasourceList';
import { SettingsPageHeader } from '../../_components/SettingsPageHeader';

export default function Page() {
  return (
    <div className="flex h-full w-full flex-col">
      <SettingsPageHeader
        title="Datasources"
        description={`Connect your database, data warehouse, DBT models, & more.`}
      />

      <DatasourceList />
    </div>
  );
}
