import type { iconProps } from './iconProps';

function stack(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px stack';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M15.75 4.25L15.75 13.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="14.5"
          width="10"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="2.75"
          y="1.75"
        />
      </g>
    </svg>
  );
}

export default stack;
