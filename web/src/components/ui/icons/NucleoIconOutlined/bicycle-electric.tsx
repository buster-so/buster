import React from 'react';

import type { iconProps } from './iconProps';

function bicycleElectric(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bicycle electric';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6.068,8.863c-.469-.357-1.048-.572-1.675-.602"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.303,10.723c-.031,.172-.053,.346-.053,.527,0,1.657,1.343,3,3,3s3-1.343,3-3"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.75,11.25l-3.147-7.392c-.157-.369-.519-.608-.92-.608h-1.183"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.621,4.75h.612l2.471,5.804c.14,.33-.102,.696-.46,.696h-2.984c-.414,0-.648-.474-.398-.803l2.435-3.197h4.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.939,5.261c-.088-.161-.256-.261-.439-.261h-1.102l.526-1.864c.067-.238-.05-.489-.275-.591-.225-.102-.492-.024-.626,.184L.08,5.728c-.099,.154-.107,.35-.02,.511,.088,.161,.256,.261,.439,.261H1.602l-.526,1.864c-.067,.238,.05,.489,.275,.591,.066,.03,.137,.044,.206,.044,.165,0,.325-.082,.42-.228l1.942-3c.099-.154,.107-.35,.02-.511Z"
          fill="currentColor"
        />
        <circle
          cx="14.25"
          cy="11.25"
          fill="none"
          r="3"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default bicycleElectric;
