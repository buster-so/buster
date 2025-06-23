import type { iconProps } from './iconProps';

function arrowRotateAnticlockwise(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px arrow rotate anticlockwise';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m1.282,3.694C2.136,1.951,3.928.75,6,.75c2.899,0,5.25,2.351,5.25,5.25s-2.351,5.25-5.25,5.25c-2.34,0-4.322-1.531-5-3.646"
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
      </g>
    </svg>
  );
}

export default arrowRotateAnticlockwise;
