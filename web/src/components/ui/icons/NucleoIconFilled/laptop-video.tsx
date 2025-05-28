import React from 'react';

import type { iconProps } from './iconProps';

function laptopVideo(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px laptop video';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17.25,14h-1.065c.194-.377,.315-.798,.315-1.25V7.736c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v5.014c0,.689-.561,1.25-1.25,1.25H4.25c-.689,0-1.25-.561-1.25-1.25V4.75c0-.689,.561-1.25,1.25-1.25h2c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-2c-1.517,0-2.75,1.233-2.75,2.75V12.75c0,.452,.12,.873,.315,1.25H.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H17.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M17.619,1.288c-.234-.133-.525-.129-.754,.011l-1.896,1.137c-.155-1.091-1.085-1.936-2.218-1.936h-2.5c-1.241,0-2.25,1.01-2.25,2.25v1.5c0,1.24,1.009,2.25,2.25,2.25h2.5c1.133,0,2.064-.845,2.218-1.936l1.895,1.136c.119,.072,.253,.108,.387,.108,.127,0,.254-.032,.368-.097,.235-.133,.381-.383,.381-.653V1.941c0-.271-.146-.521-.381-.653Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default laptopVideo;
