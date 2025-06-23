import type { iconProps } from './iconProps';

function compass(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px compass';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M12.536,5.464l-1.806,4.214c-.202,.472-.578,.848-1.05,1.05l-4.214,1.806,1.806-4.214c.202-.472,.578-.848,1.05-1.05l4.214-1.806Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="9"
          cy="9"
          fill="none"
          r="7.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default compass;
