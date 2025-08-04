'use client';

import { CaptionPlugin } from '@platejs/caption/react';
import {
  AudioPlugin,
  FilePlugin,
  ImagePlugin,
  MediaEmbedPlugin,
  PlaceholderPlugin,
  VideoPlugin
} from '@platejs/media/react';
import { KEYS } from 'platejs';

import { AudioElement } from '../elements/AudioNode';
import { MediaEmbedElement, MediaEmbedPlaceholder } from '../elements/MediaEmbedNode';
import { FileElement } from '../elements/MediaFileNode';
import { ImageElement } from '../elements/MediaImageNode';
import { PlaceholderElement } from '../elements/MediaPlaceholderElement';
import { MediaPreviewDialog } from '../elements/MediaPreviewDialog';
import { MediaUploadToast } from '../elements/MediaUploadToast';
import { VideoElement } from '../elements/MediaVideoNode';
import { MediaPluginOptions } from '@platejs/media';

export const MediaKit = [
  ImagePlugin.configure({
    options: { disableUploadInsert: true },
    render: { afterEditable: MediaPreviewDialog, node: ImageElement }
  }),
  MediaEmbedPlugin.configure({
    node: {
      component: MediaEmbedElement,
      isSelectable: true,
      isElement: true
    },
    options: {}
  }),

  PlaceholderPlugin.configure({
    options: { disableEmptyPlaceholder: false },
    render: { afterEditable: MediaUploadToast, node: PlaceholderElement }
  }),
  CaptionPlugin.configure({
    options: {
      query: {
        allow: [KEYS.img, KEYS.video, KEYS.audio, KEYS.file, KEYS.mediaEmbed]
      }
    }
  })
  // VideoPlugin.withComponent(VideoElement),
  // AudioPlugin.withComponent(AudioElement),
  // FilePlugin.withComponent(FileElement),
];
