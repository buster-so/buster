import type { iconProps } from './iconProps';

function arrowDottedRotateAnticlockwise(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px arrow dotted rotate anticlockwise';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m1.282,3.694C2.136,1.951,3.928.75,6,.75c2.899,0,5.25,2.351,5.25,5.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.25 3.75L1.25 3.75 1.25 0.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="6" cy="11.25" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="3.375" cy="10.547" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="1.453" cy="8.625" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="8.625" cy="10.547" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="10.547" cy="8.625" fill="currentColor" r=".75" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default arrowDottedRotateAnticlockwise;
