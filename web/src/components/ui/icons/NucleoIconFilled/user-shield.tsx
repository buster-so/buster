import React from 'react';

import type { iconProps } from './iconProps';

function userShield(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user shield';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="4.5" fill="currentColor" r="3.5" />
        <path
          d="M9.5,14.94v-2.94c0-.88,.518-1.684,1.319-2.048l.872-.396c-.839-.352-1.747-.555-2.691-.555-2.765,0-5.274,1.636-6.395,4.167-.257,.58-.254,1.245,.008,1.825,.268,.592,.777,1.043,1.399,1.239,1.618,.51,3.296,.769,4.987,.769,.372,0,.743-.018,1.114-.042-.371-.558-.614-1.224-.614-2.018Z"
          fill="currentColor"
        />
        <path
          d="M17.561,11.317l-2.75-1.25c-.197-.09-.424-.09-.621,0l-2.75,1.25c-.268,.122-.439,.389-.439,.683v2.94c0,2.05,2.96,2.938,3.298,3.032,.066,.019,.134,.028,.202,.028s.136-.009,.202-.028c.338-.094,3.298-.982,3.298-3.032v-2.94c0-.294-.172-.561-.439-.683Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default userShield;
