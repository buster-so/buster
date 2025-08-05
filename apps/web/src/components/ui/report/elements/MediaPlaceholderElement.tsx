'use client';

import * as React from 'react';

import type { TPlaceholderElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { PlaceholderPlugin, PlaceholderProvider, updateUploadHistory } from '@platejs/media/react';
import { KEYS } from 'platejs';
import { PlateElement, useEditorPlugin, withHOC } from 'platejs/react';
import { useFilePicker } from 'use-file-picker';
import { NodeTypeIcons } from '../config/icons';
import { NodeTypeLabels } from '../config/labels';

import { cn } from '@/lib/utils';
import { useUploadFile } from '@/hooks/useUploadFile';
import type { SelectedFilesOrErrors } from 'use-file-picker/types';

const CONTENT: Record<
  string,
  {
    accept: string[];
    content: React.ReactNode;
    icon: React.ReactNode;
  }
> = {
  [KEYS.audio]: {
    accept: ['audio/*'],
    content: NodeTypeLabels.addAudioFile.label,
    icon: <NodeTypeIcons.audio />
  },
  [KEYS.file]: {
    accept: ['*'],
    content: NodeTypeLabels.addFile.label,
    icon: <NodeTypeIcons.upload />
  },
  [KEYS.img]: {
    accept: ['image/*'],
    content: NodeTypeLabels.addImage.label,
    icon: <NodeTypeIcons.imageSparkle />
  },
  [KEYS.video]: {
    accept: ['video/*'],
    content: NodeTypeLabels.addVideo.label,
    icon: <NodeTypeIcons.filmPlay />
  },
  [KEYS.mediaEmbed]: {
    accept: ['*'],
    content: NodeTypeLabels.addMediaEmbed.label,
    icon: <NodeTypeIcons.filmPlay />
  }
};

export const PlaceholderElement = withHOC(
  PlaceholderProvider,
  function PlaceholderElement(props: PlateElementProps<TPlaceholderElement>) {
    const { editor, element } = props;

    const { api } = useEditorPlugin(PlaceholderPlugin);

    const { isUploading, progress, uploadedFile, uploadFile, uploadingFile } = useUploadFile();

    const loading = isUploading && uploadingFile;

    const currentContent = CONTENT[element.mediaType];

    const isImage = element.mediaType === KEYS.img;

    const imageRef = React.useRef<HTMLImageElement>(null);

    const { openFilePicker } = useFilePicker({
      accept: currentContent.accept,
      multiple: true,
      onFilesSelected: (data: SelectedFilesOrErrors<unknown, unknown>) => {
        if (!data.plainFiles || data.plainFiles.length === 0) return;
        const updatedFiles = data.plainFiles;
        const firstFile = updatedFiles[0];
        const restFiles = updatedFiles.slice(1);
        replaceCurrentPlaceholder(firstFile);
        if (restFiles.length > 0) {
          // Convert File[] to FileList
          const dataTransfer = new DataTransfer();
          restFiles.forEach((file) => dataTransfer.items.add(file));
          editor.getTransforms(PlaceholderPlugin).insert.media(dataTransfer.files);
        }
      }
    });

    const replaceCurrentPlaceholder = React.useCallback(
      (file: File) => {
        void uploadFile(file);
        api.placeholder.addUploadingFile(element.id as string, file);
      },
      [api.placeholder, element.id, uploadFile]
    );

    React.useEffect(() => {
      if (!uploadedFile) return;

      const path = editor.api.findPath(element);

      editor.tf.withoutSaving(() => {
        editor.tf.removeNodes({ at: path });

        const node = {
          children: [{ text: '' }],
          initialHeight: imageRef.current?.height,
          initialWidth: imageRef.current?.width,
          isUpload: true,
          name: element.mediaType === KEYS.file ? uploadedFile.name : '',
          placeholderId: element.id as string,
          type: element.mediaType!,
          url: uploadedFile.url
        };

        editor.tf.insertNodes(node, { at: path });

        updateUploadHistory(editor, node);
      });

      api.placeholder.removeUploadingFile(element.id as string);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uploadedFile, element.id]);

    // React dev mode will call React.useEffect twice
    const isReplaced = React.useRef(false);

    /** Paste and drop */
    React.useEffect(() => {
      if (isReplaced.current) return;

      isReplaced.current = true;
      const currentFiles = api.placeholder.getUploadingFile(element.id as string);

      if (!currentFiles) return;

      replaceCurrentPlaceholder(currentFiles);

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isReplaced]);

    return (
      <PlateElement className="my-1" {...props}>
        {(!loading || !isImage) && (
          <div
            className={cn(
              'bg-muted hover:bg-primary/10 flex cursor-pointer items-center rounded-sm p-3 pr-9 select-none'
            )}
            onClick={() => !loading && openFilePicker()}
            contentEditable={false}>
            <div className="text-muted-foreground/80 relative mr-3 flex [&_svg]:size-6">
              {currentContent.icon}
            </div>
            <div className="text-muted-foreground text-sm whitespace-nowrap">
              <div>{loading ? uploadingFile?.name : currentContent.content}</div>

              {loading && !isImage && (
                <div className="mt-1 flex items-center gap-1.5">
                  <div>{formatBytes(uploadingFile?.size ?? 0)}</div>
                  <div>–</div>
                  <div className="flex items-center">
                    <div className="text-muted-foreground mr-1 size-3.5 animate-spin">
                      <NodeTypeIcons.loader />
                    </div>
                    {progress ?? 0}%
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {isImage && loading && (
          <ImageProgress file={uploadingFile} imageRef={imageRef} progress={progress} />
        )}

        {props.children}
      </PlateElement>
    );
  }
);

export function ImageProgress({
  className,
  file,
  imageRef,
  progress = 0
}: {
  file: File;
  className?: string;
  imageRef?: React.RefObject<HTMLImageElement | null>;
  progress?: number;
}) {
  const [objectUrl, setObjectUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    const url = URL.createObjectURL(file);
    setObjectUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  if (!objectUrl) {
    return null;
  }

  return (
    <div className={cn('relative', className)} contentEditable={false}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imageRef as React.RefObject<HTMLImageElement>}
        className="h-auto w-full rounded-sm object-cover"
        alt={file.name}
        src={objectUrl}
      />
      {progress < 100 && (
        <div className="absolute right-1 bottom-1 flex items-center space-x-2 rounded-full bg-black/50 px-1 py-0.5">
          <div className="text-muted-foreground size-3.5 animate-spin">
            <NodeTypeIcons.loader />
          </div>
          <span className="text-xs font-medium text-white">{Math.round(progress)}%</span>
        </div>
      )}
    </div>
  );
}

function formatBytes(
  bytes: number,
  opts: {
    decimals?: number;
    sizeType?: 'accurate' | 'normal';
  } = {}
) {
  const { decimals = 0, sizeType = 'normal' } = opts;

  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const accurateSizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB'];

  if (bytes === 0) return '0 Byte';

  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / Math.pow(1024, i)).toFixed(decimals)} ${
    sizeType === 'accurate' ? (accurateSizes[i] ?? 'Bytest') : (sizes[i] ?? 'Bytes')
  }`;
}
