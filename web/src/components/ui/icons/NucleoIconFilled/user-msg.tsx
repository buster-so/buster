import React from 'react';

import type { iconProps } from './iconProps';

function userMsg(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user msg';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="4.5" fill="currentColor" r="3.5" />
        <path
          d="M8.5,13.75v-1.5c0-1.312,.68-2.464,1.702-3.135-.394-.069-.794-.115-1.202-.115-2.764,0-5.274,1.636-6.395,4.167-.257,.58-.254,1.245,.008,1.825,.268,.591,.777,1.043,1.399,1.239,1.618,.51,3.296,.769,4.987,.769,.435,0,.87-.019,1.303-.053-1.086-.662-1.803-1.849-1.803-3.197Z"
          fill="currentColor"
        />
        <path
          d="M15.75,10h-3.5c-1.241,0-2.25,1.009-2.25,2.25v1.5c0,1.156,.876,2.111,2,2.236v1.264c0,.296,.174,.564,.444,.685,.098,.043,.202,.065,.306,.065,.182,0,.361-.066,.501-.192l2.013-1.808h.486c1.241,0,2.25-1.009,2.25-2.25v-1.5c0-1.241-1.009-2.25-2.25-2.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default userMsg;
