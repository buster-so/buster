import React from 'react';

import type { iconProps } from './iconProps';

function mortarPestle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px mortar pestle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.225,5.5l1.276-1.756c.536-.745,.366-1.787-.379-2.323-.745-.536-1.787-.366-2.322,.378l-2.688,3.702h4.113Z"
          fill="currentColor"
        />
        <path
          d="M15.25,7H2.75c-.414,0-.75,.336-.75,.75v.25c0,2.441,1.252,4.666,3.304,5.94l-.126,.506c-.094,.376-.012,.767,.227,1.073,.238,.306,.598,.481,.986,.481h5.219c.388,0,.748-.175,.986-.481,.239-.306,.321-.697,.227-1.072l-.126-.507c2.052-1.274,3.304-3.499,3.304-5.94v-.25c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default mortarPestle;
