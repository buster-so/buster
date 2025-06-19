import type { iconProps } from './iconProps';

function path(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px path';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="4"
          width="4"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="11.25"
          y="10.75"
        />
        <path
          d="M5.25,3.25h7.625c1.312,0,2.375,1.063,2.375,2.375h0c0,1.312-1.063,2.375-2.375,2.375H5.125c-1.312,0-2.375,1.063-2.375,2.375h0c0,1.312,1.063,2.375,2.375,2.375h3.625"
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

export default path;
