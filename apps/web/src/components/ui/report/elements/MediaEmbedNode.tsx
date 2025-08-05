'use client';

import * as React from 'react';
import LiteYouTubeEmbed from 'react-lite-youtube-embed';

import type { TMediaEmbedElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { parseTwitterUrl, parseVideoUrl, type EmbedUrlParser } from '@platejs/media';
import { MediaEmbedPlugin, useMediaState } from '@platejs/media/react';
import { ResizableProvider, useResizableValue } from '@platejs/resizable';
import {
  PlateElement,
  useEditorRef,
  useElement,
  useFocused,
  useReadOnly,
  useSelected,
  withHOC
} from 'platejs/react';

import { cn } from '@/lib/utils';

import { Caption, CaptionTextarea } from './CaptionNode';
import { MediaToolbar } from './MediaToolbar';
import { mediaResizeHandleVariants, Resizable, ResizeHandle } from './ResizeHandle';
import { PopoverAnchor, PopoverBase, PopoverContent } from '../../popover';
import { Text } from '../../typography';
import { Input } from '../../inputs';
import { Button } from '../../buttons';
import { Separator } from '../../separator';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useEffect } from 'react';
import { useClickAway } from '@/hooks/useClickAway';
import { isUrlFromAcceptedDomain } from '@/lib/url';
import { NodeTypeIcons } from '../config/icons';

const parseGenericUrl: EmbedUrlParser = (url: string) => {
  return {
    url,
    provider: 'generic'
  };
};

const urlParsers: EmbedUrlParser[] = [parseTwitterUrl, parseVideoUrl, parseGenericUrl];
const ACCEPTED_DOMAINS = [
  process.env.NEXT_PUBLIC_URL,
  'twitter.com',
  'x.com',
  'youtube.com',
  'vimeo.com'
];

export const MediaEmbedElement = withHOC(
  ResizableProvider,
  function MediaEmbedElement(props: PlateElementProps<TMediaEmbedElement>) {
    const url = props.element.url;
    const {
      align = 'center',
      embed,
      focused,
      isTweet,
      isVideo,
      isYoutube,
      readOnly,
      selected,
      ...rest
    } = useMediaState({
      urlParsers
    });
    const width = useResizableValue('width');
    const provider = embed?.provider;
    const hasElement = !!url;

    if (!hasElement) {
      return <MediaEmbedPlaceholder {...props} />;
    }

    return (
      <MediaToolbar plugin={MediaEmbedPlugin}>
        <PlateElement className="media-embed py-2.5" {...props}>
          <figure className="group relative m-0 w-full cursor-default" contentEditable={false}>
            <Resizable
              align={align}
              options={{
                align,
                maxWidth: isTweet ? 550 : '100%',
                minWidth: isTweet ? 300 : 100
              }}>
              <ResizeHandle
                className={mediaResizeHandleVariants({ direction: 'left' })}
                options={{ direction: 'left' }}
              />

              {isVideo ? (
                isYoutube ? (
                  <LiteYouTubeEmbed
                    id={embed!.id!}
                    title="youtube"
                    wrapperClass={cn(
                      'rounded-sm',
                      focused && selected && 'ring-2 ring-ring ring-offset-2',
                      'relative block cursor-pointer bg-black bg-cover bg-center [contain:content]',
                      '[&.lyt-activated]:before:absolute [&.lyt-activated]:before:top-0 [&.lyt-activated]:before:h-[60px] [&.lyt-activated]:before:w-full [&.lyt-activated]:before:bg-top [&.lyt-activated]:before:bg-repeat-x [&.lyt-activated]:before:pb-[50px] [&.lyt-activated]:before:[transition:all_0.2s_cubic-bezier(0,_0,_0.2,_1)]',
                      '[&.lyt-activated]:before:bg-[url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAADGCAYAAAAT+OqFAAAAdklEQVQoz42QQQ7AIAgEF/T/D+kbq/RWAlnQyyazA4aoAB4FsBSA/bFjuF1EOL7VbrIrBuusmrt4ZZORfb6ehbWdnRHEIiITaEUKa5EJqUakRSaEYBJSCY2dEstQY7AuxahwXFrvZmWl2rh4JZ07z9dLtesfNj5q0FU3A5ObbwAAAABJRU5ErkJggg==)]',
                      'after:block after:pb-[var(--aspect-ratio)] after:content-[""]',
                      '[&_>_iframe]:absolute [&_>_iframe]:top-0 [&_>_iframe]:left-0 [&_>_iframe]:size-full',
                      '[&_>_.lty-playbtn]:z-1 [&_>_.lty-playbtn]:h-[46px] [&_>_.lty-playbtn]:w-[70px] [&_>_.lty-playbtn]:rounded-[14%] [&_>_.lty-playbtn]:bg-[#212121] [&_>_.lty-playbtn]:opacity-80 [&_>_.lty-playbtn]:[transition:all_0.2s_cubic-bezier(0,_0,_0.2,_1)]',
                      '[&:hover_>_.lty-playbtn]:bg-[red] [&:hover_>_.lty-playbtn]:opacity-100',
                      '[&_>_.lty-playbtn]:before:border-y-[11px] [&_>_.lty-playbtn]:before:border-r-0 [&_>_.lty-playbtn]:before:border-l-[19px] [&_>_.lty-playbtn]:before:border-[transparent_transparent_transparent_#fff] [&_>_.lty-playbtn]:before:content-[""]',
                      '[&_>_.lty-playbtn]:absolute [&_>_.lty-playbtn]:top-1/2 [&_>_.lty-playbtn]:left-1/2 [&_>_.lty-playbtn]:[transform:translate3d(-50%,-50%,0)]',
                      '[&_>_.lty-playbtn]:before:absolute [&_>_.lty-playbtn]:before:top-1/2 [&_>_.lty-playbtn]:before:left-1/2 [&_>_.lty-playbtn]:before:[transform:translate3d(-50%,-50%,0)]',
                      '[&.lyt-activated]:cursor-[unset]',
                      '[&.lyt-activated]:before:pointer-events-none [&.lyt-activated]:before:opacity-0',
                      '[&.lyt-activated_>_.lty-playbtn]:pointer-events-none [&.lyt-activated_>_.lty-playbtn]:opacity-0!'
                    )}
                  />
                ) : (
                  <div
                    className={cn(
                      provider === 'vimeo' && 'pb-[75%]',
                      provider === 'youku' && 'pb-[56.25%]',
                      provider === 'dailymotion' && 'pb-[56.0417%]',
                      provider === 'coub' && 'pb-[51.25%]'
                    )}>
                    <iframe
                      className={cn(
                        'absolute top-0 left-0 size-full rounded-sm',
                        isVideo && 'border-0',
                        focused && selected && 'ring-ring ring-2 ring-offset-2'
                      )}
                      title="embed"
                      src={embed!.url}
                      allowFullScreen
                    />
                  </div>
                )
              ) : (
                <div className="bg-gray-light/30 h-full min-h-16 w-full overflow-hidden rounded">
                  <iframe
                    className={cn(
                      'absolute top-0 left-0 size-full min-h-16 rounded-sm',
                      focused && selected && 'ring-ring ring-2 ring-offset-2'
                    )}
                    title="embed"
                    src={embed?.url ?? url}
                    allowFullScreen
                  />
                </div>
              )}

              <ResizeHandle
                className={mediaResizeHandleVariants({ direction: 'right' })}
                options={{ direction: 'right' }}
              />
            </Resizable>

            <Caption style={{ width }} align={align}>
              <CaptionTextarea placeholder="Write a caption..." />
            </Caption>
          </figure>

          {props.children}
        </PlateElement>
      </MediaToolbar>
    );
  }
);

