import React from 'react';

import type { iconProps } from './iconProps';

function chatBot(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chat bot';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.75,0h-4.5c-1.241,0-2.25,1.009-2.25,2.25v2c0,1.156,.876,2.111,2,2.236v1.264c0,.296,.174,.564,.444,.685,.098,.043,.202,.065,.306,.065,.182,0,.361-.066,.501-.192l2.013-1.808h1.486c1.241,0,2.25-1.009,2.25-2.25V2.25c0-1.241-1.009-2.25-2.25-2.25Z"
          fill="currentColor"
        />
        <path
          d="M15.25,7.5c-.414,0-.75,.336-.75,.75v6c0,.689-.561,1.25-1.25,1.25H3.75c-.689,0-1.25-.561-1.25-1.25v-5.5c0-.689,.561-1.25,1.25-1.25h4.38c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-2.13V3.792c.446-.26,.75-.738,.75-1.292,0-.828-.672-1.5-1.5-1.5s-1.5,.672-1.5,1.5c0,.554,.304,1.032,.75,1.292v2.208h-.75c-1.517,0-2.75,1.233-2.75,2.75v5.5c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75v-6c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M7,12.5c0,.828,.672,1.5,1.5,1.5s1.5-.672,1.5-1.5c0-.276-.224-.5-.5-.5h-2c-.276,0-.5,.224-.5,.5Z"
          fill="currentColor"
        />
        <circle cx="5.5" cy="11" fill="currentColor" r="1" />
        <circle cx="11.5" cy="11" fill="currentColor" r="1" />
      </g>
    </svg>
  );
}

export default chatBot;
