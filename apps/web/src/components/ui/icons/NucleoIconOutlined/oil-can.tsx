import type { iconProps } from './iconProps';

function oilCan(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px oil can';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.75,7.75h5.912c.363,0,.698,.197,.874,.514l.964,1.736,5.75-2.25-4.901,5.792c-.38,.449-.938,.708-1.527,.708H5.75c-1.105,0-2-.895-2-2V7.75Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.25 3.75L9.25 3.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.75 3.75L6.75 5.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.75,11.75h-1c-1.105,0-2-.895-2-2v-1c0-.552,.448-1,1-1H3.75"
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

export default oilCan;
