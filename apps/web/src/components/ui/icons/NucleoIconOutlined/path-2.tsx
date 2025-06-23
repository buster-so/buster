import type { iconProps } from './iconProps';

function path2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px path 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.25,3.25h7.625c1.312,0,2.375,1.063,2.375,2.375h0c0,1.312-1.063,2.375-2.375,2.375H5.125c-1.312,0-2.375,1.063-2.375,2.375h0c0,1.312,1.063,2.375,2.375,2.375h3.625"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="13.25"
          cy="12.75"
          fill="none"
          r="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default path2;
