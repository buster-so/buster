import type React from 'react';
import type { StorageProvider } from '@buster/server-shared/s3-integrations';
import { S3Form } from './S3Form';
import { R2Form } from './R2Form';
import { GCSForm } from './GCSForm';

interface StorageFormContentProps {
  type: StorageProvider;
}

export const StorageFormContent: React.FC<StorageFormContentProps> = ({ type }) => {
  switch (type) {
    case 's3':
      return <S3Form />;
    case 'r2':
      return <R2Form />;
    case 'gcs':
      return <GCSForm />;
    default:
      return null;
  }
};
