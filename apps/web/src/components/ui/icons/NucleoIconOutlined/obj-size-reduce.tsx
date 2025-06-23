import type { iconProps } from './iconProps';

function objSizeReduce(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px obj size reduce';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.25 1.5L9 3.75 6.75 1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.25 16.5L9 14.25 6.75 16.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.5 11.25L14.25 9 16.5 6.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.5 11.25L3.75 9 1.5 6.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="4.5"
          width="4.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="6.75"
          y="6.75"
        />
      </g>
    </svg>
  );
}

export default objSizeReduce;