export const MediaEmbedPlaceholder = (props: PlateElementProps<TMediaEmbedElement>) => {
  const readOnly = useReadOnly();
  const selected = useSelected();
  const focused = useFocused();
  const editor = useEditorRef();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const { openInfoMessage } = useBusterNotifications();
  const [forceOpen, setForceOpen] = React.useState(false);
  const element = useElement();

  const isFocused = focused && selected && !readOnly;

  const onAddMedia = () => {
    const url = inputRef.current?.value;
    if (!url) {
      openInfoMessage('Please enter a valid URL');
      return;
    }

    // Check if the URL is from an accepted domain
    const isAccepted = isUrlFromAcceptedDomain(url);

    if (!isAccepted) {
      openInfoMessage(
        `Please enter a valid URL from an accepted domain: ${ACCEPTED_DOMAINS.join(', ')}`
      );
      return;
    }

    // Update the current node with the URL
    editor.tf.setNodes({ url }, { at: editor.api.findPath(props.element) });

    setForceOpen(false);
  };

  useEffect(() => {
    if (isFocused) {
      setForceOpen(true);
    }
  }, [isFocused]);

  useClickAway(
    (e) => {
      setForceOpen(false);
      e.preventDefault();
      e.stopPropagation();
    },
    [popoverRef, anchorRef]
  );

  return (
    <PlateElement className="media-embed py-2.5" {...props}>
      <PopoverBase open={forceOpen}>
        <PopoverAnchor>
          <div
            ref={anchorRef}
            className={cn(
              'bg-muted hover:bg-primary/10 flex cursor-pointer items-center rounded-sm p-3 pr-9 select-none'
            )}
            contentEditable={false}>
            <div className="text-muted-foreground/80 relative mr-3 flex [&_svg]:size-6">
              <NodeTypeIcons.embed />
            </div>

            <div className="text-muted-foreground text-sm whitespace-nowrap">Add a media embed</div>
          </div>
        </PopoverAnchor>

        <PopoverContent
          ref={popoverRef}
          className="flex w-[300px] flex-col px-0 py-2"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
          }}>
          <div className="px-3">
            <Text>Add an embed link</Text>
          </div>

          <Separator className="my-2" />

          <div className="flex flex-col space-y-2 px-3">
            <Input
              placeholder="Paste the link"
              autoFocus
              onPressEnter={onAddMedia}
              ref={inputRef}
            />
            <Button block variant={'black'} onClick={onAddMedia}>
              Add media
            </Button>
          </div>
        </PopoverContent>
      </PopoverBase>

      {props.children}
    </PlateElement>
  );
};
