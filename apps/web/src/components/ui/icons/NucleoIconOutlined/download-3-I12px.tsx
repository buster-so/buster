import type { iconProps } from './iconProps';

function download3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px download 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6 8.5L6 0.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.75 6.5L6 8.75 8.25 6.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m3.5,3.75h-.75c-1.105,0-2,.895-2,2v3.5c0,1.105.895,2,2,2h6.5c1.105,0,2-.895,2-2v-3.5c0-1.105-.895-2-2-2h-.75"
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

export default download3;
