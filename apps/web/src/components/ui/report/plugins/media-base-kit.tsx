import { BaseCaptionPlugin } from '@platejs/caption';
import {
  BaseAudioPlugin,
  BaseFilePlugin,
  BaseImagePlugin,
  BaseMediaEmbedPlugin,
  BasePlaceholderPlugin,
  BaseVideoPlugin
} from '@platejs/media';
import { KEYS } from 'platejs';

import { AudioElementStatic } from '../elements/MediaAudioNodeStatic';
import { FileElementStatic } from '../elements/MediaFileNodeStatic';
import { ImageElementStatic } from '../elements/MediaImageNodeStatic';
import { VideoElementStatic } from '../elements/MediaVideoNodeStatic';

export const BaseMediaKit = [
  BaseImagePlugin.withComponent(ImageElementStatic),
  BaseVideoPlugin.withComponent(VideoElementStatic),
  BaseAudioPlugin.withComponent(AudioElementStatic),
  BaseFilePlugin.withComponent(FileElementStatic),
  BaseCaptionPlugin.configure({
    options: {
      query: {
        allow: [KEYS.img, KEYS.video, KEYS.audio, KEYS.file, KEYS.mediaEmbed]
      }
    }
  }),
  BaseMediaEmbedPlugin,
  BasePlaceholderPlugin
];
