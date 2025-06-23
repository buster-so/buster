import type { iconProps } from './iconProps';

function returnKey(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px return key';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m1.25,6.75h8.5c.5523,0,1-.4477,1-1v-2.5c0-.5523-.4477-1-1-1h-1.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.75 4L1 6.75 3.75 9.5"
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

export default returnKey;
