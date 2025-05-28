import React from 'react';

import type { iconProps } from './iconProps';

function kickScooterElectric(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px kick scooter electric';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="3.25"
          cy="13.25"
          fill="none"
          r="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="14.75"
          cy="13.25"
          fill="none"
          r="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.912,9.339l-1.243-5.799c-.099-.461-.506-.79-.978-.79h-1.442"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2,9.449c.393-.129,.814-.199,1.25-.199,2.209,0,4,1.791,4,4h6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.939,3.761c-.088-.161-.256-.261-.439-.261h-1.102l.526-1.864c.067-.238-.05-.489-.275-.591-.225-.102-.492-.024-.626,.184l-1.942,3c-.099,.154-.107,.35-.02,.511,.088,.161,.256,.261,.439,.261h1.102l-.526,1.864c-.067,.238,.05,.489,.275,.591,.066,.03,.137,.044,.206,.044,.165,0,.325-.082,.42-.228l1.942-3c.099-.154,.107-.35,.02-.511Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default kickScooterElectric;
