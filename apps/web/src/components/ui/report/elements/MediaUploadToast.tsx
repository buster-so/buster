'use client';

import * as React from 'react';

import { PlaceholderPlugin, UploadErrorCode } from '@platejs/media/react';
import { usePluginOption } from 'platejs/react';
import { useBusterNotifications } from '@/context/BusterNotifications';

export function MediaUploadToast() {
  useUploadErrorToast();

  return null;
}

const useUploadErrorToast = () => {
  const uploadError = usePluginOption(PlaceholderPlugin, 'error');
  const { openErrorMessage, openInfoMessage } = useBusterNotifications();

  React.useEffect(() => {
    if (!uploadError) return;

    const { code, data } = uploadError;

    switch (code) {
      case UploadErrorCode.INVALID_FILE_SIZE: {
        openErrorMessage(
          `The size of files ${data.files.map((f) => f.name).join(', ')} is invalid`
        );
        break;
      }
      case UploadErrorCode.INVALID_FILE_TYPE: {
        openErrorMessage(
          `The type of files ${data.files.map((f) => f.name).join(', ')} is invalid`
        );
        break;
      }
      case UploadErrorCode.TOO_LARGE: {
        openErrorMessage(
          `The size of files ${data.files
            .map((f) => f.name)
            .join(', ')} is too large than ${data.maxFileSize}`
        );

        break;
      }
      case UploadErrorCode.TOO_LESS_FILES: {
        openErrorMessage(
          `The mini um number of files is ${data.minFileCount} for ${data.fileType}`
        );

        break;
      }
      case UploadErrorCode.TOO_MANY_FILES: {
        openErrorMessage(
          `The maximum number of files is ${data.maxFileCount} ${
            data.fileType ? `for ${data.fileType}` : ''
          }`
        );

        break;
      }
    }
  }, [uploadError]);
};
