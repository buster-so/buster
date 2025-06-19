import type { iconProps } from './iconProps';

function monitor(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px monitor';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m9,11.25c-2-.667-4-.667-6,0"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6 10.75L6 8.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="7.5"
          width="10.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(180 6 4.5)"
          x=".75"
          y=".75"
        />
      </g>
    </svg>
  );
}

export default monitor;
