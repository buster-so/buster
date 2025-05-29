import type { iconProps } from './iconProps';

function bolt(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px bolt';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m5.417,11.25l4.833-6.5h-4l.333-4L1.75,7.25h4l-.333,4Z"
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

export default bolt;
