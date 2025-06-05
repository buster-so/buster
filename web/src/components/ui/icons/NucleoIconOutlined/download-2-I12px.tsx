import type { iconProps } from './iconProps';

function download2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px download 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6 7.5L6 1.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.75 5.5L6 7.75 8.25 5.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m3.5,1.75h-.75C1.645,1.75.75,2.645.75,3.75v4.5c0,1.105.895,2,2,2h6.5c1.105,0,2-.895,2-2V3.75c0-1.105-.895-2-2-2h-.75"
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

export default download2;
