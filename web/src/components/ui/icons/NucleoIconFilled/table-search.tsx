import React from 'react';

import type { iconProps } from './iconProps';

function tableSearch(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px table search';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.78,15.72l-1.205-1.205c.263-.446,.425-.96,.425-1.514,0-1.654-1.346-3-3-3s-3,1.346-3,3,1.346,3,3,3c.555,0,1.068-.162,1.514-.425l1.205,1.205c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061Zm-5.28-2.72c0-.827,.673-1.5,1.5-1.5s1.5,.673,1.5,1.5c0,.413-.168,.787-.438,1.058,0,0-.002,0-.002,.002s0,.002-.002,.002c-.271,.271-.645,.438-1.058,.438-.827,0-1.5-.673-1.5-1.5Z"
          fill="currentColor"
        />
        <path
          d="M13.25,2H4.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.519,1.231,2.75,2.75,2.75h4.093c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-2.343v-6.5H3.5v-1.5h3V3.5h1.5v3h6.5v2.343c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V4.75c0-1.519-1.231-2.75-2.75-2.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default tableSearch;
