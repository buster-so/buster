import React from 'react';

import type { iconProps } from './iconProps';

function bookmarks(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bookmarks';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M10.25,4H4.75c-1.517,0-2.75,1.233-2.75,2.75v9.5c0,.283,.159,.542,.412,.669,.252,.128,.555,.102,.783-.065l4.305-3.172,4.305,3.172c.132,.097,.288,.146,.445,.146,.115,0,.231-.026,.338-.081,.253-.127,.412-.387,.412-.669V6.75c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
        <path
          d="M13.25,1H7.75c-.466,0-.927,.119-1.332,.344-.362,.201-.493,.657-.293,1.02,.202,.363,.658,.493,1.02,.292,.188-.104,.391-.156,.605-.156h5.5c.689,0,1.25,.561,1.25,1.25V13.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V3.75c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default bookmarks;
